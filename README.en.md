<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat-square&logo=obsidian" alt="Obsidian Plugin"/>
  <img src="https://img.shields.io/github/v/release/Dyse-Sofqi/ziping?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/minAppVersion-1.5.0-7C3AED?style=flat-square" alt="minAppVersion"/>
  <img src="https://img.shields.io/github/license/Dyse-Sofqi/ziping?style=flat-square" alt="License"/>
</p>

<h1 align="center">Ziping Bazi · 子平排盘</h1>
<p align="center"><b>Professional Bazi (Four Pillars) Calculator for Obsidian</b></p>

<p align="center"><a href="README.md">中文</a></p>

---

## 📖 Introduction

**Ziping Bazi** is a professional Bazi (Four Pillars) astrology plugin for Obsidian, integrating traditional Ziping Bazi algorithm. It supports automatic chart calculation, true solar time calibration, Dayun (Decade Fortune), Liunian (Annual Fortune), Liuyue (Monthly Fortune) analysis, and case study management — ideal for metaphysical research, personal records, and study aids.

## ✨ Features

### 🔢 Smart Bazi Calculation

- **Automatic chart calculation**: Computes the Year, Month, Day, and Hour Pillars from birth date/time
- **True solar time calibration**: Built-in database of 400+ cities with longitude/latitude for accurate solar time
- **Gregorian/Lunar calendar support**: Input in either calendar system
- **Minute precision**: Supports exact birth time input and Shi Chen (two-hour period) adjustment

### 📊 Destiny Analysis

- **Ten Gods (Shi Shen)**: Automatically analyzes the Ten Gods relationships for each pillar
- **Dayun (Decade Fortune)**: Accurate calculation of Fortune period start time and trends
- **Liunian (Annual Fortune)**: View yearly Heavenly Stem and Earthly Branch and fortune changes
- **Liuyue (Monthly Fortune)**: Monthly fortune analysis with Stem-Branch and Shi Shen
- **Xiaoyun (Minor Fortune)**: Supports minor fortune calculation before Dayun starts
- **Nayin五行**: Sixty-year-cycle Nayin element display
- **Twelve Growth Stages**: Analysis of the Twelve Life Stages (沐浴, 冠带, 临官, etc.)
- **Hidden Stems**: Analysis of Hidden Heavenly Stems in Earthly Branches
- **Xun Kong (Void)**: Automatic calculation of void periods

### 🧩 Code Block Rendering

Embed Bazi results directly in your notes:

<pre><code>```ziping
2026.06.21-12.00-Y
```
</code></pre>

Code blocks use **Shadow DOM isolation** for consistent rendering across all themes. Supports interactive Dayun/Liunian/Liuyue selection, same as the sidebar view.

### 🖼️ Left Fixed Panel (Live Preview)

First line `left` renders a floating panel on the editor's left side:

<pre><code>```ziping
left
1990.05.15-10.30-Y
```
</code></pre>

- Transparent, borderless panel — **does not cover body text**, pushes content right
- Reading view auto-switches to inline rendering, **no occlusion**
- Panel auto-hides/shows when toggling Live Preview ↔ Reading mode

### 🔄 Bidirectional Liunian ↔ Cursor Sync

- Click liunian in panel/sidebar/code-block → cursor jumps to corresponding `\t- {year}年` line
- Cursor on `\t- {year}年` line → all views sync-selected (panel, sidebar, code block)
- Supports Xiaoyun (pre-Dayun years) liunian matching

### 💾 Case Management

- **One-click save**: Save Bazi results as structured Markdown files
- **YAML Frontmatter**: Auto-generated standardized metadata headers
- **Flexible path**: Customizable case save directory with tag support
- **PaiPan code recognition**: Auto-detect and load PaiPan codes from notes

### 🎛️ Interface

- **Sidebar view**: Integrated in Obsidian's right sidebar, accessible anytime
- **Left fixed panel**: Editor-attached floating panel in Live Preview
- **Code block embedding**: Render Bazi info directly in notes
- **Command palette**: Quick access via Obsidian command palette
- **Ribbon icon**: One-click Bazi calculator

## 🔧 Installation

### Option 1: Community Plugin Store

1. Open Obsidian **Settings** → **Community plugins**
2. Search for **"Ziping"** or **"子平排盘"**
3. Click Install and Enable

### Option 2: BRAT Installation

1. Install and enable [BRAT](obsidian://show-plugin?id=obsidian42-brat)
2. Add Beta plugin in BRAT settings: `https://github.com/Dyse-Sofqi/ziping`
3. Select Latest version and wait for auto-install

### Option 3: Manual Installation

1. Download the latest release from [Releases](https://github.com/Dyse-Sofqi/ziping/releases)
2. Extract to `.obsidian/plugins/ziping/` directory
3. Enable the plugin in Obsidian settings

## 🚀 Quick Start

### Sidebar Bazi Calculator

1. Click the **DNA icon** in the left ribbon or search for **"打开排盘"** in the command palette
2. Enter birth date, time, and gender in the right sidebar
3. Click the **"排盘"** button to view the complete Bazi chart
4. Interactively select Dayun/Liunian/Liuyue for details
5. Click **"Save"** to export the result as a note

### Code Block Rendering

Write a PaiPan code block in your note for automatic rendering:

<pre><code>```ziping
1990.05.15-10.30-Y
2001.08.20-14.45-X
```
</code></pre>

One line per PaiPan code, supports multiple charts simultaneously.

### PaiPan Code Format

```
YYYY.MM.DD-HH.MM-G
```

| Part | Description | Example |
|------|-------------|---------|
| `YYYY` | Birth year (4 digits) | `1990` |
| `MM` | Birth month (2 digits) | `05` |
| `DD` | Birth day (2 digits) | `15` |
| `HH` | Birth hour (2 digits, 24h) | `10` |
| `MM` | Birth minute (2 digits) | `30` |
| `G` | Gender: `Y` = Male, `X` = Female | `Y` |

## ⚙️ Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Case Path | Case file save directory | `命例` |
| True Solar Time | Enable true solar time calibration | Off |
| Longitude | Longitude | `120` |
| Latitude | Latitude | `35` |
| Province | Select province | - |
| City | Select city (auto-fill coordinates) | - |

## 📝 Case File Format

Saved case file structure:

````markdown
---
title: "Zhang San"
author: ""
tags: [Bazi/Case/Friend]
created: 2026-06-21T12:00:00
modified: 2026-06-21T12:00:00
aliases: []
---

#### 1990.05.15-10.30-Y，Zhang San

Male: 庚午年、辛巳月、甲子日、乙巳时

```ziping
1990.05.15-10.30-Y
```

- Minor Fortune
	- 1990 Age 1 庚午 (Fortune: 丙寅)
	- 1991 Age 2 辛未 (Fortune: 丁卯)
	- 1992 Age 3 壬申 (Fortune: 戊辰)
	- 1993 Age 4 癸酉 (Fortune: 己巳)

- 2004 Age 15 甲子
	- 2005 Age 16 乙丑
	- 2006 Age 17 丙寅
	...
````

## 🔄 Changelog

| Version | Notes |
|---------|-------|
| 1.4.2 | Fix: left panel flash on new tab open (panel briefly visible before scan hides it, causing content shift flicker) |
| 1.4.1 | Fix: add missing eslint-enable directive after selectFolder() |
| 1.4.0 | Settings: case path horizontal layout (text+clear+browse), native folder dialog, vault-name/relative-path display, auto-follow folder rename |
| 1.3.2 | Fix: backward-search for liunian year line on child-node click |
| 1.3.0 | CM6 ViewPlugin left panel, bidirectional liunian-cursor sync (all views), LP/Reading mode-switch adaptation, Xiaoyun liunian matching fix |
| 1.2.9 | Add Minor Fortune (Xiaoyun) list in case markdown |
| 1.2.8 | Add gender and Four Pillars description line in case markdown |
| 1.2.7 | Fix code block rendering and Dayun switching logic |
| 1.2.5 | Restore Shadow DOM isolation, fix all plugin review errors |
| 1.2.3 | Fix code block interaction and Dayun switching |
| 1.2.0 | Add Liuyue (Monthly Fortune), Ganzhi calendar display, code block rendering |

## ❓ FAQ

**Q: The Bazi result differs from other online calculators?**
A: Different tools may use varying algorithm parameters (e.g., Fortune start calculation rules, Solar Term timing). This plugin is based on the paipan.js engine with transparent and traceable algorithms.

**Q: Code block not displaying correctly?**
A: Make sure the PaiPan code format is `YYYY.MM.DD-HH.MM-Y/X`. If Obsidian theme styles are interfering, update to v1.2.5+ (uses Shadow DOM isolation).

**Q: How to change the save path?**
A: Modify the "Case Path" setting in the plugin settings. Supports absolute paths or paths relative to the vault.

## 🤝 Support

For issues or suggestions, please submit an [Issue](https://github.com/Dyse-Sofqi/ziping/issues) or Pull Request.

---

## 📄 License

MIT
