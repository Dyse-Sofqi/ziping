// CodeMirror 6 ViewPlugin — 全编辑器级别的左侧固定排盘面板
//
// 架构：
//   面板挂载到 document.body（避免 CM6 viewport 回收），position:fixed 定位于
//   .view-content 的左侧水槽区域。ViewPlugin 仅负责生命周期（destroy 时移除面板）
//   和内容调度（扫描文档中的 ```ziping left``` 块，找到"活跃"块后异步渲染）。
//
//   面板不占用正文空间 — position:fixed 叠加在水槽上方，不推挤任何元素。

import { ViewPlugin, ViewUpdate, EditorView } from '@codemirror/view';
import type { RenderController } from './ZipingCodeBlockRenderer';

// ── 全局控制器注册表：侧边栏视图 / 阅读模式代码块可注册 RenderController ──
// CM6 ViewPlugin 检测到逆向匹配时，同时通知全局注册的控制器
const globalControllers = new Set<RenderController>();

/** 注册全局控制器（侧边栏视图等非 ViewPlugin 视图调用） */
export function registerGlobalController(ctrl: RenderController): void {
    globalControllers.add(ctrl);
}

/** 注销全局控制器 */
export function unregisterGlobalController(ctrl: RenderController): void {
    globalControllers.delete(ctrl);
}

// ── 阅读模式光标跟踪 ──
// CM6 ViewPlugin 不存在于阅读模式，需要全局 selectionchange 监听
let readingModeListenerActive = false;

function findYearAndPaiPanCodeFromNode(node: Node | null): { year: number; paiPanCode: string } | null {
    // 向上查找包含完整列表上下文的祖先元素
    let el = (node?.nodeType === 3 ? (node as Text).parentElement : node) as HTMLElement | null;
    if (!el) return null;

    // 找到当前光标所在的列表项
    const li = el.closest('li');
    if (!li) return null;

    // 从 li 文本中提取年份
    const liText = li.textContent || '';
    const yearMatch = /- [*=_~]*(\d{4})年/.exec(liText);
    if (!yearMatch) return null;
    const year = parseInt(yearMatch[1], 10);

    // 向上搜索相邻的 li，查找 paiPanCode
    let prev = li.previousElementSibling as HTMLElement | null;
    while (prev) {
        const prevText = prev.textContent || '';
        const codeMatch = /(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}-[YX])/.exec(prevText);
        if (codeMatch) return { year, paiPanCode: codeMatch[1] };
        prev = prev.previousElementSibling as HTMLElement | null;
    }

    return null;
}

function onReadingModeSelectionChange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const node = sel.anchorNode;
    if (!node) return;

    // 仅处理阅读视图内的选择
    const viewEl = (node as Node).parentElement?.closest('.markdown-reading-view');
    if (!viewEl) return;

    const result = findYearAndPaiPanCodeFromNode(node as Node);
    if (!result) return;

    for (const ctrl of globalControllers) {
        if (ctrl.getPaiPanCode() === result.paiPanCode) {
            ctrl.selectLiunianByYear(result.year);
        }
    }
}

/** 启用阅读模式光标跟踪（插件启动时调用一次） */
export function startReadingModeTracker(): void {
    if (readingModeListenerActive) return;
    readingModeListenerActive = true;
    document.addEventListener('selectionchange', onReadingModeSelectionChange);
}

// ── 正则 ──
// 匹配 \t- [markdown格式标记]{可选的} {paiPanCode | NNNN年}
const YEAR_LINE_RE = /^\t- [*=_~]*(\d{4})年/;
const PAIPANCODE_RE = /\t- [*=_~]*(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}-[YX])/g;
const ZIPING_BLOCK_RE = /```ziping\s*\n((?:.+\n)*?)```/g;

interface LeftBlock {
    start: number;
    end: number;
    codes: string[];
}

export function zipingLeftViewPlugin(
    renderCodes: (codes: string[], parent: HTMLElement, onLiunianNavigate?: (year: number) => void) => Promise<RenderController[]>,
) {
    return ViewPlugin.fromClass(
        class {
            private readonly panel: HTMLElement;
            private readonly wrapper: HTMLElement;
            private renderedKey = '';
            private requestId = 0;
            private observer: ResizeObserver | null = null;
            private panelObserver: ResizeObserver | null = null;
            private visibilityObserver: IntersectionObserver | null = null;
            private readonly scroller: HTMLElement;
            private controllers: RenderController[] = [];

            constructor(readonly view: EditorView) {
                this.scroller = view.scrollDOM as HTMLElement;

                // 面板挂载到 body，position:fixed 在 view-content 左侧水槽
                this.panel = document.createElement('div');
                this.panel.className = 'ziping-left-panel-cm';
                this.wrapper = this.panel.createDiv('ziping-left-panel-cm-content');
                document.body.appendChild(this.panel);

                this.updatePosition();

                // 监听 view-content 尺寸变化（侧边栏折叠）
                const vc = view.dom.closest('.view-content') as HTMLElement | null;
                if (vc) {
                    this.observer = new ResizeObserver(() => this.updatePosition());
                    this.observer.observe(vc);

                    // IntersectionObserver：检测 view-content 离开/进入视口
                    // （设置标签页 / Style Settings 打开时 view-content 被隐藏）
                    this.visibilityObserver = new IntersectionObserver((entries) => {
                        for (const entry of entries) {
                            if (entry.isIntersecting && this.renderedKey) {
                                // 标签页切回 → 显示面板
                                this.panel.style.display = '';
                                this.updatePosition();
                            } else if (!entry.isIntersecting) {
                                // 标签页被覆盖 → 隐藏面板
                                this.panel.style.display = 'none';
                                this.scroller.style.paddingLeft = '';
                            }
                        }
                    });
                    this.visibilityObserver.observe(vc);
                }

                // 监听面板自身尺寸变化（内容展开/折叠）→ 同步调整 scroller 内边距
                this.panelObserver = new ResizeObserver(() => this.pushScroller());
                this.panelObserver.observe(this.panel);

                this.scheduleScan();
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet || update.viewportChanged) {
                    // 逆向匹配：光标落在 \t- {year}年 行 → 选中对应流年
                    if (update.selectionSet) {
                        this.handleCursorOnYearLine();
                    }
                    this.scheduleScan();
                }
            }

            destroy() {
                this.observer?.disconnect();
                this.panelObserver?.disconnect();
                this.visibilityObserver?.disconnect();
                cancelAnimationFrame(this.requestId);
                this.scroller.style.paddingLeft = '';
                this.panel.remove();
            }

            // ── 定位：贴 .view-content 左边缘，垂直居中 ──
            // IntersectionObserver 负责隐藏/显示。这里只做定位 + 推挤 scroller。
            private updatePosition() {
                const vc = this.view.dom.closest('.view-content') as HTMLElement | null;
                if (!vc || !document.body.contains(this.panel)) return;
                const r = vc.getBoundingClientRect();
                if (r.width === 0 || r.height === 0) return; // not visible, ignore

                this.panel.style.left = r.left + 'px';
                // 垂直居中（最小 20px 顶部间距）
                const ph = this.panel.offsetHeight || 200;
                this.panel.style.top = (r.top + Math.max((r.height - ph) / 2, 20)) + 'px';
                this.panel.style.maxHeight = (r.height - 40) + 'px';
                this.pushScroller();
            }

            // ── 将 scroller 向右推，让出面板宽度 ──
            private pushScroller() {
                if (this.panel.style.display === 'none' || !document.body.contains(this.panel)) return;
                const pw = this.panel.offsetWidth;
                if (pw > 0) {
                    this.scroller.style.paddingLeft = pw + 'px';
                }
            }

            // ── 逆向匹配：光标落在 \t- {year}年 行 → 搜索关联排盘码 → 触发流年选中 ──
            private handleCursorOnYearLine() {
                try {
                    const pos = this.view.state.selection.main.head;
                    const line = this.view.state.doc.lineAt(pos);
                    const lineText = line.text;

                    // 当前行匹配 [缩进]- [*=_~]*{year}年（兼容 tab / 2+空格缩进的二级列表）
                    const yearMatch = /(?:^\t|^ {2,})- [*=_~]*(\d{4})年/.exec(lineText);
                    if (!yearMatch) return;
                    const year = parseInt(yearMatch[1], 10);

                    // 从该行向上搜索首个 paiPanCode（同缩进风格）
                    const text = this.view.state.doc.toString();
                    const before = text.slice(0, line.from);
                    const codeRe = /(?:^\t|^ {2,})- [*=_~]*(\d{4}\.\d{2}\.\d{2}-\d{2}\.\d{2}-[YX])/gm;
                    const matches = [...before.matchAll(codeRe)];
                    if (matches.length === 0) return;
                    const paiPanCode = matches[matches.length - 1][1];

                    // 通知所有匹配的控制器（左面板 + 全局注册的视图）
                    for (const ctrl of this.controllers) {
                        if (ctrl.getPaiPanCode() === paiPanCode) {
                            ctrl.selectLiunianByYear(year);
                        }
                    }
                    for (const ctrl of globalControllers) {
                        if (ctrl.getPaiPanCode() === paiPanCode) {
                            ctrl.selectLiunianByYear(year);
                        }
                    }
                } catch {
                    // 逆向匹配失败不破坏面板渲染
                }
            }

            // ── 扫描 + 渲染 ──
            private scheduleScan() {
                cancelAnimationFrame(this.requestId);
                this.requestId = requestAnimationFrame(() => this.scanAndRender());
            }

            private scanAndRender() {
                const text = this.view.state.doc.toString();
                const blocks = findAllLeftBlocks(text);

                if (blocks.length === 0) {
                    this.panel.style.display = 'none';
                    this.scroller.style.paddingLeft = '';
                    this.renderedKey = '';
                    return;
                }

                const pos = this.view.state.selection.main.head;
                const active = pickActiveBlock(blocks, pos, this.view.viewport);
                const key = `${active.start}:${active.end}`;
                if (key === this.renderedKey) return;

                this.renderedKey = key;
                this.panel.style.display = '';
                this.wrapper.empty();

                // 捕获 paiPanCode，供流年导航回调使用
                const paiPanCode = active.codes[0];
                const view = this.view;

                renderCodes(active.codes, this.wrapper, (year: number) => {
                    const doc = view.state.doc;
                    const text = doc.toString();

                    // 1. 搜索 paiPanCode（二级列表格式，兼容 tab/空格缩进 + md 标记）
                    const codePattern = `(?:\\t| {2,})- [*=_~]{0,4}${escapeRegex(paiPanCode)}`;
                    const codeRe = new RegExp(codePattern, 'g');
                    const codeMatch = codeRe.exec(text);
                    if (!codeMatch) return;
                    const codeEnd = codeMatch.index + codeMatch[0].length;

                    // 2. 从该位置向后搜索流年行
                    const yearPattern = `(?:\\t| {2,})- [*=_~]{0,4}${year}年`;
                    const yearRe = new RegExp(yearPattern, 'g');
                    yearRe.lastIndex = codeEnd;
                    const yearMatch = yearRe.exec(text);
                    if (!yearMatch) return;

                    // 3. 光标移至该行末尾
                    const targetPos = yearMatch.index + yearMatch[0].length;

                    view.dispatch({
                        selection: { anchor: targetPos, head: targetPos },
                        scrollIntoView: true,
                    });
                }).then((ctrls) => {
                    this.controllers = ctrls;
                    this.updatePosition();
                });
            }
        },
    );
}

// ── 辅助 ──

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findAllLeftBlocks(text: string): LeftBlock[] {
    const blocks: LeftBlock[] = [];
    const re = new RegExp(ZIPING_BLOCK_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        const lines = (m[1] || '').split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));
        if (lines.length === 0 || lines[0] !== 'left') continue;
        blocks.push({
            start: m.index,
            end: m.index + m[0].length,
            codes: lines.slice(1),
        });
    }
    return blocks;
}

function pickActiveBlock(blocks: LeftBlock[], cursor: number, viewport: { from: number; to: number }): LeftBlock {
    // 1. 光标在某块内 → 该块
    const inside = blocks.find(b => cursor >= b.start && cursor <= b.end);
    if (inside) return inside;

    // 2. 光标在两个块之间 → 优先前一个块（光标之后没有块，取最近的前面块）
    const prev = blocks.filter(b => b.end <= cursor).pop();
    if (prev) return prev;

    // 3. 光标在所有块之前 → 取视口内最近的块
    const vpCenter = (viewport.from + viewport.to) / 2;
    let best = blocks[0];
    let bestScore = Infinity;
    for (const b of blocks) {
        const bCenter = (b.start + b.end) / 2;
        const dist = Math.abs(bCenter - vpCenter);
        const inViewport = b.start <= viewport.to && b.end >= viewport.from;
        const score = dist - (inViewport ? 1_000_000 : 0);
        if (score < bestScore) { bestScore = score; best = b; }
    }
    return best;
}
