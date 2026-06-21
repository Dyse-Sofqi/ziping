<p align="center">
  <img src="https://img.shields.io/badge/Obsidian-Plugin-7C3AED?style=flat-square&logo=obsidian" alt="Obsidian Plugin"/>
  <img src="https://img.shields.io/github/v/release/Dyse-Sofqi/ziping?style=flat-square" alt="Version"/>
  <img src="https://img.shields.io/badge/minAppVersion-1.5.0-7C3AED?style=flat-square" alt="minAppVersion"/>
  <img src="https://img.shields.io/github/license/Dyse-Sofqi/ziping?style=flat-square" alt="License"/>
</p>

<h1 align="center">Ziping Bazi · 子平排盘</h1>
<p align="center"><b>Professional Bazi (Four Pillars) Calculator Plugin for Obsidian</b></p>

---

## 📖 Introduction

**Ziping Bazi** is a professional Bazi (Four Pillars of Destiny) calculator plugin for Obsidian, integrating traditional Ziping Bazi numerology algorithms. It supports automatic chart calculation, true solar time correction, great luck (Dayun) period analysis, annual/lunar fortune analysis, and case file management. Suitable for numerology research, personal records, and study.

## ✨ Features

### 🔢 Smart Bazi Calculation

- **Automatic Charting**: Computes the Year, Month, Day, and Hour pillars from birth date and time
- **True Solar Time**: Built-in database of 400+ cities with longitude/latitude for automatic true solar time calculation
- **Solar/Lunar Calendar**: Supports both Gregorian and Chinese lunar calendar input
- **Minute Precision**: Supports precise birth time input with hour-period adjustment

### 📊 Fortune Analysis

- **Ten Gods (Shi Shen)**: Automatic analysis of the Ten Divine Relationships for each pillar
- **Great Luck (Dayun)**: Precise calculation of luck period start age and 10-year cycles, including Jiao Yun (luck transition) date description
- **Annual Fortune (Liunian)**: View yearly fortune干支 (Heavenly Stem & Earthly Branch) changes
- **Lunar Fortune (Liuyue)**: Month-by-month analysis of fortune stems and branches
- **Minor Luck (Xiaoyun)**: Supports minor luck calculation
- **Na Yin (Elemental Essence)**: Displays the 60-cycle Na Yin五行
- **Twelve Stages (Zhang Sheng)**: Analysis of the 12 life stages (Birth, Bath, Belt, etc.)
- **Hidden Stems**: Analysis of earthly branch hidden heavenly stems and associated Ten Gods
- **Xun Kong (Void)**: Automatic void calculation for each pillar

### 🧩 Code Block Rendering

Embed Bazi charts directly in your notes using fenced code blocks:

<pre><code>```ziping
2026.06.21-12.00-Y
```
</code></pre>

The code block view uses **Shadow DOM isolation** to prevent theme CSS leakage, ensuring consistent display across all Obsidian themes. Supports interactive selection of Dayun/Liunian/Liuyue — identical experience to the sidebar view.

### 💾 Case Management

- **One-click Save**: Save chart results as structured Markdown files
- **YAML Frontmatter**: Auto-generated standardized metadata headers
- **Flexible Paths**: Customizable save directory with tag support
- **Code Recognition**: Auto-detect chart codes in notes for quick loading

### 🎛️ Interface

- **Sidebar View**: Integrated in Obsidian's right sidebar, always accessible
- **Inline Rendering**: Render Bazi information directly inside notes
- **Command Palette**: Full Obsidian command palette support
- **Ribbon Icon**: One-click access from the ribbon

## 🔧 Installation

### Method 1: Community Plugins

1. Open Obsidian **Settings** → **Community Plugins**
2. Search for **"Ziping"** or **"子平排盘"**
3. Click Install and Enable

### Method 2: BRAT

1. Install and enable the [BRAT](obsidian://show-plugin?id=obsidian42-brat) plugin
2. Add beta plugin in BRAT settings: `https://github.com/Dyse-Sofqi/ziping`
3. Select "Latest version" and confirm

### Method 3: Manual

1. Download the latest release from [Releases](https://github.com/Dyse-Sofqi/ziping/releases)
2. Extract to `.obsidian/plugins/ziping/`
3. Enable the plugin in Obsidian settings

## 🚀 Quick Start

### Sidebar Charting

1. Click the **DNA icon** in the ribbon or search **"Open Bazi Chart"** in the command palette
2. Enter birth date, time, and gender in the right sidebar
3. Click **"Calculate"** to view the complete Bazi chart
4. Interactively select Dayun/Liunian/Liuyue for detailed views
5. Click **"Save"** to export as a note

### Code Block Rendering

Write a chart code block in any note:

<pre><code>```ziping
1990.05.15-10.30-Y
2001.08.20-14.45-X
```
</code></pre>

One chart code per line; multiple codes render sequentially.

### Chart Code Format

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
| Case Path | Directory for saved chart files | `命例` |
| True Solar Time | Enable/disable true solar time correction | Off |
| Longitude | Your longitude | `120` |
| Latitude | Your latitude | `35` |
| Province | Select province | - |
| City | Select city (auto-fills longitude/latitude) | - |

## 📝 Case File Format

Saved chart files follow this structure:

```markdown
---
title: "Zhang San"
author: ""
tags: [Bazi/Case/Friend]
created: 2026-06-21T12:00:00
modified: 2026-06-21T12:00:00
aliases: []
---

#### 1990.05.15-10.30-Y，Zhang San

```ziping
1990.05.15-10.30-Y
```

- 2004 Age 15 Jia-Zi
	- 2005 Age 16 Yi-Chou
	- 2006 Age 17 Bing-Yin
	...
```

## 🧱 Technical Architecture

```
src/
├── main.ts                 # Plugin entry: register views, commands, settings
├── Paipan.ts               # Core engine wrapper
├── models/
│   └── types.ts            # TypeScript type definitions
├── services/
│   ├── BaziService.ts      # Bazi calculation service
│   └── IdentificationService.ts  # Chart code recognition service
├── ui/
│   ├── BaziView.ts         # Sidebar view
│   ├── ZipingCodeBlockRenderer.ts  # Code block renderer (Shadow DOM)
│   ├── zipingShadowStyles.ts       # Shadow DOM CSS
│   ├── components/
│   │   ├── BaziTable.ts    # Bazi chart table component
│   │   ├── DayunDisplay.ts # Great luck display component
│   │   ├── LiuyueDisplay.ts # Lunar fortune display component
│   │   └── ResultDisplay.ts # Result display component
│   └── cities/             # City longitude/latitude data
└── utils/
    └── styleUtils.ts       # Style utilities
```

### Technical Highlights

- **Client-side only**: All calculations run locally — no network requests
- **Shadow DOM isolation**: Code block views use Shadow DOM + `CSSStyleSheet.adoptedStyleSheets` for complete theme isolation (bypasses the "no style element creation" review rule)
- **Paipan.js engine**: Built on a proven Bazi calculation algorithm library
- **Obsidian API**: Uses standard APIs: `registerMarkdownCodeBlockProcessor`, `registerView`, `addCommand`, etc.

## 🔄 Version History

| Version | Notes |
|---------|-------|
| 1.2.5 | Restore Shadow DOM isolation; resolve all plugin review errors |
| 1.2.4 | Fix ESLint violations: replace `any` types, add interface methods, bump minAppVersion |
| 1.2.3 | Fix code block rendering interaction and Dayun switching logic |
| 1.2.0 | New: lunar fortune analysis, Ganzhi calendar display, code block rendering |

## ❓ FAQ

**Q: Results differ from other Bazi tools?**
A: Different tools may use different algorithm parameters (luck start calculation rules, solar term timing, etc.). This plugin is based on the paipan.js engine with transparent, traceable algorithms.

**Q: Code block not displaying correctly?**
A: Verify the chart code format is `YYYY.MM.DD-HH.MM-Y/X`. If theme styles are interfering, upgrade to v1.2.5+ which uses Shadow DOM isolation.

**Q: How to change the save path?**
A: Modify "Case Path" in plugin settings. Supports absolute paths or paths relative to the vault.

## 🤝 Support

For issues or suggestions, please submit an [Issue](https://github.com/Dyse-Sofqi/ziping/issues) or Pull Request.

If this plugin helps you, feel free to buy me a coffee:

![Donation QR](zanshang.jpg)

---

## 📄 License

MIT
