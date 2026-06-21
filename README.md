<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat-square&logo=obsidian" alt="Obsidian Plugin"/>
  <img src="https://img.shields.io/github/v/release/Dyse-Sofqi/ziping?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/minAppVersion-1.5.0-7C3AED?style=flat-square" alt="minAppVersion"/>
  <img src="https://img.shields.io/github/license/Dyse-Sofqi/ziping?style=flat-square" alt="License"/>
</p>

<h1 align="center">子平排盘 · Ziping Bazi</h1>
<p align="center"><b>专业八字排盘工具 · Professional Bazi (Four Pillars) Calculator for Obsidian</b></p>

---

## 📖 简介

**子平排盘** 是一款专为 Obsidian 设计的专业八字排盘插件，集成了传统子平八字命理学算法。支持自动排盘、真太阳时校准、大运流年流月分析、案例保存等功能，适合命理研究、个人记录和学习辅助。

## ✨ 功能特性

### 🔢 智能八字排盘

- **自动排盘**：根据出生年月日时自动计算年、月、日、时四柱
- **真太阳时校准**：内置 400+ 城市经纬度数据库，自动计算真太阳时
- **公历/农历支持**：支持公历日期输入和农历日期转换
- **精确到分钟**：支持精确的出生时间输入和时辰调整

### 📊 命理分析

- **十神关系**：自动分析各柱天干的十神关系（正官、偏官、正印、偏印等）
- **大运排算**：精确计算起运时间和大运走势（含交运日期描述）
- **流年分析**：查看各年的流年干支和运势变化
- **流月分析**：按月查看流月干支和十神
- **小运计算**：支持小运排算
- **纳音五行**：显示六十甲子纳音
- **十二长生**：分析十二长生状态（沐浴、冠带、临官等）
- **藏干十神**：分析地支藏干及对应的十神
- **旬空查询**：自动计算旬空

### 🧩 代码块渲染

本插件支持在笔记中直接嵌入排盘结果：

<pre><code>```ziping
2026.06.21-12.00-Y
```
</code></pre>

代码块视图**完全独立渲染**，使用 Shadow DOM 隔离主题样式，确保在不同主题下显示一致。支持大运/流年/流月点选交互，与侧边栏视图体验完全一致。

### 💾 案例管理

- **一键保存**：将排盘结果保存为结构化的 Markdown 文件
- **YAML Frontmatter**：自动生成标准化的元数据头
- **灵活路径**：自定义案例保存目录，支持标签系统
- **排盘码识别**：自动识别笔记中的排盘码，一键加载

### 🎛️ 界面

- **侧边栏视图**：集成在 Obsidian 右侧边栏，随时调用
- **代码块内嵌**：在笔记中直接渲染八字信息
- **命令面板**：支持 Obsidian 命令面板快速操作
- **功能区图标**：一键打开排盘界面

## 🔧 安装

### 方法一：社区插件市场

1. 打开 Obsidian **设置** → **社区插件**
2. 搜索 **"Ziping"** 或 **"子平排盘"**
3. 点击安装并启用

### 方法二：BRAT 安装

1. 安装并启用 [BRAT](obsidian://show-plugin?id=obsidian42-brat) 插件
2. 在 BRAT 设置中添加 Beta 插件：`https://github.com/Dyse-Sofqi/ziping`
3. 选择 Latest version，确认后等待自动安装

### 方法三：手动安装

1. 从 [Releases](https://github.com/Dyse-Sofqi/ziping/releases) 下载最新版本
2. 解压到 `.obsidian/plugins/ziping/` 目录
3. 在 Obsidian 设置中启用插件

## 🚀 快速开始

### 侧边栏排盘

1. 点击左侧功能区的 **DNA 图标** 或在命令面板搜索 **"打开排盘"**
2. 在右侧边栏中输入出生日期、时间、性别
3. 点击 **"排盘"** 按钮查看完整八字信息
4. 交互式点选大运/流年/流月查看详情
5. 点击 **"保存"** 将结果保存为笔记

### 代码块渲染

在笔记中写入排盘码代码块即可自动渲染：

<pre><code>```ziping
1990.05.15-10.30-Y
2001.08.20-14.45-X
```
</code></pre>

一行一个排盘码，支持同时渲染多个排盘。

### 排盘码格式

```
YYYY.MM.DD-HH.MM-G
```

| 部分 | 说明 | 示例 |
|------|------|------|
| `YYYY` | 出生年份（4 位） | `1990` |
| `MM` | 出生月份（2 位） | `05` |
| `DD` | 出生日期（2 位） | `15` |
| `HH` | 出生小时（2 位，24 小时制） | `10` |
| `MM` | 出生分钟（2 位） | `30` |
| `G` | 性别：`Y` = 男，`X` = 女 | `Y` |

## ⚙️ 设置选项

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 案例路径 | 案例文件保存目录 | `命例` |
| 真太阳时 | 是否启用真太阳时校准 | 关闭 |
| 经度 | 所在经度 | `120` |
| 纬度 | 所在纬度 | `35` |
| 省份 | 选择省份 | - |
| 城市 | 选择城市（自动填充经纬度） | - |

## 📝 案例文件格式

保存后的案例文件结构：

```markdown
---
title: "张三"
author: ""
tags: [八字/命例/朋友]
created: 2026-06-21T12:00:00
modified: 2026-06-21T12:00:00
aliases: []
---

#### 1990.05.15-10.30-Y，张三

乾造：庚午年、辛巳月、甲子日、乙巳时

```ziping
1990.05.15-10.30-Y
```

- 2004年15岁甲子
	- 2005年16岁乙丑
	- 2006年17岁丙寅
	...
```

## 🧱 技术架构

```
src/
├── main.ts                 # 插件入口，注册视图/命令/设置
├── Paipan.ts               # 排盘核心引擎封装
├── models/
│   └── types.ts            # 类型定义
├── services/
│   ├── BaziService.ts      # 八字计算服务
│   └── IdentificationService.ts  # 排盘码识别服务
├── ui/
│   ├── BaziView.ts         # 侧边栏视图
│   ├── ZipingCodeBlockRenderer.ts  # 代码块渲染器（Shadow DOM 隔离）
│   ├── zipingShadowStyles.ts       # Shadow DOM 样式
│   ├── components/
│   │   ├── BaziTable.ts    # 八字表格组件
│   │   ├── DayunDisplay.ts # 大运显示组件
│   │   ├── LiuyueDisplay.ts # 流月显示组件
│   │   └── ResultDisplay.ts # 结果显示组件
│   └── cities/             # 城市经纬度数据
└── utils/
    └── styleUtils.ts       # 样式工具
```

### 技术要点

- **纯前端计算**：所有排盘计算在本地完成，无需网络请求
- **Shadow DOM 隔离**：代码块视图使用 Shadow DOM + `CSSStyleSheet.adoptedStyleSheets`，完全隔离主题样式
- **Paipan.js 集成**：基于成熟的排盘算法库
- **Obsidian API**：使用 `registerMarkdownCodeBlockProcessor`、`registerView`、`addCommand` 等标准 API

## 🔄 版本历史

| 版本 | 说明 |
|------|------|
| 1.2.5 | 恢复 Shadow DOM 隔离，消除全部插件审核报错 |
| 1.2.4 | 修复 ESLint 违规：替换 any 类型、补充 API 声明、更新 minAppVersion |
| 1.2.3 | 修复代码块渲染交互与大运切换逻辑 |
| 1.2.0 | 新增流月分析、干支历显示、代码块渲染 |

## ❓ 常见问题

**Q: 排盘结果和网上的其他排盘工具不一致？**
A: 不同排盘工具可能使用不同的算法参数（如起运时间计算规则、节气时刻判断等）。本插件基于 paipan.js 引擎，算法透明可追溯。

**Q: 代码块显示不正确？**
A: 请确认排盘码格式为 `YYYY.MM.DD-HH.MM-Y/X`。如果是 Obsidian 主题样式干扰，请确保插件已更新到 v1.2.5+（使用 Shadow DOM 隔离）。

**Q: 如何修改保存路径？**
A: 在插件设置中的"案例路径"项修改，支持绝对路径或相对于仓库的路径。

## 🤝 支持

如有问题或建议，欢迎提交 [Issue](https://github.com/Dyse-Sofqi/ziping/issues) 或 Pull Request。

如果这个插件对你有帮助，欢迎赞赏支持：

![赞赏码](zanshang.jpg)

---

## 📄 License

MIT
