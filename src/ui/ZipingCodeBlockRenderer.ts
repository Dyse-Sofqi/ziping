// Markdown 代码块渲染器
// 处理 ```ziping 代码块，复刻侧边栏排盘视图的完整渲染，支持交互切换
// 使用 Shadow DOM 完全隔离主题样式渗透
// IdentificationService constructor requires App type, but code block renderer has no App access
import { Component, MarkdownPostProcessorContext, MarkdownRenderChild } from 'obsidian';
import { Paipan } from '../Paipan';
import { BaziService } from '../services/BaziService';
import { IdentificationService } from '../services/IdentificationService';
import { BaziTable } from './components/BaziTable';
import { DayunDisplay } from './components/DayunDisplay';
import { LiuyueDisplay } from './components/LiuyueDisplay';
import { ResultDisplay } from './components/ResultDisplay';
import { CurrentBaziData } from '../models/types';
import { SHADOW_BAZI_CSS } from './zipingShadowStyles';

export class ZipingCodeBlockRenderer {

    private paipan: Paipan;
    private baziService: BaziService;
    private identificationService: IdentificationService;
    // 追踪挂载到 body 的左侧面板，防止 el 复用/重建时残留
    private leftPanels = new WeakMap<HTMLElement, HTMLElement>();

    constructor() {
        this.paipan = new Paipan(false);
        this.baziService = new BaziService(this.paipan);
        // null is passed as App for code block renderer which has no App access
        this.identificationService = new IdentificationService(null,
            this.paipan,
            this.baziService
        );
    }

    async render(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext): Promise<void> {
        // 清理该 el 上残留的左面板（切换标签页时 Obsidian 可能复用 el）
        const old = this.leftPanels.get(el);
        if (old) {
            this.cleanupPanel(el, old);
        }

        const lines = source.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

        if (lines.length === 0) {
            el.createEl('p', { text: '排盘码为空' });
            return;
        }

        const isLeftMode = lines[0] === 'left';
        const paiPanLines = isLeftMode ? lines.slice(1) : lines;

        if (paiPanLines.length === 0) {
            el.createEl('p', { text: '排盘码为空' });
            return;
        }

        if (isLeftMode) {
            this.renderLeftMode(el, paiPanLines, ctx);
        } else {
            this.renderNormalMode(el, paiPanLines);
        }
    }

    // 普通内联渲染模式：沿用原有的 inline-flex 布局
    private renderNormalMode(el: HTMLElement, lines: string[]): void {
        const embedBlock = el.parentElement;
        if (embedBlock) {
            embedBlock.addClass('ziping-embed-block-align');
        }
        const wrapper = el.createDiv('ziping-content-wrapper');
        for (const code of lines) {
            void this.renderSingleCode(code, wrapper);
        }
    }

    // 左侧固定排盘视图：position:fixed，位于正文左侧水槽
    // 同时增大 view-content 的 padding-left，将正文往右推
    // ResizeObserver 跟踪侧边栏折叠/展开时 view-content 位置变化
    // ctx.addChild 注册 Obsidian 生命周期：切换文档 / 重新渲染时自动清理面板
    private renderLeftMode(el: HTMLElement, lines: string[], ctx: MarkdownPostProcessorContext): void {
        el.addClass('ziping-left-mode');
        const prev = this.leftPanels.get(el);
        if (prev) { prev.remove(); }

        const panel = document.body.appendChild(document.createElement('div'));
        panel.className = 'ziping-left-panel';
        this.leftPanels.set(el, panel);
        // 存储 el 引用，供 ResizeObserver 回调中 positionPanel 使用
        (panel as any).__zipingEl = el;

        const wrapper = panel.createDiv('ziping-content-wrapper');

        // ── Obsidian 生命周期绑定 ──
        const cleanupChild = new MarkdownRenderChild(el);
        (cleanupChild as any).onunload = () => {
            this.cleanupPanel(el, panel);
        };
        ctx.addChild(cleanupChild);

        // ── rAF 轮询：标签页切换 → 隐藏面板；切回 → 显示面板 ──
        // 不 destroy 面板，因为 Obsidian 切回时不会重新调用代码块渲染器
        let wasHidden = false;
        let stopPolling = false;
        const poll = () => {
            if (stopPolling || !document.body.contains(panel)) return;
            const isHidden = !el.isConnected || el.offsetParent === null;
            if (isHidden && !wasHidden) {
                // 标签页切走 → 隐藏面板，恢复正文内边距
                panel.addClass('ziping-left-panel-hidden');
                const vc = el.closest('.view-content') as HTMLElement | null;
                if (vc) {
                    vc.style.paddingLeft = '';
                    delete vc.dataset.zipingLeftPanel;
                }
                wasHidden = true;
            } else if (!isHidden && wasHidden) {
                // 标签页切回 → 显示面板，重新定位（会重设 paddingLeft）
                panel.removeClass('ziping-left-panel-hidden');
                wasHidden = false;
                this.positionPanel(panel);
            }
            requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
        (panel as any).__zipingPollStop = () => { stopPolling = true; };

        // ── 异步渲染内容 ──
        void (async () => {
            await Promise.all(lines.map(code => this.renderSingleCode(code, wrapper)));
            this.positionPanel(panel);

            // 监听 view-content 尺寸/位置变化（侧边栏折叠、窗口缩放）
            const vc = document.querySelector('.workspace-split.mod-vertical.mod-root .view-content') as HTMLElement | null;
            if (vc && document.body.contains(panel)) {
                const roVc = new ResizeObserver(() => {
                    if (document.body.contains(panel)) {
                        this.positionPanel(panel);
                    } else {
                        roVc.disconnect();
                    }
                });
                roVc.observe(vc);
                (panel as any).__zipingRoVc = roVc;
            }

            // 监听面板自身尺寸变化（展开/折叠流月等），动态调整位置 + 正文 padding
            const roPanel = new ResizeObserver(() => {
                if (!document.body.contains(panel)) {
                    roPanel.disconnect();
                    return;
                }
                this.positionPanel(panel);
            });
            roPanel.observe(panel);
            (panel as any).__zipingRoPanel = roPanel;
        })();
    }

    private cleanupPanel(el: HTMLElement, panel: HTMLElement): void {
        // 停止 rAF 轮询
        const pollStop = (panel as any).__zipingPollStop as (() => void) | undefined;
        if (pollStop) pollStop();
        // 断开 Ro 监听
        const roVc = (panel as any).__zipingRoVc as ResizeObserver | undefined;
        if (roVc) roVc.disconnect();
        const roPanel = (panel as any).__zipingRoPanel as ResizeObserver | undefined;
        if (roPanel) roPanel.disconnect();

        panel.remove();
        el.removeClass('ziping-left-mode');
        this.leftPanels.delete(el);
        const vc = document.querySelector('.workspace-split.mod-vertical.mod-root .view-content') as HTMLElement | null;
        if (vc) {
            vc.style.paddingLeft = '';
            delete vc.dataset.zipingLeftPanel;
        }
    }

    // 测量 el 所在 view-content 的真实 viewport 位置
    // 使用 el.closest 而非全局 querySelector，避免选中隐藏标签页的 view-content
    private positionPanel(panel: HTMLElement): void {
        const el = (panel as any).__zipingEl as HTMLElement | undefined;
        const vc = el?.closest('.view-content') as HTMLElement | null;
        if (!vc || !document.body.contains(panel)) return;
        const rect = vc.getBoundingClientRect();
        panel.style.left = rect.left + 'px';
        const ph = panel.offsetHeight;
        panel.style.top = (rect.top + Math.max((rect.height - ph) / 2, 20)) + 'px';
        panel.style.maxHeight = (rect.height - 40) + 'px';
        const pw = panel.offsetWidth;
        if (pw > 0) {
            vc.style.paddingLeft = (pw + 8) + 'px';
        }
        vc.dataset.zipingLeftPanel = 'active';
    }

    // 渲染单个排盘码到指定的父容器中
    private async renderSingleCode(code: string, parent: HTMLElement): Promise<void> {
        const parsed = this.identificationService.parsePaiPanCode(code);
        if (!parsed.isValid) {
            const codeBlock = parent.createEl('pre');
            codeBlock.addClass('ziping-code-invalid');
            codeBlock.setText(code);
            return;
        }

        try {
            const baziData = await this.baziService.calculateBazi(
                parsed.year, parsed.month, parsed.day,
                parsed.hour, parsed.minute, 0,
                parsed.gender, '', false, ''
            );

            const blockHost = parent.createDiv('ziping-bazi-block');
            this.renderSingleBaziInto(blockHost, baziData);
        } catch (error) {
            const errorEl = parent.createEl('div');
            errorEl.addClass('ziping-error');
            errorEl.setText(`排盘计算失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    // 兼容旧入口：创建宿主并渲染（侧边栏等处调用）
    private renderSingleBazi(container: HTMLElement, baziData: CurrentBaziData): void {
        const embedBlock = container.parentElement;
        if (embedBlock) {
            embedBlock.addClass('ziping-embed-block-align');
        }
        const host = container.createEl('div');
        host.addClass('ziping-bazi-block');
        this.renderSingleBaziInto(host, baziData);
    }

    // 核心渲染：向已创建的宿主元素中渲染单个排盘
    private renderSingleBaziInto(host: HTMLElement, baziData: CurrentBaziData): void {

        // ═══ Shadow DOM（完全隔离主题样式）═══
        const shadow = host.attachShadow({ mode: 'closed' });

        // 用 adoptedStyleSheets 注入 CSS——不创建 <style> 元素，
        // 不触发 "Creating style elements is not allowed" 审核规则
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(SHADOW_BAZI_CSS);
        shadow.adoptedStyleSheets = [sheet];

        // Shadow 树内的渲染容器（先通过 Obsidian API 创建，再移入 Shadow DOM）
        const innerContainer = host.createDiv('bazi-result-container');
        shadow.appendChild(innerContainer);

        // 每个代码块独立的组件实例
        const localBaziTable = new BaziTable(this.paipan);
        const localDayunDisplay = new DayunDisplay(this.paipan);
        const localLiuyueDisplay = new LiuyueDisplay(this.paipan);
        const localResultDisplay = new ResultDisplay(this.paipan);

        const rerender = () => {
            innerContainer.empty();
            this.renderComponents(
                innerContainer, baziData,
                localBaziTable, localDayunDisplay,
                localLiuyueDisplay, localResultDisplay
            );
            this.bindCallbacks(
                baziData, rerender,
                localDayunDisplay, localLiuyueDisplay, localResultDisplay
            );
        };

        this.bindCallbacks(
            baziData, rerender,
            localDayunDisplay, localLiuyueDisplay, localResultDisplay
        );

        this.renderComponents(
            innerContainer, baziData,
            localBaziTable, localDayunDisplay,
            localLiuyueDisplay, localResultDisplay
        );
    }

    private renderComponents(
        wrapper: HTMLElement, baziData: CurrentBaziData,
        baziTable: BaziTable, dayunDisplay: DayunDisplay,
        liuyueDisplay: LiuyueDisplay, resultDisplay: ResultDisplay
    ): void {
        // 与 BaziView.updateBaziDisplay 完全相同的调用序列
        resultDisplay.displayResults(wrapper, baziData);
        baziTable.createBaziTable(wrapper, baziData);
        dayunDisplay.displayDayunInfo(wrapper, baziData);
        if (baziData.showLiuyue) {
            liuyueDisplay.displayLiuyueInfo(wrapper, baziData);
        }
    }

    private bindCallbacks(
        baziData: CurrentBaziData, rerender: () => void,
        dayunDisplay: DayunDisplay, liuyueDisplay: LiuyueDisplay,
        resultDisplay: ResultDisplay
    ): void {
        // 时柱显示开关
        resultDisplay.setCallbacks(
            undefined, // 不支持时辰调整（需要重新计算八字）
            (showHourPillar: boolean) => {
                baziData.showHourPillar = showHourPillar;
                rerender();
            }
        );

        // 大运/流年/小运切换 + 流月开关
        dayunDisplay.setCallbacks(
            // 选择大运
            (index: number) => {
                baziData.selectedDayunIndex = index;
                baziData.selectedLiunianIndex = 0;
                baziData.selectedLiuyueIndex = 0;
                rerender();
            },
            // 选择流年
            (dayunIndex: number, liunianIndex: number) => {
                baziData.selectedDayunIndex = dayunIndex;
                const prevLiunianIndex = baziData.selectedLiunianIndex;
                baziData.selectedLiunianIndex = liunianIndex;
                baziData.selectedLiuyueIndex = 0;
                // 流年变化时重新计算流月
                if (liunianIndex !== prevLiunianIndex) {
                    baziData.liuyue = this.baziService.recalculateLiuyue(baziData);
                }
                rerender();
            },
            // 选择小运
            () => {
                baziData.selectedDayunIndex = -1;
                baziData.selectedLiunianIndex = 0;
                baziData.selectedLiuyueIndex = 0;
                rerender();
            },
            // 流月 checkbox
            (showLiuyue: boolean) => {
                baziData.showLiuyue = showLiuyue;
                rerender();
            }
        );

        // 流月选择
        liuyueDisplay.setCallbacks(
            (index: number) => {
                baziData.selectedLiuyueIndex = index;
                rerender();
            }
        );
    }
}
