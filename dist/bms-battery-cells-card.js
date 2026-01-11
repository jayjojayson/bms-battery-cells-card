import de from './lang-de.js';
import en from './lang-en.js';

console.log(
  "%c🔋 BMS Battery Cells Card v_1.5 loaded",
  "background: #2ecc71; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;"
);

// Helper um sicherzustellen, dass HA-Komponenten verfügbar sind
const loadCardHelpers = async () => {
  if (window.loadCardHelpers) return window.loadCardHelpers();
  if (customElements.get("hui-view")) {
    const element = document.createElement("hui-view");
    if (element.getCardHelpers) return element.getCardHelpers();
  }
  return undefined;
};

const LitElement = customElements.get("ha-lit-element") || Object.getPrototypeOf(customElements.get("home-assistant-main"));

class BmsBatteryCellsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
        
        if (de && de.card && !de.card.min_cell) de.card.min_cell = "Min Zelle";
        if (en && en.card && !en.card.min_cell) en.card.min_cell = "Min Cell";
        
        this.langs = { de, en };
        this.chartVoltage = null;
        this.chartDrift = null;
    }

    static async getConfigElement() {
        await import("./bms-battery-cells-card-editor.js");
        await loadCardHelpers();
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
            show_as_table: false,
            enable_animations: true,
            min_voltage: 2.60,
            max_voltage: 3.65,
            show_values: true,
            show_min_max: true,
            show_average: false,
            show_voltage_diff: false,
            thicker_borders: false,
            show_detailed_view: false,
            show_cell_list: true,
            show_charts: true,
            show_standard_in_detail: false,
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

    _getState(entityId) {
        if (!this._hass || !entityId) return null;
        return this._hass.states[entityId] ? this._hass.states[entityId].state : null;
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

    _handleSwitchAction(entityId, customOn, customOff) {
        if (!this._hass || !entityId) return;
        const stateObj = this._hass.states[entityId];
        if (!stateObj) return;
        
        const domain = entityId.split('.')[0];
        if (domain === 'switch' || domain === 'input_boolean' || domain === 'light') {
            this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
            return;
        }
        if (domain === 'input_select') {
            const current = stateObj.state;
            const targetOn = customOn && customOn.trim() !== '' ? customOn : 'on';
            const targetOff = customOff && customOff.trim() !== '' ? customOff : 'off';
            const nextOption = (current === targetOn) ? targetOff : targetOn;
            this._hass.callService("input_select", "select_option", { entity_id: entityId, option: nextOption });
        }
    }

    _initRender() {
        if (!this._config || !this._hass) return;
        if (this._config.show_detailed_view) {
            this._renderDetailedView();
        } else {
            this._renderStandardView();
        }
        this._initialized = true;
    }

    // DYNAMIC CHART LOADER
    // =========================================================================
    async _loadChartLib() {
        if (window.Chart) return; 
        try {
            const myUrl = import.meta.url;
            const libUrl = myUrl.substring(0, myUrl.lastIndexOf('/')) + '/chart.umd.min.js';
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = libUrl;
                script.onload = () => { console.log("BMS Card: Chart.js loaded"); resolve(); };
                script.onerror = (e) => { console.error("BMS Card: Chart.js load error", e); reject(e); };
                document.head.appendChild(script);
            });
        } catch (e) { console.error("BMS Card: Error path", e); }
    }

    async _fetchHistory(entityId, hours = 6) {
        if (!entityId) return [];
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        try {
            const history = await this._hass.callApi(
                "GET", 
                `history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}&minimal_response`
            );
            if (history && history[0]) {
                return history[0].map(entry => ({ x: new Date(entry.last_changed).getTime(), y: parseFloat(entry.state) })).filter(pt => !isNaN(pt.y));
            }
            return [];
        } catch (e) { return []; }
    }

    async _initCharts() {
        try { await this._loadChartLib(); } catch(e) { return; }
        setTimeout(async () => {
            const cv = this.shadowRoot.getElementById('canvas-voltage');
            const cd = this.shadowRoot.getElementById('canvas-drift');
            if (cv && this._config.total_voltage_entity && !this.chartVoltage) {
                const dataV = await this._fetchHistory(this._config.total_voltage_entity, 6);
                this.chartVoltage = this._createChart(cv, dataV, '#ffa726', 'V');
            }
            if (cd && this._config.cell_diff_sensor && !this.chartDrift) {
                let dataD = await this._fetchHistory(this._config.cell_diff_sensor, 6);
                this.chartDrift = this._createChart(cd, dataD, '#1e88e5', ''); 
            }
        }, 200);
    }

    _createChart(ctx, data, color, unit = '') {
        if (!window.Chart) return null;
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, color + '66'); 
        gradient.addColorStop(1, color + '00'); 

        return new window.Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    data: data,
                    borderColor: color,
                    backgroundColor: gradient,
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                layout: { padding: 0 },
                plugins: { 
                    legend: { display: false }, 
                    tooltip: { 
                        enabled: true, 
                        mode: 'index', 
                        intersect: false,
                        displayColors: false,
                        callbacks: {
                            title: () => [], 
                            label: (context) => {
                                let val = context.parsed.y;
                                const decimals = (val < 10 && val > -10) ? 3 : 2;
                                return val.toFixed(decimals) + (unit ? ' ' + unit : '');
                            }
                        }
                    } 
                },
                scales: { x: { type: 'linear', display: false }, y: { display: false } },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    _updateChartData(chart, timestamp, value) {
        if (!chart) return;
        const data = chart.data.datasets[0].data;
        data.push({ x: timestamp, y: value });
        const cutoff = timestamp - (6 * 60 * 60 * 1000);
        while(data.length > 0 && data[0].x < cutoff) { data.shift(); }
        chart.update('none');
    }

    // STANDARD VIEW
    // =========================================================================
    _renderStandardView() {
        const { title, cells = [], card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table } = this._config;
        const colors = this._getColors();
        const cellCount = cells.length;
        let valDisplay = show_values ? 'inline-block' : 'none';
        let nameFontSize = '10px'; let namePadding = '2px 6px'; let borderWidth = thicker_borders ? '2px' : '1px';
        if (cellCount > 10) { valDisplay = 'none'; nameFontSize = '9px'; namePadding = '1px 3px'; }

        const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
        let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
        if (!isStandard) {
            const range = max_voltage - min_voltage; const step = range / 7;
            for (let i = 0; i <= 7; i++) mapPoints.push(Math.round((min_voltage + (step * i)) * 1000) / 1000);
        }
        let scaleLabels = horizontal_layout ? [...mapPoints].map(v=>v.toFixed(2)+'V') : [...mapPoints].reverse().map(v=>v.toFixed(2)+'V');
        let trackGradient = horizontal_layout ? `linear-gradient(to right, #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)` : `linear-gradient(to top, #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)`;

        const style = `
            <style>
                :host { display: block; --cell-gap: ${cell_gap}px; --badge-bg-color: rgba(0, 0, 0, 0.5); --val-display: ${valDisplay}; --name-fs: ${nameFontSize}; --name-pad: ${namePadding}; --bar-border-width: ${borderWidth}; --main-display: ${show_as_table || hide_bars ? 'none' : 'flex'}; --main-direction: ${horizontal_layout ? 'column' : 'row'}; --bar-transition: ${horizontal_layout ? 'width' : 'height'} 0.4s ease-out; --legend-direction: ${horizontal_layout ? 'row' : 'column'}; --legend-align: ${horizontal_layout ? 'space-between' : 'space-between'}; --legend-border: ${horizontal_layout ? 'none' : '1px solid rgba(255,255,255,0.1)'}; --legend-border-top: ${horizontal_layout ? '1px solid rgba(255,255,255,0.1)' : 'none'}; }
                ha-card { display: flex; flex-direction: column; z-index: 0; height: ${(hide_bars || horizontal_layout || show_as_table) ? 'auto' : card_height + 'px'}; padding: 16px; box-sizing: border-box; position: relative; color: ${colors.text}; overflow: hidden; }
                .header.card-header { display: grid; grid-template-areas: "title stats" "subinfo stats"; grid-template-columns: 1fr auto; align-items: center; margin-bottom: 12px; flex-shrink: 0; padding-bottom: 8px; border-bottom: ${(hide_bars && !show_as_table) ? 'none' : '1px solid rgba(255,255,255,0.05)'}; }
                .title { grid-area: title; font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; margin-top: -4px; }
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
                .main-container.cells-container { flex: 1; display: var(--main-display); flex-direction: var(--main-direction); gap: var(--cell-gap); align-items: ${horizontal_layout ? 'stretch' : 'flex-end'}; position: relative; overflow: hidden; }
                ${horizontal_layout ? '.main-container.cells-container { overflow-y: auto !important; }' : ''}
                .table-container { display: ${show_as_table ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; width: 100%; overflow-y: auto; }
                .table-item { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid transparent; transition: all 0.2s; }
                .table-item.min-cell { border-color: #2196f3; background: rgba(33, 150, 243, 0.15); }
                .table-item.max-cell { border-color: #f44336; background: rgba(244, 67, 54, 0.15); }
                .table-name { font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px; } .table-val { font-size: 0.95rem; font-weight: bold; }
                .cell-wrapper.cell-item { flex: 1; ${horizontal_layout ? 'height: 50px; min-height: 50px;' : 'height: 100%;'} width: 100%; position: relative; border-radius: 6px; overflow: visible; background: rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: flex-start;' : ''} }
                .cell-wrapper.cell-item.min-cell { box-shadow: 0 0 8px rgba(33, 150, 243, 0.6) inset; border: 1px solid rgba(33, 150, 243, 0.5); }
                .cell-wrapper.cell-item.max-cell { box-shadow: 0 0 8px rgba(244, 67, 54, 0.6) inset; border: 1px solid rgba(244, 67, 54, 0.5); }
                .custom-tooltip { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(30, 30, 30, 0.95); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; pointer-events: none; opacity: 0; transition: opacity 0.2s ease-in-out; z-index: 20; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5); }
                .cell-wrapper:hover .custom-tooltip, .cell-wrapper.show-tooltip .custom-tooltip { opacity: 1; }
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${trackGradient}; opacity: 0.25; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar { position: absolute; ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'} background: currentColor; ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255,255,255,0.6);' : 'border-top: var(--bar-border-width) solid rgba(255,255,255,0.6);'} z-index: 1; transition: var(--bar-transition); ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'} opacity: 0.3; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } } @keyframes shimmer-move-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .charging-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to ${horizontal_layout ? 'right' : 'top'}, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%); z-index: 2; transform: ${horizontal_layout ? 'translateX(-100%)' : 'translateY(100%)'}; opacity: 0; pointer-events: none; }
                .cell-info-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: space-between; padding: 0 8px;' : ''} }
                ${!horizontal_layout ? `.cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; } .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }` : `.cell-name-wrap { position: relative; } .cell-val-wrap { position: relative; margin-right: 12px; }`}
                .cell-name-badge { background: rgba(0,0,0,0.6); color: white; padding: var(--name-pad); font-size: var(--name-fs); border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px); white-space: nowrap; }
                .cell-val-badge.cell-voltage { background: var(--badge-bg-color); color: #fff; padding: 4px 10px; font-size: 13px; border-radius: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); display: var(--val-display); white-space: nowrap; }
                .legend-col { display: flex; flex-direction: var(--legend-direction); justify-content: var(--legend-align); ${horizontal_layout ? 'width: 100%; height: 20px; border-top: var(--legend-border-top); padding-top: 2px;' : 'height: 100%; padding-right: 8px; margin-right: 4px; border-right: var(--legend-border); min-width: 40px;'} font-size: 11px; color: var(--secondary-text-color); text-align: right; font-weight: 500; }
                ha-icon { --mdc-icon-size: 20px; }
                @media (max-width: 480px) {
                    .header.card-header { grid-template-areas: "title stats" "none subinfo"; grid-template-rows: auto auto; }
                    .sub-info-row { justify-content: flex-end; margin-top: 4px; }
                }
            </style>
        `;
        let containerHtml = '';
        if (show_as_table) { containerHtml = `<div class="table-container">${cells.map((cell, index) => `<div class="table-item" id="table-item-${index}"><span class="table-name">${cell.name || (index+1)}</span><span class="table-val" id="table-val-${index}">-</span></div>`).join('')}</div>`; } 
        else if (!horizontal_layout) { containerHtml = `<div class="main-container cells-container">${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}</div>`; } 
        else { containerHtml = `<div class="main-container cells-container">${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}</div>`; }
        const html = `<ha-card><div class="header card-header"><div class="title">${title}</div><div class="sub-info-row" id="sub-info-container"></div><div class="stats" id="stats-container"></div></div>${containerHtml}</ha-card>`;
        this.shadowRoot.innerHTML = style + html;
        this._setupTooltips();
    }
    _renderCellHtml(cell, index) { return `<div class="cell-wrapper cell-item" id="cell-wrap-${index}"><div class="custom-tooltip" id="tooltip-${index}">-</div><div class="cell-track-bg"></div><div class="cell-bar" id="bar-${index}" style="height: 0%; width: 0%;"><div class="charging-overlay"></div></div><div class="cell-info-layer">${this._config.horizontal_layout ? `<div class="cell-name-wrap"><span class="cell-name-badge">${cell.name}</span></div><div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div>` : `<div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div><div class="cell-name-wrap"><span class="cell-name-badge">${cell.name}</span></div>`}</div></div>`; }
    _setupTooltips() { const wrappers = this.shadowRoot.querySelectorAll('.cell-wrapper'); wrappers.forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); wrappers.forEach(w => { if(w !== el) w.classList.remove('show-tooltip'); }); el.classList.toggle('show-tooltip'); }); }); document.addEventListener('click', () => { wrappers.forEach(w => w.classList.remove('show-tooltip')); }); }

    _updateStandardValues() {
        const { cells = [], watt_entity, soc_entity, cell_diff_sensor, temp_entity, total_voltage_entity, total_current_entity, show_values_on_top, show_min_max, min_voltage, max_voltage, horizontal_layout, show_voltage_diff, show_average, hide_bars, show_as_table } = this._config;
        
        const rowClass = show_values_on_top ? 'stat-value-row vertical-layout' : 'stat-value-row';

        const wattVal = this._parseNumber(watt_entity);
        const isCharging = (this._config.enable_animations !== false) && (wattVal !== null && wattVal > 0);
        const isDischarging = (this._config.enable_animations !== false) && (wattVal !== null && wattVal < 0);
        
        let minV = 999, maxV = -999, minIdx = -1, maxIdx = -1, cellValues = [];
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
                    const valNum = parseFloat(temp);
                    const valFormatted = isNaN(valNum) ? '0.00' : valNum.toFixed(2);
                    const tColor = (valNum < 12) ? '#42a5f5' : ((valNum > 28) ? '#ef5350' : 'var(--secondary-text-color)');
                    el.style.color = tColor;
                    const content = `<ha-icon icon="mdi:thermometer" style="${tColor ? 'color:'+tColor : ''}"></ha-icon><span>${valFormatted}°C</span>`;
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
             const range = max_voltage - min_voltage; const step = range / 7;
             for (let i = 0; i <= 7; i++) mapPoints.push(min_voltage + (step * i));
        }
        const segmentSize = 100 / 7;

        cells.forEach((cell, index) => {
            const bar = this.shadowRoot.getElementById(`bar-${index}`);
            const valLabel = this.shadowRoot.getElementById(`val-${index}`);
            const wrapper = this.shadowRoot.getElementById(`cell-wrap-${index}`);
            const tooltip = this.shadowRoot.getElementById(`tooltip-${index}`);
            
            if (bar && valLabel && wrapper) {
                const displayValNum = cellValues[index] || 0;
                const displayVal = displayValNum > 0 ? `${displayValNum.toFixed(3)} V` : '-';
                
                wrapper.classList.remove('min-cell', 'max-cell');
                if (show_min_max && displayValNum > 0) {
                    if (index === minIdx) wrapper.classList.add('min-cell');
                    if (index === maxIdx) wrapper.classList.add('max-cell');
                }
                
                let pct = 0;
                if (displayValNum > 0) {
                    if (displayValNum <= mapPoints[0]) pct = 0; else if (displayValNum >= mapPoints[7]) pct = 100;
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
                if (horizontal_layout) { bar.style.width = `${pct}%`; bar.style.height = '100%'; } else { bar.style.height = `${pct}%`; bar.style.width = '100%'; }
                bar.style.color = color; 
                if (isCharging) { bar.classList.add('is-charging'); bar.classList.remove('is-discharging'); }
                else if (isDischarging) { bar.classList.remove('is-charging'); bar.classList.add('is-discharging'); }
                else { bar.classList.remove('is-charging'); bar.classList.remove('is-discharging'); }
                if (valLabel.innerText !== displayVal) valLabel.innerText = displayVal;

                // --- FIX START: TOOLTIP TEXT AKTUALISIEREN ---
                if (tooltip) tooltip.innerText = displayVal;
            }
        });
    }

    // DETAILED VIEW (Dashboard)
    // =========================================================================
    _renderDetailedView() {
        const { cells = [], show_cell_list, show_charts, show_standard_in_detail, card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table } = this._config;
        const colors = this._getColors();
        
        // --- LOGIK FÜR STANDARD ANSICHT KOPIEREN (falls aktiviert) ---
        let standardCss = '';
        let standardHtml = '';
        
        if (show_standard_in_detail) {
             const cellCount = cells.length;
             let valDisplay = show_values ? 'inline-block' : 'none';
             let nameFontSize = '10px'; let namePadding = '2px 6px'; let borderWidth = thicker_borders ? '2px' : '1px';
             if (cellCount > 10) { valDisplay = 'none'; nameFontSize = '9px'; namePadding = '1px 3px'; }

             const isStandard = (Math.abs(min_voltage - 2.60) < 0.01 && Math.abs(max_voltage - 3.65) < 0.01);
             let mapPoints = isStandard ? [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65] : [];
             if (!isStandard) {
                 const range = max_voltage - min_voltage; const step = range / 7;
                 for (let i = 0; i <= 7; i++) mapPoints.push(Math.round((min_voltage + (step * i)) * 1000) / 1000);
             }
             let scaleLabels = horizontal_layout ? [...mapPoints].map(v=>v.toFixed(2)+'V') : [...mapPoints].reverse().map(v=>v.toFixed(2)+'V');
             let trackGradient = horizontal_layout ? `linear-gradient(to right, #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)` : `linear-gradient(to top, #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)`;
             
             // --- MARGIN-TOP 0px + FIXED HEIGHT ---
             standardCss = `
                .standard-view-wrapper {
                    display: block; margin-top: 0px; 
                    --cell-gap: ${cell_gap}px; --badge-bg-color: rgba(0, 0, 0, 0.5); --val-display: ${valDisplay}; --name-fs: ${nameFontSize}; --name-pad: ${namePadding}; --bar-border-width: ${borderWidth}; --main-display: ${show_as_table || hide_bars ? 'none' : 'flex'}; --main-direction: ${horizontal_layout ? 'column' : 'row'}; --bar-transition: ${horizontal_layout ? 'width' : 'height'} 0.4s ease-out; --legend-direction: ${horizontal_layout ? 'row' : 'column'}; --legend-align: ${horizontal_layout ? 'space-between' : 'space-between'}; --legend-border: ${horizontal_layout ? 'none' : '1px solid rgba(255,255,255,0.1)'}; --legend-border-top: ${horizontal_layout ? '1px solid rgba(255,255,255,0.1)' : 'none'};
                    height: ${(hide_bars || horizontal_layout || show_as_table) ? 'auto' : '260px'};
                    position: relative;
                }
                /* Hier Kopie des CSS der Standard View */
                .main-container.cells-container { flex: 1; display: var(--main-display); flex-direction: var(--main-direction); gap: var(--cell-gap); align-items: ${horizontal_layout ? 'stretch' : 'flex-end'}; position: relative; overflow: hidden; height: 100%; }
                ${horizontal_layout ? '.main-container.cells-container { overflow-y: auto !important; }' : ''}
                .table-container { display: ${show_as_table ? 'grid' : 'none'}; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px; width: 100%; overflow-y: auto; }
                .table-item { background: rgba(255,255,255,0.05); border-radius: 6px; padding: 6px 4px; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px solid transparent; transition: all 0.2s; }
                .table-item.min-cell { border-color: #2196f3; background: rgba(33, 150, 243, 0.15); }
                .table-item.max-cell { border-color: #f44336; background: rgba(244, 67, 54, 0.15); }
                .table-name { font-size: 0.75rem; opacity: 0.7; margin-bottom: 2px; } .table-val { font-size: 0.95rem; font-weight: bold; }
                .cell-wrapper.cell-item { flex: 1; ${horizontal_layout ? 'height: 50px; min-height: 50px;' : 'height: 100%;'} width: 100%; position: relative; border-radius: 6px; overflow: visible; background: rgba(0,0,0,0.2); cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: flex-start;' : ''} }
                .cell-wrapper.cell-item.min-cell { box-shadow: 0 0 8px rgba(33, 150, 243, 0.6) inset; border: 1px solid rgba(33, 150, 243, 0.5); }
                .cell-wrapper.cell-item.max-cell { box-shadow: 0 0 8px rgba(244, 67, 54, 0.6) inset; border: 1px solid rgba(244, 67, 54, 0.5); }
                .custom-tooltip { position: absolute; top: 20%; left: 50%; transform: translateX(-50%); background: rgba(30, 30, 30, 0.95); color: white; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; pointer-events: none; opacity: 0; transition: opacity 0.2s ease-in-out; z-index: 20; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 4px 8px rgba(0,0,0,0.5); }
                .cell-wrapper:hover .custom-tooltip, .cell-wrapper.show-tooltip .custom-tooltip { opacity: 1; }
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${trackGradient}; opacity: 0.25; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar { position: absolute; ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'} background: currentColor; ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255,255,255,0.6);' : 'border-top: var(--bar-border-width) solid rgba(255,255,255,0.6);'} z-index: 1; transition: var(--bar-transition); ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'} opacity: 0.3; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } } @keyframes shimmer-move-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .charging-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to ${horizontal_layout ? 'right' : 'top'}, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%); z-index: 2; transform: ${horizontal_layout ? 'translateX(-100%)' : 'translateY(100%)'}; opacity: 0; pointer-events: none; }
                .cell-info-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: space-between; padding: 0 8px;' : ''} }
                ${!horizontal_layout ? `.cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; } .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }` : `.cell-name-wrap { position: relative; } .cell-val-wrap { position: relative; margin-right: 12px; }`}
                .cell-name-badge { background: rgba(0,0,0,0.6); color: white; padding: var(--name-pad); font-size: var(--name-fs); border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px); white-space: nowrap; }
                .cell-val-badge.cell-voltage { background: var(--badge-bg-color); color: #fff; padding: 4px 10px; font-size: 13px; border-radius: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); display: var(--val-display); white-space: nowrap; }
                .legend-col { display: flex; flex-direction: var(--legend-direction); justify-content: var(--legend-align); ${horizontal_layout ? 'width: 100%; height: 20px; border-top: var(--legend-border-top); padding-top: 2px;' : 'height: 100%; padding-right: 8px; margin-right: 4px; border-right: var(--legend-border); min-width: 40px;'} font-size: 11px; color: var(--secondary-text-color); text-align: right; font-weight: 500; }
             `;
             
             if (show_as_table) { standardHtml = `<div class="standard-view-wrapper"><div class="table-container">${cells.map((cell, index) => `<div class="table-item" id="table-item-${index}"><span class="table-name">${cell.name || (index+1)}</span><span class="table-val" id="table-val-${index}">-</span></div>`).join('')}</div></div>`; } 
             else if (!horizontal_layout) { standardHtml = `<div class="standard-view-wrapper"><div class="main-container cells-container">${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}</div></div>`; } 
             else { standardHtml = `<div class="standard-view-wrapper"><div class="main-container cells-container">${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}</div></div>`; }
        }

        const style = `
            <style>
                :host { display: block; --card-padding: 12px; }
                ha-card {
                    padding: var(--card-padding); box-sizing: border-box; 
                    color: ${colors.text}; font-family: var(--paper-font-body1_-_font-family);
                    display: grid; gap: 12px;
                }
                .row { display: grid; gap: 12px; }
                .col-2 { grid-template-columns: 1fr 1fr; }
                .col-3 { grid-template-columns: 1fr 1fr 1fr; }
                
                .box { background: rgba(var(--rgb-primary-text-color), 0.04); border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; position: relative; overflow: hidden; }
                .clickable { cursor: pointer; transition: background 0.2s; }
                .clickable:active { background: rgba(var(--rgb-primary-text-color), 0.08); }
                
                .box-title { font-size: 0.85rem; color: var(--secondary-text-color); font-weight: 500; display: flex; justify-content: space-between; margin-bottom: 2px; pointer-events: none; }
                .box-val-row { font-size: 1.8rem; font-weight: 400; line-height: 1; display: flex; align-items: baseline; gap: 4px; pointer-events: none; margin-bottom: 4px; }
                .unit { font-size: 1rem; color: var(--secondary-text-color); font-weight: 400; }
                
                .chart-box { height: 110px; justify-content: space-between; }
                .chart-meta { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; font-size: 0.8rem; color: var(--secondary-text-color); margin-top: auto; }
                .max-val-red { color: #e53935; font-weight: bold; }
                .min-val-blue { color: #1e88e5; font-weight: bold; }
                
                .chart-container-full {
                    flex: 1; 
                    position: relative; 
                    width: calc(100% + 28px); /* 100% + 2*padding(14px) */
                    margin-left: -14px; 
                    margin-right: -14px;
                    overflow: hidden;
                }
                
                .status-row { display: flex; gap: 12px; width: 100%; }
                .status-pill { flex: 1; background: rgba(var(--rgb-primary-text-color), 0.04); border-radius: 8px; padding: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.9rem; font-weight: 500; user-select: none; transition: background 0.2s; }
                .status-pill.interactive { cursor: pointer; }
                .status-pill.interactive:active { background: rgba(var(--rgb-primary-text-color), 0.1); }
                .status-val { font-weight: 700; }
                .status-on { color: #43a047; }
                .status-off { color: #1e88e5; }
                
                .big-stat { align-items: center; justify-content: center; padding: 16px 8px; }
                .big-stat .box-val { font-size: 1.4rem; font-weight: 700; }
                .val-green { color: #43a047; }
                .val-blue { color: #03a9f4; }
                
                .soc-box { align-items: center; justify-content: center; padding: 14px; }
                .soc-title { font-size: 1rem; font-weight: 700; margin-right: 8px; }
                .box-val-soc { font-size: 1.4rem; font-weight: 400; }
                
                .detail-list { font-size: 0.85rem; display: flex; flex-direction: column; gap: 0; color: var(--primary-text-color); }
                .detail-item { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .detail-item:last-child { border-bottom: none; }
                .detail-label { color: var(--secondary-text-color); }
                .detail-val-txt { font-weight: 500; color: #4caf50; }
                .detail-val-txt.temp { color: #42a5f5; }
                
                .cell-list-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 8px; }
                .cell-list-col { display: flex; flex-direction: column; gap: 0; }
                .cell-text-row { display: flex; justify-content: space-between; font-size: 0.85rem; padding: 5px 6px; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .cell-text-row:last-child { border-bottom: none; }
                .cell-num { color: var(--secondary-text-color); margin-right: 6px; width: 24px; }
                .cell-v { font-weight: bold; font-family: monospace; }
                .cell-bal { color: var(--secondary-text-color); font-size: 0.75rem; margin-left: 4px; }
                
                @media (max-width: 500px) { .col-3 { grid-template-columns: 1fr; } .cell-list-grid { grid-template-columns: 1fr; } }
                
                ${standardCss}
            </style>
        `;

        const html = `
            <ha-card>
                ${show_charts !== false ? `
                <div class="row col-2">
                    <div class="box chart-box clickable" data-entity="${this._config.total_voltage_entity}" id="chart-voltage">
                        <div class="box-title">
                            <span>${this._localize('card.batt_voltage')}</span>
                            <span style="color:#039be5">V</span>
                        </div>
                        <div class="box-val-row"><span id="d-total-volt">--</span> <span class="unit">V</span></div>
                        <div class="chart-container-full"><canvas id="canvas-voltage"></canvas></div>
                        <div class="chart-meta">
                            <span>${this._localize('card.max_cell')} : <span id="d-max-cell-val" class="max-val-red clickable">--</span></span>
                            <span>${this._localize('card.min_cell')} : <span id="d-min-cell-val" class="min-val-blue clickable">--</span></span>
                        </div>
                    </div>
                    
                    <div class="box chart-box clickable" data-entity="${this._config.cell_diff_sensor}" id="chart-drift">
                        <div class="box-title">
                            <span>${this._localize('card.delta_cell_vol')}</span>
                            <ha-icon icon="mdi:delta" style="width:16px; height:16px; color:#1e88e5"></ha-icon>
                        </div>
                        <div class="box-val-row"><span id="d-drift-val">--</span> <span class="unit">mV</span></div>
                        <div class="chart-container-full"><canvas id="canvas-drift"></canvas></div>
                        <div class="chart-meta">
                            <span>${this._localize('card.max_cell')} : <span id="d-max-cell-idx" class="max-val-red">--</span></span>
                            <span>${this._localize('card.min_cell')} : <span id="d-min-cell-idx" class="min-val-blue">--</span></span>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="status-row">
                    <div class="status-pill interactive" id="btn-charge">
                        <span>${this._localize('card.charge')} :</span> <span class="status-val" id="d-stat-charge">--</span>
                    </div>
                    <div class="status-pill interactive" id="btn-discharge">
                        <span>${this._localize('card.discharge')} :</span> <span class="status-val" id="d-stat-discharge">--</span>
                    </div>
                    <div class="status-pill" id="btn-balance">
                        <span>${this._localize('card.balance')} :</span> <span class="status-val" id="d-stat-balance">--</span>
                    </div>
                </div>

                <div class="row col-3">
                    <div class="box big-stat clickable" data-entity="${this._config.total_voltage_entity}">
                        <span id="d-big-volt" class="box-val val-green">-- V</span>
                    </div>
                    <div class="box big-stat clickable" data-entity="${this._config.total_current_entity}">
                        <span id="d-big-curr" class="box-val val-green">-- A</span>
                    </div>
                    <div class="box big-stat clickable" data-entity="${this._config.watt_entity}">
                        <span id="d-big-watt" class="box-val val-green">-- W</span>
                    </div>
                </div>

                <div class="row col-2">
                     <div class="box soc-box clickable" data-entity="${this._config.soc_entity}" style="flex-direction:row;">
                        <span class="soc-title">${this._localize('card.soc')} :</span> <span id="d-soc" class="box-val-soc" style="color:#4caf50;">-- %</span>
                     </div>
                     <div class="box soc-box clickable" data-entity="${this._config.soh_entity}" style="flex-direction:row;">
                        <span class="soc-title">${this._localize('card.soh')} :</span> <span id="d-soh" class="box-val-soc" style="color:#4caf50;">-- %</span>
                     </div>
                </div>

                <div class="row col-2">
                    <div class="box detail-list" id="d-list-left"></div>
                    <div class="box detail-list" id="d-list-right"></div>
                </div>
                ${show_cell_list !== false ? `<div class="box" style="padding: 10px;"><div class="cell-list-grid" id="d-cell-list"></div></div>` : ''}
                
                ${standardHtml}
            </ha-card>
        `;

        this.shadowRoot.innerHTML = style + html;

        this.shadowRoot.querySelector('ha-card').addEventListener('click', (e) => {
            const target = e.target.closest('.clickable');
            if (target && target.dataset.entity && target.dataset.entity !== 'undefined') {
                e.stopPropagation();
                this._fireMoreInfo(target.dataset.entity);
            }
        });
        
        if (show_standard_in_detail) {
            this._setupTooltips();
        }

        this.shadowRoot.getElementById('btn-charge')?.addEventListener('click', (e) => {
            e.stopPropagation(); this._handleSwitchAction(this._config.stat_charge_entity, this._config.stat_charge_on, this._config.stat_charge_off);
        });
        this.shadowRoot.getElementById('btn-discharge')?.addEventListener('click', (e) => {
             e.stopPropagation(); this._handleSwitchAction(this._config.stat_discharge_entity, this._config.stat_discharge_on, this._config.stat_discharge_off);
        });
        this.shadowRoot.getElementById('btn-balance')?.addEventListener('click', (e) => {
             e.stopPropagation(); 
             if(this._config.stat_balance_entity) {
                this._handleSwitchAction(this._config.stat_balance_entity, this._config.stat_balance_on, this._config.stat_balance_off);
             }
        });
        
        this._initCharts();
    }

    _updateColors() { return { bg: 'var(--card-background-color, #1c1c1e)', text: 'var(--primary-text-color, #ffffff)', textSecondary: 'var(--secondary-text-color, #9e9e9e)' }; }
    _getColors() { return this._updateColors(); }

    _updateValues() {
        if (!this._initialized || !this._hass) return;
        if (this._config.show_detailed_view) {
            this._updateDetailedValues();
            return;
        }
        // this._renderStandardView();  <- Diese Zeile verursachte das Flackern!
        this._updateStandardValues();
    }

    _updateDetailedValues() {
        const c = this._config;
        const setTxt = (id, val) => { const el = this.shadowRoot.getElementById(id); if(el) el.innerHTML = (val !== null && val !== undefined) ? val : '--'; };
        const setStyle = (id, prop, val) => { const el = this.shadowRoot.getElementById(id); if(el) el.style[prop] = val; };

        // --- HELPER FUNCTION DEFINE FIRST ---
        const isStateOn = (current, customOn) => {
            if (!current) return false;
            if (customOn && customOn.trim() !== '') { return current === customOn; }
            return (current === 'on' || current === 'true' || current === true || current === 'balancing');
        };

        const vTotal = this._parseNumber(c.total_voltage_entity);
        const iTotal = this._parseNumber(c.total_current_entity);
        const pTotal = this._parseNumber(c.watt_entity);
        const drift  = this._parseNumber(c.cell_diff_sensor);
        const soc    = this._parseNumber(c.soc_entity);
        const soh    = this._parseNumber(c.soh_entity);
        
        const leftList = []; const rightList = [];
        
        const addIfConf = (list, confKey, labelKey, unit, isTemp=false, fixed=null) => {
            if (!c[confKey]) return; 
            let val = this._parseNumber(c[confKey]);
            
            // --- FIX: Runden, wenn fixed definiert ist ---
            if (val !== null && fixed !== null) {
                val = val.toFixed(fixed);
            }

            const valStr = val !== null ? val + (unit ? ' ' + unit : '') : '--';
            const cls = isTemp ? 'detail-val-txt temp' : 'detail-val-txt';
            list.push(`<div class="detail-item clickable" data-entity="${c[confKey]}"><span class="detail-label">${this._localize(labelKey)} :</span><span class="${cls}">${valStr}</span></div>`);
        };
		
        addIfConf(leftList, 'capacity_entity', 'card.batt_capacity', 'Ah', false, 0);
        addIfConf(leftList, 'cycle_capacity_entity', 'card.cycle_capacity', 'Ah', false, 0);
        
        // --- Calculate Min/Max and Sum ---
        let cellSum = 0; let cellCnt = 0; let minV = 999; let maxV = -999; let minIdx = -1; let maxIdx = -1; 
        c.cells.forEach((cell, i) => {
            const v = this._parseNumber(cell.entity);
            if (v !== null) {
                const val = (v > 10) ? v / 1000 : v;
                if (val < minV) { minV = val; minIdx = i; }
                if (val > maxV) { maxV = val; maxIdx = i; }
                cellSum += val; cellCnt++;
            }
        });
        const avgVal = cellCnt > 0 ? (cellSum / cellCnt).toFixed(3) + ' V' : '--';
        leftList.push(`<div class="detail-item"><span class="detail-label">${this._localize('card.avg_cell')} :</span><span class="detail-val-txt">${avgVal}</span></div>`);
        
        // --- Nachkommastelle bei Temperatur hinzugefügt ---
        addIfConf(leftList, 'temp_entity', 'editor.temp', '°C', true, 1);
        
        if (c.capacity_entity && c.soc_entity) {
            const cap = this._parseNumber(c.capacity_entity);
            if(cap && soc !== null) {
                const rem = Math.round(cap * (soc/100)) + ' Ah';
                rightList.push(`<div class="detail-item"><span class="detail-label">${this._localize('card.remain_capacity')} :</span><span class="detail-val-txt">${rem}</span></div>`);
            }
        }
        addIfConf(rightList, 'cycle_count_entity', 'card.cycle_count', '');
        
        let driftDisplay = drift;
        if (drift === null && maxV > 0 && minV < 999) driftDisplay = (maxV - minV) * 1000;
        else if (drift !== null && drift < 1) driftDisplay = drift * 1000;
        const driftStr = driftDisplay !== null ? (driftDisplay/1000).toFixed(3) + ' V' : '--';
        const driftEnt = c.cell_diff_sensor || '';
        const driftClass = driftEnt ? 'detail-item clickable' : 'detail-item';
        rightList.push(`<div class="${driftClass}" data-entity="${driftEnt}"><span class="detail-label">${this._localize('card.delta_cell_vol')} :</span><span class="detail-val-txt">${driftStr}</span></div>`);
        
        addIfConf(rightList, 'temp_mos_entity', 'card.mos_temp', '°C', true);

        const leftEl = this.shadowRoot.getElementById('d-list-left');
        const rightEl = this.shadowRoot.getElementById('d-list-right');
        if(leftEl) leftEl.innerHTML = leftList.join('');
        if(rightEl) rightEl.innerHTML = rightList.join('');

        setTxt('d-total-volt', vTotal?.toFixed(2));
        setTxt('d-max-cell-val', maxV > 0 ? maxV.toFixed(3) : '--');
        const maxCellEl = this.shadowRoot.getElementById('d-max-cell-val');
        if (maxCellEl && maxIdx !== -1) { maxCellEl.dataset.entity = c.cells[maxIdx].entity; }

        setTxt('d-min-cell-val', minV < 999 ? minV.toFixed(3) : '--');
        const minCellEl = this.shadowRoot.getElementById('d-min-cell-val');
        if (minCellEl && minIdx !== -1) { minCellEl.dataset.entity = c.cells[minIdx].entity; }

        setTxt('d-drift-val', driftDisplay !== null ? Math.round(driftDisplay) : '--');
        setTxt('d-max-cell-idx', maxIdx !== -1 ? (c.cells[maxIdx].name || (maxIdx+1)) : '--');
        setTxt('d-min-cell-idx', minIdx !== -1 ? (c.cells[minIdx].name || (minIdx+1)) : '--');
        
        const stChg  = this._getState(c.stat_charge_entity);
        const stDsg  = this._getState(c.stat_discharge_entity);
        const stBal  = this._getState(c.stat_balance_entity);
        
        // --- CHECK GLOBAL BALANCE STATE ---
        const isBalGlobal = isStateOn(stBal, c.stat_balance_on);

        const setStatus = (id, state, customOn) => {
            const el = this.shadowRoot.getElementById(id);
            if (!el) return;
            const isOn = isStateOn(state, customOn);
            el.innerText = isOn ? this._localize('card.on') : this._localize('card.off');
            el.className = `status-val ${isOn ? 'status-on' : 'status-off'}`;
            if(el.parentElement) {
                // Wenn es Balance ist, checken ob Config da ist, sonst normal interactive
                if(id === 'd-stat-balance') {
                     if(c.stat_balance_entity) {
                         el.parentElement.classList.add('interactive');
                         el.parentElement.style.opacity = '1';
                     } else {
                         el.parentElement.classList.remove('interactive');
                     }
                } else {
                    el.parentElement.className = `status-pill interactive`;
                }
            }
        };

        setStatus('d-stat-charge', stChg, c.stat_charge_on);
        setStatus('d-stat-discharge', stDsg, c.stat_discharge_on);
        setStatus('d-stat-balance', stBal, c.stat_balance_on);

        setTxt('d-big-volt', (vTotal !== null ? vTotal.toFixed(2) : '--') + ' <span style="font-size:0.7em">V</span>');
        setTxt('d-big-curr', (iTotal !== null ? iTotal.toFixed(2) : '--') + ' <span style="font-size:0.7em">A</span>');
        setTxt('d-big-watt', (pTotal !== null ? pTotal.toFixed(2) : '--') + ' <span style="font-size:0.7em">W</span>');
        
        const wColor = (pTotal > 0) ? '#43a047' : ((pTotal < 0) ? '#03a9f4' : 'var(--secondary-text-color)');
        setStyle('d-big-watt', 'color', wColor);
        setStyle('d-big-curr', 'color', wColor);

        setTxt('d-soc', (soc !== null ? Math.round(soc) : '--') + ' %');
        setTxt('d-soh', (soh !== null ? Math.round(soh) : '--') + ' %');

        const listContainer = this.shadowRoot.getElementById('d-cell-list');
        if (listContainer) {
            let cellListHtml = [[], []];
            
            // --- Generate HTML List (with knowing Min/Max/Global Bal) ---
            c.cells.forEach((cell, i) => {
                const v = this._parseNumber(cell.entity);
                if (v !== null) {
                    const val = (v > 10) ? v / 1000 : v;
                    const colIdx = i < Math.ceil(c.cells.length/2) ? 0 : 1;
                    
                    // --- LOGIC: If Balancing ON AND (IsMax OR IsMin) -> Show Green 'bal. on' ---
                    let balText = 'bal. off';
                    let balStyle = ''; // default color from CSS
                    
                    if (isBalGlobal && (i === maxIdx || i === minIdx)) {
                        balText = 'bal. on';
                        balStyle = 'color: #4caf50; font-weight: bold;'; // Green
                    }
                    
                    cellListHtml[colIdx].push(`<div class="cell-text-row clickable" data-entity="${cell.entity}"><span><span class="cell-num">${String(i+1).padStart(2,'0')}.</span><span class="cell-v">${val.toFixed(3)} V</span></span><span class="cell-bal" style="${balStyle}">${balText}</span></div>`);
                }
            });
            listContainer.innerHTML = `<div class="cell-list-col">${cellListHtml[0].join('')}</div><div class="cell-list-col">${cellListHtml[1].join('')}</div>`;
        }
        
        if (this.chartVoltage && vTotal !== null) { this._updateChartData(this.chartVoltage, Date.now(), vTotal); }
        if (this.chartDrift && driftDisplay !== null) { this._updateChartData(this.chartDrift, Date.now(), driftDisplay); }
        
        // --- UPDATE STANDARD VIEW IN DETAILED VIEW ---
        if (c.show_standard_in_detail) {
            this._updateStandardValues();
        }
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