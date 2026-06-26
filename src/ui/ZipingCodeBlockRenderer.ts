// Markdown 代码块渲染器
// 处理 ```ziping 代码块，复刻侧边栏排盘视图的完整渲染，支持交互切换
// 使用 Shadow DOM 完全隔离主题样式渗透
// IdentificationService constructor requires App type, but code block renderer has no App access
import { MarkdownPostProcessorContext } from 'obsidian';
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

    constructor() {
        this.paipan = new Paipan(false);
        this.baziService = new BaziService(this.paipan);
        // null is passed as App for code block renderer which has no App access
        this.identificationService = new IdentificationService(null,
            this.paipan,
            this.baziService
        );
    }

    // ── 阅读模式入口：registerMarkdownCodeBlockProcessor ──
    // Live Preview 的 left 面板由 CM6 ViewPlugin（ZipingLeftWidget.ts）处理。
    // left 模式在此处不渲染任何内容，避免与 ViewPlugin 产生双重视图。
    async render(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext): Promise<void> {
        const lines = source.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

        if (lines.length === 0) {
            el.createEl('p', { text: '排盘码为空' });
            return;
        }

        // left 模式：由 ViewPlugin 渲染为左侧浮动面板，此处跳过
        if (lines[0] === 'left') {
            el.empty();
            return;
        }

        this.renderNormalMode(el, lines);
    }

    // ── CM6 ViewPlugin 调用的公开入口 ──
    async renderCodesToElement(codes: string[], parent: HTMLElement): Promise<void> {
        for (const code of codes) {
            await this.renderSingleCode(code, parent);
        }
    }

    // ── 内联渲染 ──
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

    // ── 单个排盘码渲染 ──
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

    // ── 核心渲染：Shadow DOM + 组件 ──
    private renderSingleBaziInto(host: HTMLElement, baziData: CurrentBaziData): void {

        // ═══ Shadow DOM（完全隔离主题样式）═══
        const shadow = host.attachShadow({ mode: 'closed' });

        const sheet = new CSSStyleSheet();
        sheet.replaceSync(SHADOW_BAZI_CSS);
        shadow.adoptedStyleSheets = [sheet];

        const innerContainer = host.createDiv('bazi-result-container');
        shadow.appendChild(innerContainer);

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
        resultDisplay.setCallbacks(
            undefined,
            (showHourPillar: boolean) => {
                baziData.showHourPillar = showHourPillar;
                rerender();
            }
        );

        dayunDisplay.setCallbacks(
            (index: number) => {
                baziData.selectedDayunIndex = index;
                baziData.selectedLiunianIndex = 0;
                baziData.selectedLiuyueIndex = 0;
                rerender();
            },
            (dayunIndex: number, liunianIndex: number) => {
                baziData.selectedDayunIndex = dayunIndex;
                const prevLiunianIndex = baziData.selectedLiunianIndex;
                baziData.selectedLiunianIndex = liunianIndex;
                baziData.selectedLiuyueIndex = 0;
                if (liunianIndex !== prevLiunianIndex) {
                    baziData.liuyue = this.baziService.recalculateLiuyue(baziData);
                }
                rerender();
            },
            () => {
                baziData.selectedDayunIndex = -1;
                baziData.selectedLiunianIndex = 0;
                baziData.selectedLiuyueIndex = 0;
                rerender();
            },
            (showLiuyue: boolean) => {
                baziData.showLiuyue = showLiuyue;
                rerender();
            }
        );

        liuyueDisplay.setCallbacks(
            (index: number) => {
                baziData.selectedLiuyueIndex = index;
                rerender();
            }
        );
    }
}
