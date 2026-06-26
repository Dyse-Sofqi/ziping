/* eslint-disable @typescript-eslint/no-unsafe-call -- paipan.js / BaziService methods are untyped */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- paipan.js data flows through untyped paths */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- paipan.js data objects accessed dynamically */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- paipan.js returns untyped data */
import { Notice, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, ZipingSettings, ZipingSettingTab } from "./settings";
import { BaziView } from './ui/BaziView';
import { PAIPAN_VIEW_TYPE, CurrentBaziData, DayunItem, LiunianItem } from './models/types';
import { Paipan } from './Paipan';
import { initializeStyleUtils } from './utils/styleUtils';

// 排盘引擎声明在 src/Paipan.ts 中已经定义
import { IdentificationService } from './services/IdentificationService';
import { BaziService } from './services/BaziService';
import { ZipingCodeBlockRenderer } from './ui/ZipingCodeBlockRenderer';
import { zipingLeftViewPlugin, startReadingModeTracker } from './ui/ZipingLeftWidget';

export default class ZipingPlugin extends Plugin {
		settings: ZipingSettings = DEFAULT_SETTINGS;
	private codeBlockRenderer = new ZipingCodeBlockRenderer();


	async onload() {
			await this.loadSettings();

			// 初始化样式工具（style-mod替代setCssProps）
			initializeStyleUtils();
			// 启用阅读模式光标跟踪（逆向流年匹配）
			startReadingModeTracker();

			// 注册侧边栏视图
			this.registerView(PAIPAN_VIEW_TYPE, (leaf) => new BaziView(leaf, this));

			// 注册 markdown 代码块处理器：```ziping
			this.registerMarkdownCodeBlockProcessor('ziping', (source, el, ctx) => {
				void this.codeBlockRenderer.render(source, el, ctx);
			});

			// 注册 CM6 ViewPlugin：```ziping left（Live Preview 模式）
			// ViewPlugin 在编辑器层级创建单个浮动面板，不会被 viewport 回收
			const renderer = this.codeBlockRenderer;
			this.registerEditorExtension(
				zipingLeftViewPlugin((codes, parent, cb) => renderer.renderCodesToElement(codes, parent, cb)),
			);
			// 添加打开侧边栏视图的命令
			this.addCommand({
				id: 'open-paipan-view',
				name: '打开排盘',
				callback: () => {
					void this.activateView();
				}
			});

			// 添加侧边栏排盘图标
			this.addRibbonIcon('dna', '子平排盘', () => {
				void this.activateView();
			});

			// 添加设置标签页
			this.addSettingTab(new ZipingSettingTab(this.app, this));

			// 等待 workspace 完全初始化后再激活视图
			this.app.workspace.onLayoutReady(() => {
				// 如果不存在八字排盘视图，则在右侧侧边栏打开它
				if (this.app.workspace.getLeavesOfType(PAIPAN_VIEW_TYPE).length === 0) {
					void this.activateView();
				}
			});
		}

		onunload() {
		}

		async activateView() {
			const { workspace } = this.app;

			// 检查是否已有八字排盘视图的 leaf
			const leaves = workspace.getLeavesOfType(PAIPAN_VIEW_TYPE);
			if (leaves.length > 0) {
				const leaf = leaves[0];
				if (leaf) {
					// 刷新数据
					const view = leaf.view as BaziView;
					if (view && view.loadCurrentTime) {
						view.loadCurrentTime();
					}
				}
				return;
			}

			// 在右侧侧边栏创建新 leaf
			const leaf = workspace.getLeaf(false);
			await leaf.setViewState({ type: PAIPAN_VIEW_TYPE, active: true });
		}

		async loadSettings() {
			this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<ZipingSettings>);
		}

		async saveSettings() {
			await this.saveData(this.settings);
		}

		async saveBaziToFile(title: string, data: CurrentBaziData) {
			const basePath = this.settings.casePath || '命例';

			// 根据校时状态选择正确的时间来计算排盘码
			const hour = data.timeCorrectionEnabled && data.bazi.zty ? data.bazi.zty.hour : data.hour;
			const minute = data.timeCorrectionEnabled && data.bazi.zty ? data.bazi.zty.minute : data.minute;

			// 生成排盘码
			const identificationService = new IdentificationService(this.app, new Paipan(), new BaziService(new Paipan()));
			const paiPanCode = identificationService.generatePaiPanCode(
				data.year,
				data.month,
				data.day,
				hour,
				minute,
				data.gender
			);

			// 如果当前title是默认值，则使用排盘码+未命名格式
			const isDefaultTitle = !title || title === '未命名' || title === '命例';
			const fileName = isDefaultTitle ? `${paiPanCode}，未命名.md` : `${title}.md`;
			const filePath = `${basePath}/${fileName}`;

			try {
				// 检查并创建文件夹
				const folder = this.app.vault.getAbstractFileByPath(basePath);
				if (!folder) {
					await this.app.vault.createFolder(basePath);
					new Notice(`已创建文件夹: ${basePath}`);
				}

				// 构建 Markdown 内容
				const content = this.formatBaziToMarkdown(title, data);

				// 保存文件
				await this.app.vault.create(filePath, content);
				new Notice(`已保存到 ${filePath}`);
			} catch (error) {
				new Notice('保存失败: ' + (error as Error).message);
			}
		}

		private formatBaziToMarkdown(title: string, data: CurrentBaziData): string {
			const lines: string[] = [];

			// 1. 生成 YAML Frontmatter 格式数据
			const now = new Date();
			const formatDateTime = (date: Date) => {
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				const hour = String(date.getHours()).padStart(2, '0');
				const minute = String(date.getMinutes()).padStart(2, '0');
				const second = String(date.getSeconds()).padStart(2, '0');
				return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
			};

			lines.push('---');
			lines.push(`title: "${title || '案例'}"`);
			lines.push(`author: ""`);
			const tagValue = data.tag || '';
			const tagString = tagValue ? `八字/命例/${tagValue}` : '八字/命例';
			lines.push(`tags: [${tagString}]`);
			lines.push(`created: ${formatDateTime(now)}`);
			lines.push(`modified: ${formatDateTime(now)}`);
			lines.push(`aliases: []`);
			lines.push('---');
			lines.push('');

			// 2. 首行生成排盘码，并附带姓名，设置为四级标题 - 根据校时状态使用正确的时间
			const genderCode = data.gender === 0 ? 'Y' : 'X';
			const hour = data.timeCorrectionEnabled && data.bazi.zty ? data.bazi.zty.hour : data.hour;
			const minute = data.timeCorrectionEnabled && data.bazi.zty ? data.bazi.zty.minute : data.minute;
			const paiPanCode = `${String(data.year)}.${String(data.month).padStart(2, '0')}.${String(data.day).padStart(2, '0')}-${String(hour).padStart(2, '0')}.${String(minute).padStart(2, '0')}-${genderCode}`;
			lines.push(`#### ${paiPanCode}，${data.name || '案例'}`);
			lines.push('');

			// 插入乾造/坤造及四柱干支描述行
			const genderLabel = data.gender === 0 ? '乾' : '坤';
			const yearGan = data.bazi.gztg[0];
			const yearZhi = data.bazi.dz[0];
			const monthGan = data.bazi.gztg[1];
			const monthZhi = data.bazi.dz[1];
			const dayGan = data.bazi.gztg[2];
			const dayZhi = data.bazi.dz[2];
			const hourGan = data.bazi.gztg[3];
			const hourZhi = data.bazi.dz[3];
			lines.push(`${genderLabel}造：${yearGan}${yearZhi}年、${monthGan}${monthZhi}月、${dayGan}${dayZhi}日、${hourGan}${hourZhi}时`);
			lines.push('');

			// 输出 ziping 代码块
			lines.push('```ziping');
			lines.push('left');
			lines.push(paiPanCode);
			lines.push('```');

			lines.push('');
			lines.push('- 原局');
			lines.push(`\t- ${paiPanCode}`);
			lines.push('- 六亲');
			// 小运部分：起运前逐年的小运流年
			const firstDayunAge = data.dayun.allDayun[0]?.age;
			const xiaoyunCount = firstDayunAge > 0 ? firstDayunAge : 0;
			if (xiaoyunCount > 0) {
				lines.push('- 小运');
				const xiaoyunHourGan = data.bazi.gztg[3];
				const xiaoyunHourZhi = data.bazi.dz[3];
				const xiaoyunPaipan = new Paipan();
				for (let i = 0; i < xiaoyunCount; i++) {
					const age = i + 1;
					const year = data.year + i;
					const yearGanZhi = xiaoyunPaipan.getYearGanZhi(year);
					const xiaoyun = xiaoyunPaipan.getXiaoYun(
						xiaoyunHourGan, xiaoyunHourZhi,
						data.year, data.gender, age
					);
					lines.push(`\t- ${year}年${age}岁${yearGanZhi.gan}${yearGanZhi.zhi}(小运${xiaoyun.gan}${xiaoyun.zhi})`);
				}
			}

			// 展示九步大运干支
			const dayunItems = data.dayun.allDayun.slice(0, 9);

			// 生成大运列表，每行展示一个大运的起始年份和干支和岁数，并添加其下的所有流年
			for (const dayun of dayunItems) {
				// 添加大运项
				lines.push(`- ${dayun.startYear}年${dayun.age}岁${dayun.gan}${dayun.zhi}`);

				// 计算该大运下的所有流年
				const liunianItems = this.calculateLiunianForDayun(dayun, data.year);

				// 添加流年项作为二级列表
				for (const liunian of liunianItems) {
					lines.push(`\t- ${liunian.year}年${liunian.age}岁${liunian.gan}${liunian.zhi}`);
				}
			}
			lines.push('');

			return lines.join('\n');
		}

		// 从完整十神名称获取简写
		private getShiShenShortFromFull(shiShenFull: string): string {
			const shiShenMap: Record<string, string> = {
				'比肩': '比', '劫财': '劫', '食神': '食', '伤官': '伤',
				'偏财': '才', '正财': '财', '七杀': '杀', '偏官': '杀', '正官': '官',
				'偏印': '枭', '正印': '印'
			};

			return shiShenMap[shiShenFull] || '';
		}

		// 获取十神简写（保持向后兼容性，但建议使用getShiShenShortFromFull）
		private getShiShenShort(riGan: string, gan: string): string {
			const paipan = new Paipan();
			const shiShenFull = paipan.getShiShenFull(riGan, gan);
			return this.getShiShenShortFromFull(shiShenFull);
		}

		/**
		 * 计算大运下的所有流年
		 * @param dayun 大运项
		 * @param birthYear 出生年份
		 * @returns 流年数组
		 */
		private calculateLiunianForDayun(dayun: DayunItem, birthYear: number): LiunianItem[] {
			const liunianItems: LiunianItem[] = [];
			const paipan = new Paipan();

			// 每个大运持续10年，计算其下的所有流年
			for (let i = 0; i < 10; i++) {
				const year = dayun.startYear + i;
				const age = year - birthYear + 1;
				const yearGanZhi = paipan.getYearGanZhi(year);

				liunianItems.push({
					year: year,
					age: age,
					gan: yearGanZhi.gan,
					zhi: yearGanZhi.zhi,
					gz: yearGanZhi.gan + yearGanZhi.zhi
				});
			}

			return liunianItems;
		}
	}

/* eslint-enable @typescript-eslint/no-unsafe-call -- end paipan.js dynamic type section */
/* eslint-enable @typescript-eslint/no-unsafe-argument -- end paipan.js dynamic type section */
/* eslint-enable @typescript-eslint/no-unsafe-member-access -- end paipan.js dynamic type section */
/* eslint-enable @typescript-eslint/no-unsafe-assignment -- end paipan.js dynamic type section */
