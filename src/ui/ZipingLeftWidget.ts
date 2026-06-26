// CodeMirror 6 ViewPlugin — 全编辑器级别的左侧固定排盘面板
//
// 架构：
//   面板挂载到 document.body（避免 CM6 viewport 回收），position:fixed 定位于
//   .view-content 的左侧水槽区域。ViewPlugin 仅负责生命周期（destroy 时移除面板）
//   和内容调度（扫描文档中的 ```ziping left``` 块，找到"活跃"块后异步渲染）。
//
//   面板不占用正文空间 — position:fixed 叠加在水槽上方，不推挤任何元素。

import { ViewPlugin, ViewUpdate, EditorView } from '@codemirror/view';

// ── 正则：匹配 ```ziping ... ``` 围栏代码块 ──
const ZIPING_BLOCK_RE = /```ziping\s*\n((?:.+\n)*?)```/g;

interface LeftBlock {
    start: number;
    end: number;
    codes: string[];
}

export function zipingLeftViewPlugin(
    renderCodes: (codes: string[], parent: HTMLElement) => Promise<void>,
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
                // 渲染完成后更新定位（内容高度可能变化）
                void renderCodes(active.codes, this.wrapper).then(() => this.updatePosition());
            }
        },
    );
}

// ── 辅助 ──

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
