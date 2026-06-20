// ═══════════════════════════════════════════════════════════════════
// Shadow DOM CSS  —  与 styles.css + styleUtils.ts 同步
// 用在 ZipingCodeBlockRenderer 的 Shadow Root 中，彻底隔离主题渗透
// 修改 styles.css 或 styleUtils.ts 后请同步更新此文件
//
// 重要：ziping-* 工具类的选择器不得加 .bazi-result-container 前缀，
//       以保持与 style-mod (styleUtils.ts) 完全相同的特异性 (0,1,0)。
//       这确保 .bazi-result-container th/td { border:none } (0,1,1)
//       能正确覆盖 .ziping-table-cell/header { border:1px } (0,1,0)。
// ═══════════════════════════════════════════════════════════════════

export const SHADOW_BAZI_CSS = `
/* ── Host: 影子宿主 ── */
:host {
    display: block;
}

/* ── Root container: 屏蔽所有从 light-DOM 继承的排版属性 ── */
.bazi-result-container {
    width: auto;
    padding: 6px;
    display: inline-block;
    line-height: 1.25;
    font-size: 15px;
    color: var(--text-normal);
    font-family: var(--font-text);
    text-align: start;
    letter-spacing: normal;
    word-spacing: normal;
}

/* ── Element-level 重置 ── */
.bazi-result-container p {
    margin: 1px 0;
    font-size: inherit;
    line-height: 1.25;
}
.bazi-result-container span {
    font-size: inherit;
}
.bazi-result-container td {
    font-size: inherit;
    line-height: 1.0;
}
.bazi-result-container th {
    font-size: inherit;
    line-height: 1.15;
}
.bazi-result-container button {
    font-size: inherit;
    line-height: 1.1;
}

/* ── Table 重置 ── */
.bazi-result-container table {
    width: min-content;
    border-collapse: collapse;
    border-spacing: 0;
    border: 1px solid #ccc;
    white-space: nowrap;
    background-color: transparent;
    font-size: inherit;
    margin: 0;
}
.bazi-result-container tr {
    background-color: transparent;
}
.bazi-result-container tr:nth-child(even) {
    background-color: transparent;
}
.bazi-result-container tr:nth-child(odd) {
    background-color: transparent;
}
.bazi-result-container th,
.bazi-result-container td {
    border: none;
    padding: 6px 6px;
    text-align: center;
    line-height: 1;
}
.bazi-result-container th {
    background-color: transparent;
    font-weight: bold;
    border-bottom: 1px solid #ccc;
}
.bazi-result-container tr td:first-child {
    font-weight: bold;
    background-color: transparent;
    border-right: 1px solid #ccc;
}

/* ── 天干行／地支行 ── */
.bazi-result-container tr:nth-child(3) td:not(:first-child) {
    background-color: rgba(0, 0, 0, 0.03);
    font-weight: 600;
    font-size: 27px;
    font-family: "汇文正楷", "方正楷体", "华文楷体", "KaiTi", "STKaiti", "楷体", serif;
    line-height: 1.1;
}
.bazi-result-container tr:nth-child(4) td:not(:first-child) {
    background-color: rgba(0, 0, 0, 0.03);
    font-weight: 600;
    font-size: 27px;
    font-family: "汇文正楷", "方正楷体", "华文楷体", "KaiTi", "STKaiti", "楷体", serif;
    line-height: 1.1;
}

.bazi-result-container .bazi-table tr:nth-child(3) td,
.bazi-result-container .bazi-table th:nth-child(3) td,
.bazi-result-container .bazi-table tr:nth-child(4) td,
.bazi-result-container .bazi-table th:nth-child(4) td {
    padding: 8px 8px;
}
.bazi-result-container .ziping-table-cell.ziping-border-left {
    border-left: 1px solid #ccc;
}

/* ── 干支历行 ── */
.bazi-result-container .gzh-row {
    display: flex;
    gap: 0px;
    flex-wrap: nowrap;
    align-items: center;
    margin: 5px 0px;
}
.bazi-result-container .gzh-text {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.bazi-result-container .gzh-row .hour-adjust-btn {
    padding: 2px 8px;
    min-width: auto;
    height: auto;
    font-size: 12px;
    background-color: var(--background-secondary);
    border-radius: 0;
    box-shadow: none;
    outline: 1px solid #ccc;
}
.bazi-result-container .hour-adjust-btn:hover {
    color: var(--interactive-normal);
    background-color: var(--interactive-accent, #e0e0e0);
}

/* ── 时间信息 ── */
.bazi-result-container .bazi-time-info p {
    margin: 5px 0;
    margin-top: 1px;
}

/* ── 大运段落 ── */
.bazi-result-container .dayun-info p {
    margin: 6px 0;
}

/* ── 大运／流年／流月列表容器 ── */
.bazi-result-container .dayun-list,
.bazi-result-container .liunian-list,
.bazi-result-container .liuyue-list {
    display: flex;
    flex-wrap: nowrap;
    gap: 0;
    margin-bottom: 6px;
    width: 100%;
    overflow-x: auto;
}

/* ── 大运／流年／流月按钮 ── */
.bazi-result-container .dayun-list .dayun-btn,
.bazi-result-container .liunian-list .liunian-btn,
.bazi-result-container .liuyue-list .liuyue-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    padding: 6px 6px;
    min-width: 41px;
    height: auto;
    border: none;
    background-color: var(--background-primary);
    line-height: 1.3;
    border-radius: 0;
    box-shadow: none !important;
}
.bazi-result-container .dayun-list .dayun-btn:hover,
.bazi-result-container .liunian-list .liunian-btn:hover,
.bazi-result-container .liuyue-list .liuyue-btn:hover {
    background-color: var(--background-secondary-alt);
}

/* ── 大运按钮内部 ── */
.bazi-result-container .dayun-year {
    font-size: 12px;
    line-height: 1.3;
    margin: 0;
}
.bazi-result-container .dayun-age {
    font-weight: bold;
    font-size: 12px;
    line-height: 1.3;
    margin: 0;
}
.bazi-result-container .dayun-gan,
.bazi-result-container .dayun-zhi {
    font-size: 14px;
    line-height: 1.3;
    margin: 0;
}

/* ── 流年按钮内部 ── */
.bazi-result-container .liunian-year {
    font-size: 12px;
    line-height: 1.3;
    margin: 0;
}
.bazi-result-container .liunian-gan,
.bazi-result-container .liunian-zhi {
    font-size: 14px;
    line-height: 1.3;
    margin: 0;
}
.bazi-result-container .liunian-shishen {
    font-size: 12px;
    line-height: 1.3;
    margin: 0;
    opacity: 0.8;
}
.bazi-result-container .liunian-row {
    font-size: 12px;
    line-height: 1.3;
    margin: 2px 0;
    text-align: center;
    color: var(--text-muted);
}

/* ── 流月按钮内部 ── */
.bazi-result-container .liuyue-name {
    font-size: 12px;
    line-height: 1.2;
    margin: 0;
    font-weight: 500;
}
.bazi-result-container .liuyue-date {
    font-size: 10px;
    line-height: 1.2;
    margin: 0;
    opacity: 0.8;
}
.bazi-result-container .liuyue-gan,
.bazi-result-container .liuyue-zhi {
    font-size: 14px;
    line-height: 1.3;
    margin: 0;
}
.bazi-result-container .liuyue-shishen {
    font-size: 11px;
    line-height: 1.2;
    margin: 0;
    opacity: 0.7;
}

/* ── 按钮选中状态 ── */
.bazi-result-container .dayun-btn.is-selected,
.bazi-result-container .liunian-btn.is-selected,
.bazi-result-container .liuyue-btn.is-selected {
    border-color: var(--interactive-accent, #7d5fff);
    font-weight: 500;
    background-color: rgba(0, 0, 0, 0.08);
}

@media (prefers-color-scheme: dark) {
    .bazi-result-container .dayun-btn.is-selected,
    .bazi-result-container .liunian-btn.is-selected,
    .bazi-result-container .liuyue-btn.is-selected {
        background-color: rgba(255, 255, 255, 0.08);
    }
}

:host-context([data-theme="dark"]) .bazi-result-container .dayun-btn.is-selected,
:host-context([data-theme="dark"]) .bazi-result-container .liunian-btn.is-selected,
:host-context([data-theme="dark"]) .bazi-result-container .liuyue-btn.is-selected {
    background-color: var(--button-selected-background, rgba(125, 95, 255, 0.15));
}

/* ── 五行颜色 — 默认（深色） ── */
.c-木 { color: #4caf50 !important; font-weight: 600 !important; }
.c-火 { color: #f44336 !important; font-weight: 600 !important; }
.c-土 { color: #cf7543 !important; font-weight: 600 !important; }
.c-金 { color: #ffb74d !important; font-weight: 600 !important; }
.c-水 { color: #42a5f5 !important; font-weight: 600 !important; }

/* ── 五行颜色 — 浅色 ── */
:host-context(.theme-light) .c-木 { color: #2b8a3e !important; }
:host-context(.theme-light) .c-火 { color: #c92a2a !important; }
:host-context(.theme-light) .c-土 { color: #846358 !important; }
:host-context(.theme-light) .c-金 { color: #f08c00 !important; }
:host-context(.theme-light) .c-水 { color: #1971c2 !important; }

/* ── 纳音五行 — 深色（第 8 行） ── */
.bazi-result-container tr:nth-child(8) .c-木 { color: #81c784 !important; }
.bazi-result-container tr:nth-child(8) .c-火 { color: #e57373 !important; }
.bazi-result-container tr:nth-child(8) .c-土 { color: #ba68c8 !important; }
.bazi-result-container tr:nth-child(8) .c-金 { color: #ffb74d !important; }
.bazi-result-container tr:nth-child(8) .c-水 { color: #64b5f6 !important; }

:host-context(.theme-light) .bazi-result-container tr:nth-child(8) .c-木 { color: #4caf50 !important; }
:host-context(.theme-light) .bazi-result-container tr:nth-child(8) .c-火 { color: #ef5350 !important; }
:host-context(.theme-light) .bazi-result-container tr:nth-child(8) .c-土 { color: #ab47bc !important; }
:host-context(.theme-light) .bazi-result-container tr:nth-child(8) .c-金 { color: #ff9800 !important; }
:host-context(.theme-light) .bazi-result-container tr:nth-child(8) .c-水 { color: #2196f3 !important; }

/* ── Switch 复选框 ── */
.bazi-result-container .ziping-switch-checkbox {
    -webkit-appearance: none !important;
    appearance: none !important;
    width: 36px !important;
    height: 20px !important;
    background-color: #ccc !important;
    border-radius: 20px !important;
    position: relative !important;
    transition: background-color 0.2s;
    outline: none !important;
    border: none !important;
    cursor: pointer;
    margin: 0;
    padding: 0;
    vertical-align: middle;
    flex-shrink: 0;
}

.bazi-result-container .ziping-switch-checkbox::before {
    content: "" !important;
    position: absolute !important;
    width: 16px;
    height: 16px;
    border-radius: 50% !important;
    background-color: white;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
}

.bazi-result-container .ziping-switch-checkbox:checked:after {
    content: none !important;
}

.bazi-result-container .ziping-switch-checkbox:checked {
    background-color: var(--interactive-accent) !important;
    background-image: none !important;
}

.bazi-result-container .ziping-switch-checkbox:checked::before {
    transform: translateX(16px) !important;
}

/* ══════════════════════════════════════════════════════════════ */
/* 工具类（保持 (0,1,0) 特异性 — 不加 .bazi-result-container 前缀） */
/* ══════════════════════════════════════════════════════════════ */

/* ── 来自 styleUtils.ts ── */
.ziping-flex { display: flex; }
.ziping-flex-column { flex-direction: column; }
.ziping-flex-end { display: flex; justify-content: flex-end; }
.ziping-flex-align-center { display: flex; align-items: center; }
.ziping-flex-gap-0 { display: flex; gap: 0px; align-items: center; }
.ziping-flex-gap-0-mb-6-0-6-0 { display: flex; gap: 0px; margin: 6px 0px 6px 0px; align-items: center; }
.ziping-flex-gap-0-justify-end { display: flex; gap: 0px; align-items: center; justify-content: flex-end; }
.ziping-gap-0 { gap: 0px; }
.ziping-gap-10 { gap: 10px; }
.ziping-margin-0 { margin: 0px; }
.ziping-padding-0 { padding: 0px; }
.ziping-width-100 { width: 100%; }
.ziping-border-none { border: none; }
.ziping-boxShadow-none { box-shadow: none; }
.ziping-border-radius-0 { border-radius: 0px; }
.ziping-border-radius-5 { border-radius: 5px; }
.ziping-border-left { border-left: 1px solid #ccc; }
.ziping-max-height-300 { max-height: 300px; }
.ziping-overflow-y-auto { overflow-y: auto; }
.ziping-font-bold { font-weight: bold; }
.ziping-font-weight-600 { font-weight: 600; }
.ziping-table-style { width: 100%; border-collapse: collapse; margin-top: 5px; }
.ziping-table-header { border: 1px solid #ccc; padding: 6px 8px; background-color: #f5f5f5; }
.ziping-table-cell { border: 1px solid #ccc; padding: 6px 8px; text-align: center; }
.ziping-table-cell-bold { padding: 6px 8px; font-weight: bold; text-align: center; }
.ziping-button-active { background-color: var(--background-secondary); color: var(--interactive-accent); }
.ziping-button-inactive { background-color: #f1f1f1; color: black; }
.ziping-list-style-none { list-style-type: none; padding: 0; }
.ziping-list-item-padding { padding: 8px 0; }
.ziping-margin-top-20 { margin-top: 20px; }
.ziping-margin-bottom-10 { margin-bottom: 10px; }
.ziping-border-1-ccc { border: 1px solid #ccc; }
.ziping-transition-bg { cursor: pointer; transition: background-color 0.2s; }
.ziping-outline-1-ccc { outline: 1px solid #ccc; }
.ziping-background-f5f5f5 { background-color: #f5f5f5; }
.ziping-flex-wrap { flex-wrap: wrap; }
.ziping-flex-nowrap { flex-wrap: nowrap; }
.ziping-display-none { display: none; }

/* ── 来自 styles.css 的额外工具类 ── */
.ziping-margin-left-10 { margin-left: 10px; }
.ziping-margin-right-10 { margin-right: 10px; }
.ziping-margin-left-auto { margin-left: auto; }

/* ── si-ling ── */
.si-ling { }
`;
