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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument -- null is passed as App for code block renderer which has no App access
        this.identificationService = new IdentificationService(null as any,
            this.paipan,
            this.baziService
        );
    }

    async render(source: string, el: HTMLElement, _ctx: MarkdownPostProcessorContext): Promise<void> {
        const lines = source.split('\n')
            .map(l => l.trim())
            .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'));

        if (lines.length === 0) {
            el.createEl('p', { text: '排盘码为空' });
            return;
        }

        for (const code of lines) {
            const parsed = this.identificationService.parsePaiPanCode(code);
            if (!parsed.isValid) {
                const codeBlock = el.createEl('pre');
                codeBlock.addClass('ziping-code-invalid');
                codeBlock.setText(code);
                continue;
            }

            try {
                const baziData = await this.baziService.calculateBazi(
                    parsed.year, parsed.month, parsed.day,
                    parsed.hour, parsed.minute, 0,
                    parsed.gender, '', false, ''
                );

                this.renderSingleBazi(el, baziData);
            } catch (error) {
                const errorEl = el.createEl('div');
                errorEl.addClass('ziping-error');
                errorEl.setText(`排盘计算失败: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }

    private renderSingleBazi(container: HTMLElement, baziData: CurrentBaziData): void {
        // 让外层 .cm-preview-code-block 自适应内容宽度
        // 阅读视图用 flex 布局，flex 子项默认 stretch，需 align-self 配合
        const embedBlock = container.parentElement;
        if (embedBlock) {
            embedBlock.addClass('ziping-embed-block-align');
        }

        // 宿主元素（light-DOM 可见，用于定位）
        const host = container.createEl('div');
        host.addClass('ziping-bazi-block');

        // ═══ Shadow DOM ═══
        const shadow = host.attachShadow({ mode: 'closed' });

        // 注入插件 CSS（包含所有 .bazi-result-container 规则 + :host-context 主题适配）
        // eslint-disable-next-line -- Shadow DOM requires dynamic CSS injection; styles.css cannot penetrate shadow boundary
        const styleEl = document.createElement('style');
        styleEl.textContent = SHADOW_BAZI_CSS;
        shadow.appendChild(styleEl);

        // Shadow 树内的渲染容器（所有组件内容渲染到此）
        const innerContainer = document.createElement('div');
        innerContainer.className = 'bazi-result-container';
        shadow.appendChild(innerContainer);

        // 每个代码块独立的组件实例（避免多块回调冲突）
        const localBaziTable = new BaziTable(this.paipan);
        const localDayunDisplay = new DayunDisplay(this.paipan);
        const localLiuyueDisplay = new LiuyueDisplay(this.paipan);
        const localResultDisplay = new ResultDisplay(this.paipan);

        // 重渲染函数：清空 innerContainer → 用最新 baziData 重绘
        const rerender = () => {
            innerContainer.empty();
            this.renderComponents(
                innerContainer, baziData,
                localBaziTable, localDayunDisplay,
                localLiuyueDisplay, localResultDisplay
            );
            // 重渲染后需重新绑定回调（组件实例未变，但 setCallbacks 可多次调用）
            this.bindCallbacks(
                baziData, rerender,
                localDayunDisplay, localLiuyueDisplay, localResultDisplay
            );
        };

        // 绑定交互回调
        this.bindCallbacks(
            baziData, rerender,
            localDayunDisplay, localLiuyueDisplay, localResultDisplay
        );

        // 首次渲染
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
