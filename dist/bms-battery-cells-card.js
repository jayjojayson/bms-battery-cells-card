import "./bms-battery-cells-card-editor.js";

class BmsBatteryCellsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
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
            enable_animations: true,
            ...config
        };
        this._initialized = false;
        if (this._hass) this._initRender();
    }

    _getColors() {
        return {
            bg: 'var(--card-background-color, #1c1c1e)',
            text: 'var(--primary-text-color, #ffffff)',
            textSecondary: 'var(--secondary-text-color, #9e9e9e)'
        };
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

    _initRender() {
        if (!this._config || !this._hass) return;

        const { title, cells = [], card_height, cell_gap } = this._config;
        const colors = this._getColors();
        const cellCount = cells.length;

        // --- DARSTELLUNGS-LOGIK ---
        // Viele Zellen (>10) -> Badge im Balken AUS
        let valDisplay = 'inline-block'; 
        let nameFontSize = '10px';
        let namePadding = '2px 6px';

        if (cellCount > 10) { 
            valDisplay = 'none'; // Badge ist weg!
            nameFontSize = '9px';
            namePadding = '1px 3px';
        }

        const trackGradient = `linear-gradient(to top, 
            #d32f2f 0%,      /* 2.60V - Rot */
            #ef5350 7%,      
            #ffa726 14.28%,  /* 2.80V - Orange */
            #ffd600 28.57%,  /* 3.00V - Gelb */
            #43a047 42.85%,  /* 3.20V - Grün */
            #42a5f5 57.14%,  /* 3.40V - Hellblau */
            #1565c0 71.42%,  /* 3.45V - Dunkelblau */
            #ff7043 85.71%,  /* 3.55V - Orange High */
            #ff5722 100%     /* 3.65V - Orange Ende */
        )`;

        const style = `
            <style>
                :host { 
                    display: block; 
                    --cell-gap: ${cell_gap}px; 
                    --badge-bg-color: rgba(0, 0, 0, 0.5);
                    --val-display: ${valDisplay};
                    --name-fs: ${nameFontSize};
                    --name-pad: ${namePadding};
                }
                
                ha-card {
                    display: flex;
                    flex-direction: column;
                    height: ${card_height}px;
                    padding: 16px;
                    box-sizing: border-box;
                    position: relative;
                    color: ${colors.text};
                    font-family: var(--paper-font-body1_-_font-family);
                }

                .header {
                    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
                    flex-shrink: 0; min-height: 40px;
                    border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;
                }
                .title { font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; color: ${colors.text}; }
                .stats { display: flex; gap: 16px; align-items: center; justify-content: flex-end; }
                .stat-item { display: flex; flex-direction: column; align-items: flex-end; justify-content: center; }
                .stat-value-row { display: flex; align-items: center; gap: 6px; font-size: 1.1rem; font-weight: 600; line-height: 1.2; }
                .stat-value-row.vertical-layout { flex-direction: column-reverse; gap: 2px; align-items: center; }
                .stat-label { font-size: 0.75rem; color: ${colors.textSecondary}; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
                
                .main-container {
                    flex: 1; display: flex; gap: var(--cell-gap); align-items: flex-end; position: relative;
                    overflow: hidden;
                }
                .cell-wrapper {
                    flex: 1; height: 100%; position: relative;
                    border-radius: 6px; overflow: visible; /* Wichtig für Tooltip Überlauf */
                    background: rgba(0,0,0,0.2); 
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                
                /* --- CUSTOM TOOLTIP --- */
                .custom-tooltip {
                    position: absolute;
                    top: 20%; /* Positionierung im oberen Drittel */
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(30, 30, 30, 0.95);
                    color: white;
                    padding: 6px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: bold;
                    pointer-events: none; /* Klicks gehen durch */
                    opacity: 0;
                    transition: opacity 0.2s ease-in-out;
                    z-index: 20;
                    white-space: nowrap;
                    border: 1px solid rgba(255,255,255,0.2);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
                }

                /* Anzeigen bei Hover (Desktop) ODER Klasse (Touch) */
                .cell-wrapper:hover .custom-tooltip,
                .cell-wrapper.show-tooltip .custom-tooltip {
                    opacity: 1;
                }

                .cell-track-bg {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: ${trackGradient}; opacity: 0.25; z-index: 0;
                    border-radius: 6px; /* Radius hierhin verschoben wegen overflow:visible */
                    overflow: hidden;
                }
                .cell-bar {
                    position: absolute; bottom: 0; left: 0; right: 0;
                    background: currentColor; border-top: 1px solid rgba(255,255,255,0.6);
                    z-index: 1; transition: height 0.4s ease-out;
                    border-radius: 2px 2px 6px 6px; 
                    opacity: 0.3; 
                    box-shadow: 0 -2px 8px rgba(0,0,0,0.3);
                    overflow: hidden;
                    will-change: transform;
                }

                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } }
                @keyframes shimmer-move-down { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }

                .charging-overlay {
                    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%);
                    z-index: 2; transform: translateY(100%); opacity: 0; pointer-events: none; will-change: transform;
                }

                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: shimmer-move-up 2s infinite linear; }
                .cell-bar.is-discharging .charging-overlay { opacity: 1; animation: shimmer-move-down 2s infinite linear; }

                .cell-info-layer {
                    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                    pointer-events: none; z-index: 5;
                }
                .cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; }
                .cell-name-badge {
                    background: rgba(0,0,0,0.6); color: white;
                    padding: var(--name-pad); font-size: var(--name-fs);
                    border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px);
                    white-space: nowrap; 
                }
                .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }
                .cell-val-badge { 
                    background: var(--badge-bg-color); color: #fff;
                    padding: 4px 10px; font-size: 13px;
                    border-radius: 12px; font-weight: 700; letter-spacing: 0.5px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1); 
                    display: var(--val-display); /* Steuert Sichtbarkeit */
                    white-space: nowrap; 
                }
                .legend-col {
                    display: flex; flex-direction: column; justify-content: space-between;
                    height: 100%; padding-right: 8px; margin-right: 4px;
                    font-size: 11px; color: ${colors.textSecondary}; text-align: right;
                    border-right: 1px solid rgba(255,255,255,0.1); min-width: 40px; font-weight: 500;
                }
                ha-icon { --mdc-icon-size: 20px; }
            </style>
        `;

        const html = `
            <ha-card>
                <div class="header">
                    <div class="title">${title}</div>
                    <div class="stats" id="stats-container"></div>
                </div>
                <div class="main-container">
                    ${this._config.show_legend ? `
                        <div class="legend-col">
                            <span>3.65V</span><span>3.55V</span><span>3.45V</span><span>3.40V</span><span>3.20V</span><span>3.00V</span><span>2.80V</span><span>2.60V</span>
                        </div>` : ''
                    }
                    ${cells.map((cell, index) => `
                        <div class="cell-wrapper" id="cell-wrap-${index}">
                            <div class="custom-tooltip" id="tooltip-${index}">-</div>
                            <div class="cell-track-bg"></div>
                            <div class="cell-bar" id="bar-${index}" style="height: 0%;">
                                <div class="charging-overlay"></div>
                            </div>
                            <div class="cell-info-layer">
                                <div class="cell-val-wrap"><span class="cell-val-badge" id="val-${index}">-</span></div>
                                <div class="cell-name-wrap"><span class="cell-name-badge">${cell.name}</span></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </ha-card>
        `;

        this.shadowRoot.innerHTML = style + html;
        this._initialized = true;

        // --- KLICK LOGIK (Touch Support für Tooltip) ---
        const wrappers = this.shadowRoot.querySelectorAll('.cell-wrapper');
        wrappers.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation(); // Verhindert Bubbling
                // Alle anderen schließen (optional, wirkt sauberer)
                wrappers.forEach(w => { if(w !== el) w.classList.remove('show-tooltip'); });
                // Toggle aktuellen
                el.classList.toggle('show-tooltip');
            });
        });
        
        // Klick außerhalb schließt Tooltips
        document.addEventListener('click', () => {
             wrappers.forEach(w => w.classList.remove('show-tooltip'));
        });
    }

    _updateValues() {
        if (!this._initialized || !this._hass) return;

        const { cells = [], soc_entity, watt_entity, cell_diff_sensor, show_values_on_top, enable_animations } = this._config;
        const rowClass = show_values_on_top ? 'stat-value-row vertical-layout' : 'stat-value-row';

        const wattVal = this._parseNumber(watt_entity);
        const isCharging = (enable_animations !== false) && (wattVal !== null && wattVal > 0);
        const isDischarging = (enable_animations !== false) && (wattVal !== null && wattVal < 0);

        const statsContainer = this.shadowRoot.getElementById('stats-container');
        if (statsContainer) {
            const socValRaw = this._parseNumber(soc_entity);
            let diffVal = this._parseNumber(cell_diff_sensor);
            if (diffVal !== null && diffVal < 1) diffVal *= 1000;

            let statsHtml = '';

            // 1. POWER
            if (watt_entity && wattVal !== null && Math.abs(wattVal) > 0.1) {
                 const wColor = (wattVal > 0) ? '#00e676' : '#2979ff';
                 const icon = (wattVal > 0) ? 'mdi:battery-charging' : 'mdi:lightning-bolt';
                 statsHtml += `
                    <div class="stat-item">
                        <span class="stat-label">Power</span>
                        <div class="${rowClass}" style="color: ${wColor}">
                            <ha-icon icon="${icon}"></ha-icon>
                            <span>${wattVal} <span style="font-size:0.8em">W</span></span>
                        </div>
                    </div>`;
            }
            
            // 2. SOC
            if (soc_entity) {
                const valStr = socValRaw !== null ? `${Math.round(socValRaw)}%` : '--';
                const color = (socValRaw !== null && socValRaw < 20) ? '#ef5350' : ((socValRaw !== null && socValRaw < 50) ? '#ffa726' : '#66bb6a');
                const iconColor = socValRaw !== null ? color : '#9e9e9e'; 
                const icon = socValRaw !== null ? `mdi:battery-${Math.round(socValRaw) >= 95 ? '100' : Math.round(socValRaw/10)*10}` : 'mdi:battery-unknown';
                statsHtml += `
                    <div class="stat-item">
                        <span class="stat-label">SoC</span>
                        <div class="${rowClass}" style="color: ${iconColor}">
                            <ha-icon icon="${icon}"></ha-icon>
                            <span>${valStr}</span>
                        </div>
                    </div>`;
            }

            // 3. DRIFT
            if (cell_diff_sensor) {
                const valStr = diffVal !== null ? Math.round(diffVal) : '--';
                const dColor = (diffVal !== null && diffVal > 20) ? '#ef5350' : '#66bb6a';
                statsHtml += `
                    <div class="stat-item">
                        <span class="stat-label">Drift</span>
                        <div class="${rowClass}" style="color: ${dColor}">
                            <ha-icon icon="mdi:delta"></ha-icon>
                            <span>${valStr} <span style="font-size:0.8em">mV</span></span>
                        </div>
                    </div>`;
            }
            if (statsContainer.innerHTML !== statsHtml) statsContainer.innerHTML = statsHtml;
        }

        const mapPoints = [2.60, 2.80, 3.00, 3.20, 3.40, 3.45, 3.55, 3.65];
        const segmentSize = 100 / (mapPoints.length - 1); 

        cells.forEach((cell, index) => {
            const bar = this.shadowRoot.getElementById(`bar-${index}`);
            const valLabel = this.shadowRoot.getElementById(`val-${index}`);
            const tooltip = this.shadowRoot.getElementById(`tooltip-${index}`);
            
            if (bar && valLabel) {
                const val = this._parseNumber(cell.entity) || 0;
                const displayValNum = (val > 0 && val < 10) ? val : (val / 1000);
                const displayVal = val > 0 ? `${displayValNum.toFixed(3)} V` : '-';

                // TOOLTIP UPDATE
                if (tooltip) {
                    const name = cell.name || `Zelle ${index + 1}`;
                    tooltip.innerText = `${name}: ${displayVal}`;
                }

                let pct = 0;
                if (displayValNum > 0) {
                    if (displayValNum <= mapPoints[0]) { pct = 0; } 
                    else if (displayValNum >= mapPoints[mapPoints.length - 1]) { pct = 100; } 
                    else {
                        for (let i = 0; i < mapPoints.length - 1; i++) {
                            const p1 = mapPoints[i]; const p2 = mapPoints[i+1];
                            if (displayValNum >= p1 && displayValNum < p2) {
                                 const rel = (displayValNum - p1) / (p2 - p1);
                                 pct = (i * segmentSize) + (rel * segmentSize);
                                 break;
                            }
                        }
                    }
                }
                
                let color = '#d32f2f'; 
                if (displayValNum >= 2.80) color = '#ffa726'; 
                if (displayValNum >= 3.00) color = '#ffd600'; 
                if (displayValNum >= 3.20) color = '#43a047'; 
                if (displayValNum >= 3.40) color = '#42a5f5'; 
                if (displayValNum >= 3.45) color = '#1565c0'; 
                if (displayValNum >= 3.55) color = '#ff7043'; 

                bar.style.height = `${pct}%`;
                bar.style.color = color; 

                if (isCharging) {
                    bar.classList.add('is-charging'); bar.classList.remove('is-discharging');
                } else if (isDischarging) {
                    bar.classList.remove('is-charging'); bar.classList.add('is-discharging');
                } else {
                    bar.classList.remove('is-charging'); bar.classList.remove('is-discharging');
                }
                
                if (valLabel.innerText !== `${displayVal}`) valLabel.innerText = `${displayVal}`;
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
