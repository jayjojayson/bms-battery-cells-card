import "./bms-battery-cells-card-editor.js";
import de from './lang-de.js';
import en from './lang-en.js';

console.log(
  "%c🔋 BMS Battery Cells Card v_1.3 loaded",
  "background: #2ecc71; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;"
);

class BmsBatteryCellsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
        this.langs = { de, en };
    }

    static getConfigElement() {
        return document.createElement("bms-battery-cells-card-editor");
    }

    static getStubConfig() {
        return {
            title: "Batterie Zellen",
            cells: Array.from({length: 4}, (_, i) => ({ entity: `sensor.cell_${i+1}`, name: `${i+1}` }))
        };
    }

    set hass(hass) {
        this._hass = hass;
        if (!this._initialized) {
            this._initRender();
        }
        this._updateValues();
    }

    setConfig(config) {
        if (!config) throw new Error("Invalid configuration");
        this._config = {
            title: "Batterie Zellen",
            show_legend: true,
            container_padding: 16,
            card_height: 380,
            cell_gap: 4,
            show_values_on_top: false,
            hide_bars: false,
            horizontal_layout: false,
            show_as_table: false, // NEU: Tabellenansicht
            enable_animations: true,
            min_voltage: 2.60,
            max_voltage: 3.65,
            show_values: true,
            show_min_max: true,
            show_average: false,
            show_voltage_diff: false,
            thicker_borders: false, 
            ...config
        };
        this._initialized = false;
        if (this._hass) this._initRender();
    }

    _localize(key) {
        const lang = this._hass?.locale?.language || 'en';
        const code = lang.split('-')[0];
        const dict = this.langs[code] || this.langs['en'];
        return key.split('.').reduce((o, i) => (o ? o[i] : null), dict) || key;
    }

    _parseNumber(entityId) {
        if (!this._hass || !entityId) return null;
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return null;
        
        let valStr = String(stateObj.state).trim();
        if (valStr === 'unavailable' || valStr === 'unknown') return null;

        valStr = valStr.replace(',', '.');
        const val = parseFloat(valStr);
        return isNaN(val) ? null : val;
    }

    _fireMoreInfo(entityId) {
        if (!entityId) return;
        const event = new CustomEvent("hass-more-info", {
            detail: { entityId },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    _initRender() {
        if (!this._config || !this._hass) return;

        const { title, cells = [], card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table } = this._config;
        const colors = this._getColors();
        const cellCount = cells.length;

        // --- DARSTELLUNGS-LOGIK ---
        let valDisplay = show_values ? 'inline-block' : 'none';
        let nameFontSize = '10px';
        let namePadding = '2px 6px';
        let borderWidth = thicker_borders ? '2px' : '1px';

        if (cellCount > 10) { 
            valDisplay = 'none'; 
            nameFontSize = '9px';
            namePadding = '1px 3px';
        }

        const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
        let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
        if (!isStandard) {
            const range = max_voltage - min_voltage;
            const step = range / 7;
            for (let i = 0; i <= 7; i++) {
                const val = Math.round((min_voltage + (step * i)) * 1000) / 1000;
                mapPoints.push(val);
            }
        }

        let scaleLabels = [];
        let trackGradient = '';
        
        if (horizontal_layout) {
            scaleLabels = [...mapPoints].map(v => v.toFixed(2) + 'V'); 
            trackGradient = `linear-gradient(to right, #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)`;
        } else {
            scaleLabels = [...mapPoints].reverse().map(v => v.toFixed(2) + 'V');
            trackGradient = `linear-gradient(to top, #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)`;
        }

        const style = `
            <style>
                :host { 
                    display: block; 
                    --cell-gap: ${cell_gap}px; 
                    --badge-bg-color: rgba(0, 0, 0, 0.5);
                    --val-display: ${valDisplay};
                    --name-fs: ${nameFontSize};
                    --name-pad: ${namePadding};
                    --bar-border-width: ${borderWidth};
                    /* Table View schaltet main container aus */
                    --main-display: ${show_as_table || hide_bars ? 'none' : (horizontal_layout ? 'flex' : 'flex')};
                    --main-direction: ${horizontal_layout ? 'column' : 'row'};
                    --cell-direction: ${horizontal_layout ? 'row' : 'column'};
                    --bar-transition: ${horizontal_layout ? 'width' : 'height'} 0.4s ease-out;
                    --legend-direction: ${horizontal_layout ? 'row' : 'column'};
                    --legend-align: ${horizontal_layout ? 'space-between' : 'space-between'};
                    --legend-border: ${horizontal_layout ? 'none' : '1px solid rgba(255,255,255,0.1)'};
                    --legend-border-top: ${horizontal_layout ? '1px solid rgba(255,255,255,0.1)' : 'none'};
                }
                
                ha-card {
                    display: flex; flex-direction: column;
                    height: ${(hide_bars || horizontal_layout || show_as_table) ? 'auto' : card_height + 'px'};
                    padding: 16px; box-sizing: border-box; position: relative;
                    color: ${colors.text}; font-family: var(--paper-font-body1_-_font-family);
                    overflow: hidden; 
                }

                .header.card-header {
                    display: grid; grid-template-areas: "title stats" "subinfo stats";
                    grid-template-columns: 1fr auto; align-items: center;
                    margin-bottom: ${(hide_bars || show_as_table) ? '12px' : '12px'}; 
                    flex-shrink: 0; padding-bottom: 8px;
                    border-bottom: ${(hide_bars && !show_as_table) ? 'none' : '1px solid rgba(255,255,255,0.05)'};
                }
                .title { grid-area: title; font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; color: ${colors.text}; margin-top: -4px; }
                
                .sub-info-row { grid-area: subinfo; display: flex; gap: 12px; align-items: center; font-size: 0.85rem; color: var(--secondary-text-color); margin-top: 2px; }
                .sub-info-item, .stat-item { cursor: pointer; transition: opacity 0.2s; }
                .sub-info-item:hover, .stat-item:hover { opacity: 0.7; }
                .sub-info-item { display: flex; align-items: center; gap: 4px; }
                .sub-info-item ha-icon { --mdc-icon-size: 16px; color: var(--secondary-text-color); }

                .stats { grid-area: stats; display: flex; gap: 16px; align-items: center; justify-content: flex-end; }
                .stat-item { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; }
                .stat-value-row { display: flex; align-items: center; gap: 6px; font-size: 1.1rem; font-weight: 600; line-height: 1.2; }
                .stat-value-row.vertical-layout { flex-direction: column-reverse; gap: 2px; align-items: center; }
                .stat-label { font-size: 0.75rem; color: var(--secondary-text-color); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
                
                .main-container.cells-container {
                    flex: 1; display: var(--main-display);
                    flex-direction: var(--main-direction); gap: var(--cell-gap); 
                    align-items: ${horizontal_layout ? 'stretch' : 'flex-end'}; 
                    position: relative; overflow: hidden;
                }
                ${horizontal_layout ? '.main-container.cells-container { overflow-y: auto !important; }' : ''}

                /* --- TABLE VIEW --- */
                .table-container {
                    display: ${show_as_table ? 'grid' : 'none'};
                    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
                    gap: 8px;
                    width: 100%;
                    overflow-y: auto;
                }
                .table-item {
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                    padding: 6px 4px;
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .table-item.min-cell { border-color: #2196f3; background: rgba(33, 150, 243, 0.15); }
                .table-item.max-cell { border-color: #f44336; background: rgba(244, 67, 54, 0.15); }
                .table-name { font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px; }
                .table-val { font-size: 0.95rem; font-weight: bold; }

                /* Standard Layout Styles */
                .cell-wrapper.cell-item {
                    flex: 1; 
                    ${horizontal_layout ? 'height: 50px; min-height: 50px;' : 'height: 100%;'}
                    width: 100%; position: relative; border-radius: 6px; overflow: visible;
                    background: rgba(0,0,0,0.2); cursor: pointer; -webkit-tap-highlight-color: transparent;
                    transition: transform 0.2s, box-shadow 0.2s;
                    ${horizontal_layout ? 'display: flex; align-items: center; justify-content: flex-start;' : ''}
                }
                .cell-wrapper.cell-item.min-cell { box-shadow: 0 0 8px rgba(33, 150, 243, 0.6) inset; border: 1px solid rgba(33, 150, 243, 0.5); }
                .cell-wrapper.cell-item.max-cell { box-shadow: 0 0 8px rgba(244, 67, 54, 0.6) inset; border: 1px solid rgba(244, 67, 54, 0.5); }
                
                .custom-tooltip {
                    position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
                    background: rgba(30, 30, 30, 0.95); color: white; padding: 6px 10px;
                    border-radius: 6px; font-size: 12px; font-weight: bold; pointer-events: none;
                    opacity: 0; transition: opacity 0.2s ease-in-out; z-index: 20; white-space: nowrap;
                    border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                }
                .cell-wrapper:hover .custom-tooltip, .cell-wrapper.show-tooltip .custom-tooltip { opacity: 1; }
                
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${trackGradient}; opacity: 0.25; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar {
                    position: absolute; 
                    ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'}
                    background: currentColor; 
                    ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255,255,255,0.6);' : 'border-top: var(--bar-border-width) solid rgba(255,255,255,0.6);'}
                    z-index: 1; transition: var(--bar-transition); 
                    ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'}
                    opacity: 0.3; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; will-change: transform;
                }
                
                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }
                @keyframes shimmer-move-down { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                @keyframes shimmer-move-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                @keyframes shimmer-move-left { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }

                .charging-overlay {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(to ${horizontal_layout ? 'right' : 'top'}, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%);
                    z-index: 2; transform: ${horizontal_layout ? 'translateX(-100%)' : 'translateY(100%)'}; 
                    opacity: 0; pointer-events: none; will-change: transform;
                }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                .cell-bar.is-discharging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-left' : 'shimmer-move-down'} 2s infinite linear; }
                
                .cell-info-layer { 
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;
                    ${horizontal_layout ? 'display: flex; align-items: center; justify-content: space-between; padding: 0 8px;' : ''}
                }
                
                ${!horizontal_layout ? `
                .cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; }
                .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }
                ` : `
                .cell-name-wrap { position: relative; }
                .cell-val-wrap { position: relative; margin-right: 12px; }
                `}

                .cell-name-badge { background: rgba(0,0,0,0.6); color: white; padding: var(--name-pad); font-size: var(--name-fs); border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px); white-space: nowrap; }
                .cell-val-badge.cell-voltage { 
                    background: var(--badge-bg-color); color: #fff; padding: 4px 10px; font-size: 13px;
                    border-radius: 12px; font-weight: 700; letter-spacing: 0.5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); 
                    display: var(--val-display); white-space: nowrap; 
                }
                
                .legend-col { 
                    display: flex; flex-direction: var(--legend-direction); justify-content: var(--legend-align); 
                    ${horizontal_layout ? 'width: 100%; height: 20px; border-top: var(--legend-border-top); padding-top: 2px;' : 'height: 100%; padding-right: 8px; margin-right: 4px; border-right: var(--legend-border); min-width: 40px;'}
                    font-size: 11px; color: var(--secondary-text-color); text-align: right; font-weight: 500; 
                }
                ha-icon { --mdc-icon-size: 20px; }
                @media (max-width: 480px) {
                    .header.card-header { grid-template-areas: "title stats" "none subinfo"; grid-template-rows: auto auto; }
                    .sub-info-row { justify-content: flex-end; margin-top: 4px; }
                }
            </style>
        `;

        let containerHtml = '';
        
        if (show_as_table) {
             // TABLE VIEW
             containerHtml = `
                <div class="table-container">
                    ${cells.map((cell, index) => `
                        <div class="table-item" id="table-item-${index}">
                            <span class="table-name">${cell.name || (index+1)}</span>
                            <span class="table-val" id="table-val-${index}">-</span>
                        </div>
                    `).join('')}
                </div>
             `;
        } else if (!horizontal_layout) {
            // VERTIKAL
            containerHtml = `
                <div class="main-container cells-container">
                    ${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}
                    ${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}
                </div>
            `;
        } else {
            // HORIZONTAL
            containerHtml = `
                <div class="main-container cells-container">
                    ${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}
                    ${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}
                </div>
            `;
        }

        const html = `
            <ha-card>
                <div class="header card-header">
                    <div class="title">${title}</div>
                    <div class="sub-info-row" id="sub-info-container"></div>
                    <div class="stats" id="stats-container"></div>
                </div>
                ${containerHtml}
            </ha-card>
        `;

        this.shadowRoot.innerHTML = style + html;
        this._initialized = true;

        const wrappers = this.shadowRoot.querySelectorAll('.cell-wrapper');
        wrappers.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation(); 
                wrappers.forEach(w => { if(w !== el) w.classList.remove('show-tooltip'); });
                el.classList.toggle('show-tooltip');
            });
        });
        document.addEventListener('click', () => { wrappers.forEach(w => w.classList.remove('show-tooltip')); });
    }
    
    _renderCellHtml(cell, index) {
        return `
            <div class="cell-wrapper cell-item" id="cell-wrap-${index}">
                <div class="custom-tooltip" id="tooltip-${index}">-</div>
                <div class="cell-track-bg"></div>
                <div class="cell-bar" id="bar-${index}" style="height: 0%; width: 0%;">
                    <div class="charging-overlay"></div>
                </div>
                <div class="cell-info-layer">
                    ${this._config.horizontal_layout ? 
                        `<div class="cell-name-wrap"><span class="cell-name-badge">${cell.name}</span></div>
                         <div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div>` 
                        : 
                        `<div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div>
                         <div class="cell-name-wrap"><span class="cell-name-badge">${cell.name}</span></div>`
                    }
                </div>
            </div>
        `;
    }

    _updateColors() {
        return {
            bg: 'var(--card-background-color, #1c1c1e)',
            text: 'var(--primary-text-color, #ffffff)',
            textSecondary: 'var(--secondary-text-color, #9e9e9e)'
        };
    }

    _getColors() { return this._updateColors(); }

    _updateValues() {
        if (!this._initialized || !this._hass) return;

        const { cells = [], soc_entity, watt_entity, cell_diff_sensor, temp_entity, total_voltage_entity, total_current_entity, show_values_on_top, enable_animations, min_voltage, max_voltage, show_average, show_min_max, show_voltage_diff, hide_bars, horizontal_layout, show_as_table } = this._config;
        const rowClass = show_values_on_top ? 'stat-value-row vertical-layout' : 'stat-value-row';

        const wattVal = this._parseNumber(watt_entity);
        const isCharging = (enable_animations !== false) && (wattVal !== null && wattVal > 0);
        const isDischarging = (enable_animations !== false) && (wattVal !== null && wattVal < 0);

        let minV = 999; let maxV = -999; let minIdx = -1; let maxIdx = -1; let cellValues = [];
        cells.forEach((cell, index) => {
            const val = this._parseNumber(cell.entity);
            if (val !== null) {
                const v = (val > 10) ? val / 1000 : val;
                cellValues[index] = v;
                if (v < minV) { minV = v; minIdx = index; }
                if (v > maxV) { maxV = v; maxIdx = index; }
            }
        });

        // --- SUB INFO & STATS ---
        const subInfoContainer = this.shadowRoot.getElementById('sub-info-container');
        if (subInfoContainer) {
            const vTotal = this._parseNumber(total_voltage_entity);
            const iTotal = this._parseNumber(total_current_entity);
            const temp = this._parseNumber(temp_entity);
            let idx = 0;
            const updateElement = (container, id, index, renderFn) => {
                let el = container.querySelector(`#${id}`);
                if (!el) { el = document.createElement('div'); el.id = id; if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                if (container.children[index] !== el) { if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                renderFn(el); return 1;
            };
            const removeElement = (container, id) => { const el = container.querySelector(`#${id}`); if (el) el.remove(); return 0; };

            if (total_voltage_entity && vTotal !== null) {
                idx += updateElement(subInfoContainer, 'sub-volt', idx, (el) => {
                    el.className = 'sub-info-item';
                    const content = `<ha-icon icon="mdi:sine-wave"></ha-icon><span>${vTotal.toFixed(2)}V</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(total_voltage_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-volt');
            
            if (total_current_entity && iTotal !== null) {
                idx += updateElement(subInfoContainer, 'sub-curr', idx, (el) => {
                    el.className = 'sub-info-item';
                    const content = `<ha-icon icon="mdi:current-dc"></ha-icon><span>${iTotal.toFixed(1)}A</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(total_current_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-curr');
            
            if (temp_entity && temp !== null) {
                idx += updateElement(subInfoContainer, 'sub-temp', idx, (el) => {
                    el.className = 'sub-info-item';
                    const tColor = (temp < 0) ? '#42a5f5' : ((temp > 45) ? '#ef5350' : 'var(--secondary-text-color)');
                    el.style.color = tColor;
                    const content = `<ha-icon icon="mdi:thermometer" style="${tColor ? 'color:'+tColor : ''}"></ha-icon><span>${temp}°C</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(temp_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-temp');
        }

        const statsContainer = this.shadowRoot.getElementById('stats-container');
        if (statsContainer) {
            const socValRaw = this._parseNumber(soc_entity);
            let diffVal = this._parseNumber(cell_diff_sensor);
            if (diffVal !== null && diffVal < 1) diffVal *= 1000;
            
            let idx = 0;
            const updateElement = (container, id, index, renderFn) => {
                let el = container.querySelector(`#${id}`);
                if (!el) { el = document.createElement('div'); el.id = id; if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                if (container.children[index] !== el) { if (index < container.children.length) container.insertBefore(el, container.children[index]); else container.appendChild(el); }
                renderFn(el); return 1;
            };
            const removeElement = (container, id) => { const el = container.querySelector(`#${id}`); if (el) el.remove(); return 0; };

            if (watt_entity && wattVal !== null && Math.abs(wattVal) > 0.1) {
                idx += updateElement(statsContainer, 'stat-power', idx, (el) => {
                    el.className = 'stat-item';
                    const wColor = (wattVal > 0) ? '#00e676' : '#2979ff';
                    const icon = (wattVal > 0) ? 'mdi:battery-charging' : 'mdi:lightning-bolt';
                    const content = `<span class="stat-label">${this._localize('card.power')}</span><div class="${rowClass}" style="color: ${wColor}"><ha-icon icon="${icon}"></ha-icon><span>${wattVal.toFixed(2)} <span style="font-size:0.8em">W</span></span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(watt_entity); };
                });
            } else idx += removeElement(statsContainer, 'stat-power');

            if (soc_entity) {
                idx += updateElement(statsContainer, 'stat-soc', idx, (el) => {
                    el.className = 'stat-item';
                    const valStr = socValRaw !== null ? `${Math.round(socValRaw)}%` : '--';
                    const color = (socValRaw !== null && socValRaw < 20) ? '#ef5350' : ((socValRaw !== null && socValRaw < 50) ? '#ffa726' : '#66bb6a');
                    const socInt = Math.round(socValRaw);
                    const iconName = socInt >= 95 ? 'mdi:battery' : `mdi:battery-${Math.round(socInt/10)*10}`;
                    const content = `<span class="stat-label">${this._localize('card.soc')}</span><div class="${rowClass}" style="color: ${color}"><ha-icon icon="${iconName}"></ha-icon><span>${valStr}</span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(soc_entity); };
                });
            } else idx += removeElement(statsContainer, 'stat-soc');
            
            let driftContent = null;
            let driftEntity = null;
            let driftColor = '';
            
            if (cell_diff_sensor && diffVal !== null) {
                driftEntity = cell_diff_sensor;
                driftColor = (diffVal > 20) ? '#ef5350' : '#66bb6a';
                driftContent = `<span class="stat-label">${this._localize('card.drift')}</span><div class="${rowClass}" style="color: ${driftColor}"><ha-icon icon="mdi:delta"></ha-icon><span>${Math.round(diffVal)} <span style="font-size:0.8em">mV</span></span></div>`;
            } else if (show_voltage_diff && maxIdx !== -1 && minIdx !== -1) {
                driftEntity = null; 
                const calcDiff = (maxV - minV) * 1000;
                driftColor = (calcDiff > 20) ? '#ef5350' : '#66bb6a';
                driftContent = `<span class="stat-label">${this._localize('card.drift')}</span><div class="${rowClass}" style="color: ${driftColor}"><ha-icon icon="mdi:delta"></ha-icon><span>${Math.round(calcDiff)} <span style="font-size:0.8em">mV</span></span></div>`;
            }

            if (driftContent) {
                idx += updateElement(statsContainer, 'stat-drift', idx, (el) => {
                    el.className = 'stat-item';
                    if(el.innerHTML !== driftContent) el.innerHTML = driftContent;
                    if(driftEntity) {
                        el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(driftEntity); };
                        el.style.cursor = 'pointer';
                    } else {
                        el.onclick = null; el.style.cursor = 'default';
                    }
                });
            } else idx += removeElement(statsContainer, 'stat-drift');
            
            if (show_average) {
                idx += updateElement(statsContainer, 'stat-avg', idx, (el) => {
                    el.className = 'stat-item';
                    let sum = 0; let count = 0; cellValues.forEach(v => { if(v !== undefined) { sum += v; count++; } });
                    const avg = count > 0 ? (sum / count).toFixed(3) : '-';
                    const content = `<span class="stat-label">${this._localize('card.avg_cell')}</span><div class="${rowClass}" style="color: var(--secondary-text-color)"><ha-icon icon="mdi:chart-bell-curve"></ha-icon><span>${avg} <span style="font-size:0.8em">V</span></span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = null; el.style.cursor = 'default';
                });
            } else idx += removeElement(statsContainer, 'stat-avg');
        }

        // --- CELLS UPDATE (Table or Bars) ---
        if (hide_bars && !show_as_table) return;

        if (show_as_table) {
            // Update Table Items
            cells.forEach((cell, index) => {
                const item = this.shadowRoot.getElementById(`table-item-${index}`);
                const valLabel = this.shadowRoot.getElementById(`table-val-${index}`);
                
                if (item && valLabel) {
                    const displayValNum = cellValues[index] || 0;
                    const displayVal = displayValNum > 0 ? `${displayValNum.toFixed(3)} V` : '-';
                    if(valLabel.innerText !== displayVal) valLabel.innerText = displayVal;

                    item.classList.remove('min-cell', 'max-cell');
                    if (show_min_max && displayValNum > 0) {
                        if (index === minIdx) item.classList.add('min-cell');
                        if (index === maxIdx) item.classList.add('max-cell');
                    }
                }
            });
            return;
        }

        // --- BAR CHART UPDATE ---
        const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
        let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
        if (!isStandard) {
            const range = max_voltage - min_voltage;
            const step = range / 7;
            for (let i = 0; i <= 7; i++) mapPoints.push(min_voltage + (step * i));
        }
        const segmentSize = 100 / 7;

        cells.forEach((cell, index) => {
            const bar = this.shadowRoot.getElementById(`bar-${index}`);
            const valLabel = this.shadowRoot.getElementById(`val-${index}`);
            const tooltip = this.shadowRoot.getElementById(`tooltip-${index}`);
            const wrapper = this.shadowRoot.getElementById(`cell-wrap-${index}`);
            
            if (bar && valLabel && wrapper) {
                const displayValNum = cellValues[index] || 0;
                const displayVal = displayValNum > 0 ? `${displayValNum.toFixed(3)} V` : '-';

                if (tooltip) tooltip.innerText = `${cell.name || `Zelle ${index+1}`}: ${displayVal}`;

                wrapper.classList.remove('min-cell', 'max-cell');
                if (show_min_max && displayValNum > 0) {
                    if (index === minIdx) wrapper.classList.add('min-cell');
                    if (index === maxIdx) wrapper.classList.add('max-cell');
                }

                let pct = 0;
                if (displayValNum > 0) {
                    if (displayValNum <= mapPoints[0]) pct = 0;
                    else if (displayValNum >= mapPoints[7]) pct = 100;
                    else {
                        for (let i = 0; i < 7; i++) {
                            if (displayValNum >= mapPoints[i] && displayValNum < mapPoints[i+1]) {
                                 const rel = (displayValNum - mapPoints[i]) / (mapPoints[i+1] - mapPoints[i]);
                                 pct = (i * segmentSize) + (rel * segmentSize);
                                 break;
                            }
                        }
                    }
                }
                
                let color = '#d32f2f'; 
                if (displayValNum >= 2.80) color = '#ffa726'; if (displayValNum >= 3.00) color = '#ffd600'; 
                if (displayValNum >= 3.20) color = '#43a047'; if (displayValNum >= 3.40) color = '#42a5f5'; 
                if (displayValNum >= 3.45) color = '#1565c0'; if (displayValNum >= 3.55) color = '#ff7043'; 

                if (horizontal_layout) {
                    bar.style.width = `${pct}%`;
                    bar.style.height = '100%';
                } else {
                    bar.style.height = `${pct}%`;
                    bar.style.width = '100%';
                }
                bar.style.color = color; 

                if (isCharging) { bar.classList.add('is-charging'); bar.classList.remove('is-discharging'); }
                else if (isDischarging) { bar.classList.remove('is-charging'); bar.classList.add('is-discharging'); }
                else { bar.classList.remove('is-charging'); bar.classList.remove('is-discharging'); }
                
                if (valLabel.innerText !== displayVal) valLabel.innerText = displayVal;
            }
        });
    }
}

customElements.define('bms-battery-cells-card', BmsBatteryCellsCard);

window.customCards = window.customCards || [];
if (!window.customCards.some(c => c.type === "bms-battery-cells-card")) {
    window.customCards.push({
        type: "bms-battery-cells-card",
        name: "BMS Battery Cells Card",
        preview: true,
        description: "Moderne Visualisierung von Batteriezellen Spannungen"
    });
}
