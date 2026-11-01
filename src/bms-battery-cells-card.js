import de from './lang-de.js';
import en from './lang-en.js';
import fr from './lang-fr.js';
import gr from './lang-gr.js';
import './chart.umd.min.js';

// Helper um LitElement sicher zu laden
const LitElement = customElements.get("ha-lit-element") || Object.getPrototypeOf(customElements.get("home-assistant-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const ICON_CLOSE = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

// Selector Konfiguration
// Hinweis: Alle Eingabefelder laufen über <ha-selector>. <ha-textfield> / <mwc-button> sind im
// Karten-Editor nicht zuverlässig geladen und wurden dann unsichtbar (nur leerer Platz) dargestellt.
const sensorSelector = { entity: { domain: "sensor" } };
const binarySelector = { entity: { domain: ["binary_sensor", "sensor", "input_boolean", "switch"] } };
const switchSelector = { entity: { domain: ["switch", "input_boolean", "input_select", "binary_sensor", "select"] } };
const textSelector = { text: {} };
const voltageSelector = { number: { min: 0, max: 5, step: 0.01, mode: "box", unit_of_measurement: "V" } };
const opacitySelector = { number: { min: 0, max: 1, step: 0.05, mode: "slider" } };
const colorSelector = (options) => ({ select: { options, custom_value: true, mode: "dropdown" } });

// Domains, bei denen eigene EIN/AUS-Werte sinnvoll sind (Auswahllisten statt on/off)
const CUSTOM_STATE_DOMAINS = ["select", "input_select"];

// Lokalisierung mit Fallback auf Englisch pro Schlüssel (verhindert rohe Keys wie "card.delta")
// Griechisch: HA meldet "el", PR #14 nutzte "gr" -> beide Codes
const LANGS = { de, en, fr, el: gr, gr };
const localize = (hass, key) => {
  const code = (hass?.locale?.language || 'en').split('-')[0];
  const lookup = (dict) => key.split('.').reduce((o, i) => (o ? o[i] : undefined), dict);
  return lookup(LANGS[code]) ?? lookup(LANGS.en) ?? key;
};

class BmsBatteryCellsCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  static get styles() {
    return css`
      .card-config { display: flex; flex-direction: column; gap: 16px; padding: 8px 0; }
      .section { display: flex; flex-direction: column; gap: 8px; }
      .section-header {
        font-weight: 600; display: block; color: var(--primary-text-color);
        border-bottom: 1px solid var(--divider-color); padding-bottom: 4px; margin-bottom: 4px;
      }
      .sub-header { font-weight: 600; display: block; margin: 4px 0 0; color: var(--primary-text-color); }

      ha-selector { display: block; width: 100%; }

      .switch-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 1px 0; } /* Zeilenabstand ~30px wie in v1.x */
      .switch-row.highlight { background: rgba(33,150,243,0.1); padding: 4px 8px; border-radius: 6px; font-weight: bold; }

      .field-row { display: flex; align-items: center; gap: 4px; }
      .field-row ha-selector { flex: 1; min-width: 0; }
      .clear-btn { color: var(--secondary-text-color); flex-shrink: 0; }

      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

      .state-values {
        margin-left: 8px; padding-left: 8px;
        border-left: 2px solid rgba(33,150,243,0.3);
      }

      .detailed-options {
        background: rgba(33, 150, 243, 0.05);
        border: 1px solid rgba(33, 150, 243, 0.2);
        border-radius: 8px;
        padding: 10px;
        display: flex; flex-direction: column; gap: 8px;
      }

      .list-row {
        background: var(--secondary-background-color, rgba(0,0,0,0.05));
        padding: 10px; padding-right: 48px; /* Platz für den Löschen-Button */
        border-radius: 8px;
        border: 1px solid var(--divider-color, rgba(0,0,0,0.1));
        display: flex; flex-direction: column; gap: 8px;
        position: relative;
      }
      .cell-row { display: flex; align-items: center; gap: 10px; width: 100%; }
      .cell-name { width: 90px; flex-shrink: 0; }
      .cell-spacer { width: 90px; flex-shrink: 0; }
      .cell-entity { flex: 1; min-width: 0; }

      .delete-btn {
        position: absolute; top: 50%; right: 2px; transform: translateY(-50%);
        color: var(--error-color); --mdc-icon-button-size: 36px;
      }

      .add-button {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        width: 100%; padding: 10px; margin-top: 4px;
        background: transparent; color: var(--primary-color);
        border: 1px solid var(--primary-color); border-radius: 8px;
        font: inherit; font-weight: 500; cursor: pointer;
      }
      .add-button:hover { background: rgba(var(--rgb-primary-color, 33,150,243), 0.08); }

      /* Farbauswahl (native Farbpalette, im Stil eines HA-Eingabefelds) */
      .color-field {
        display: flex; flex-direction: column; justify-content: center; gap: 2px;
        min-height: 56px; box-sizing: border-box; padding: 6px 12px; cursor: pointer;
        background: var(--mdc-text-field-fill-color, var(--secondary-background-color, rgba(0,0,0,0.05)));
        border-bottom: 1px solid var(--mdc-text-field-idle-line-color, var(--secondary-text-color));
        border-radius: 4px 4px 0 0;
      }
      .color-label { font-size: 12px; color: var(--secondary-text-color); }
      .color-row { display: flex; align-items: center; gap: 10px; color: var(--primary-text-color); }
      .color-hex { font-family: monospace; font-size: 14px; }
      input[type="color"] {
        -webkit-appearance: none; appearance: none;
        width: 32px; height: 26px; padding: 0; border: none; background: none; cursor: pointer; flex-shrink: 0;
      }
      input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
      input[type="color"]::-webkit-color-swatch { border: 1px solid var(--divider-color); border-radius: 6px; }
      input[type="color"]::-moz-color-swatch { border: 1px solid var(--divider-color); border-radius: 6px; }
      .swatch-btn { width: 36px; height: 36px; }
    `;
  }

  setConfig(config) {
    this._config = config;
  }

  _localize(key) {
    return localize(this.hass, key);
  }

  _fireConfigChanged(newConfig) {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }

  // Setzt einen Wert; leere Werte entfernen den Schlüssel, damit die Standardwerte der Karte greifen
  _setValue(key, value) {
    if (!this._config) return;
    const newConfig = { ...this._config };
    const isEmpty = value === undefined || value === null || (value === '' && key !== 'title');
    if (isEmpty) delete newConfig[key];
    else newConfig[key] = value;
    this._fireConfigChanged(newConfig);
  }

  _addCell() {
    const newCells = [...(this._config.cells || [])];
    newCells.push({ name: `${newCells.length + 1}`, entity: '' });
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  _removeCell(index) {
    const newCells = [...(this._config.cells || [])];
    newCells.splice(index, 1);
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  _editCell(index, key, value) {
    const newCells = [...(this._config.cells || [])];
    const cell = { ...newCells[index] };
    if (value === undefined || value === null || value === '') delete cell[key];
    else cell[key] = value;
    newCells[index] = cell;
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  // --- Render-Helfer (einheitliche Abstände über .section gap) ---
  _renderSelector(labelKey, configKey, selector, fallback = undefined) {
    const value = this._config[configKey] ?? fallback;
    return html`
      <ha-selector
        .label=${this._localize(labelKey)}
        .hass=${this.hass}
        .selector=${selector}
        .value=${value}
        .required=${false}
        @value-changed=${(e) => this._setValue(configKey, e.detail.value)}
      ></ha-selector>
    `;
  }

  _renderEntitySelector(labelKey, configKey, selector) {
    return html`
      <div class="field-row">
        ${this._renderSelector(labelKey, configKey, selector)}
        ${this._config[configKey] ? html`
          <ha-icon-button class="clear-btn" .path=${ICON_CLOSE} @click=${() => this._setValue(configKey, undefined)}></ha-icon-button>
        ` : ''}
      </div>
    `;
  }

  // Status-Entität (Laden/Entladen/Balance/Heizung). Eigene EIN/AUS-Werte nur bei Auswahllisten
  // (select / input_select) oder wenn bereits Werte konfiguriert sind.
  _renderStateEntity(labelKey, entityKey, onKey, offKey) {
    const entityId = this._config[entityKey];
    const domain = entityId ? String(entityId).split('.')[0] : '';
    const showValues = CUSTOM_STATE_DOMAINS.includes(domain) || this._config[onKey] || this._config[offKey];
    return html`
      ${this._renderEntitySelector(labelKey, entityKey, switchSelector)}
      ${showValues ? html`
        <div class="state-values grid-2">
          ${this._renderSelector('editor.val_on', onKey, textSelector)}
          ${this._renderSelector('editor.val_off', offKey, textSelector)}
        </div>
      ` : ''}
    `;
  }

  // Beliebigen CSS-Farbwert (Hex, Name, rgb()) in #rrggbb umwandeln; null wenn keine Farbe
  _toHexColor(value) {
    if (!value || typeof value !== 'string') return null;
    const v = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + v.slice(1).split('').map(ch => ch + ch).join('').toLowerCase();
    try {
      const ctx = (this._colorCtx = this._colorCtx || document.createElement('canvas').getContext('2d'));
      ctx.fillStyle = '#000000'; ctx.fillStyle = v;
      const res = ctx.fillStyle;
      if (res === '#000000' && !/^(black|#000|#000000|rgb\(0, ?0, ?0\))$/i.test(v)) return null;
      return /^#[0-9a-f]{6}$/i.test(res) ? res : null;
    } catch (e) { return null; }
  }

  // Farbfeld mit Farbpalette (z. B. Farben für den Delta-Modus)
  _renderColorField(labelKey, configKey, fallback) {
    const value = this._config[configKey] ?? fallback;
    const hex = this._toHexColor(value) || fallback;
    return html`
      <label class="color-field">
        <span class="color-label">${this._localize(labelKey)}</span>
        <span class="color-row">
          <input type="color" .value=${hex} @change=${(e) => this._setValue(configKey, e.target.value)}>
          <span class="color-hex">${value}</span>
        </span>
      </label>
    `;
  }

  // Auswahl (z. B. gradient / range / delta) plus Farbpalette für eine eigene, feste Farbe
  _renderColorSelect(labelKey, configKey, options, fallback, defaultSwatch) {
    const value = this._config[configKey] ?? fallback;
    const hex = this._toHexColor(options.includes(value) ? '' : value) || defaultSwatch;
    return html`
      <div class="field-row">
        ${this._renderSelector(labelKey, configKey, colorSelector(options), fallback)}
        <input type="color" class="swatch-btn" title=${this._localize('editor.pick_color')} .value=${hex}
          @change=${(e) => this._setValue(configKey, e.target.value)}>
      </div>
    `;
  }

  _renderSwitch(labelKey, configKey, defaultValue = false, highlight = false) {
    const checked = defaultValue ? this._config[configKey] !== false : !!this._config[configKey];
    return html`
      <div class="switch-row ${highlight ? 'highlight' : ''}">
        <span>${this._localize(labelKey)}</span>
        <ha-switch .checked=${checked} @change=${(e) => this._setValue(configKey, e.target.checked)}></ha-switch>
      </div>
    `;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const c = this._config;
    const cells = c.cells || [];
    const detailed = !!c.show_detailed_view;
    // Die Balken-Optionen gelten auch für die Standardansicht unterhalb der Detailansicht
    const showBarOptions = !detailed || !!c.show_standard_in_detail;

    return html`
      <div class="card-config">

        ${this._renderSelector('editor.title', 'title', textSelector)}

        <div class="section">
          <span class="section-header">${this._localize('editor.display_options')}</span>
          ${this._renderSwitch('editor.show_detailed_view', 'show_detailed_view', false, true)}

          ${detailed ? html`
            ${this._renderSwitch('editor.show_charts', 'show_charts', true)}
            ${this._renderSwitch('editor.show_cell_list', 'show_cell_list', true)}
            ${this._renderSwitch('editor.show_standard_in_detail', 'show_standard_in_detail')}
            ${this._renderSwitch('editor.show_title_in_detail', 'show_title_in_detail', true)}
            ${this._renderSwitch('editor.show_status', 'show_status')}
            ${this._renderSwitch('editor.balance_led', 'balance_led')}
          ` : ''}

          ${showBarOptions ? html`
            ${detailed ? html`<span class="sub-header">${this._localize('editor.standard_view_options')}</span>` : ''}
            <div class="grid-2">
              ${this._renderSelector('editor.min_voltage', 'min_voltage', voltageSelector, 2.60)}
              ${this._renderSelector('editor.max_voltage', 'max_voltage', voltageSelector, 3.65)}
            </div>
            ${!detailed ? this._renderSwitch('editor.show_header_values', 'show_values_on_top') : ''}
            ${this._renderSwitch('editor.show_as_table', 'show_as_table')}
            ${this._renderSwitch('editor.hide_bars', 'hide_bars')}
            ${this._renderSwitch('editor.horizontal_layout', 'horizontal_layout')}
            ${this._renderSwitch('editor.show_legend', 'show_legend', true)}
            ${this._renderSwitch('editor.thick_borders', 'thicker_borders')}
            ${this._renderSwitch('editor.enable_animations', 'enable_animations', true)}
            ${this._renderSwitch('editor.show_cell_voltages', 'show_values', true)}
            ${this._renderSwitch('editor.show_min_max', 'show_min_max', true)}
            ${!detailed ? this._renderSwitch('editor.show_average', 'show_average') : ''}
            ${!detailed ? this._renderSwitch('editor.calc_drift', 'show_voltage_diff') : ''}

            <span class="sub-header">${this._localize('editor.colors')}</span>
            <div class="grid-2">
              ${this._renderColorSelect('editor.cell_background_color', 'cell_background_color', ['gradient'], 'gradient', '#1c1c1e')}
              ${this._renderSelector('editor.cell_background_opacity', 'cell_background_opacity', opacitySelector, 0.25)}
              ${this._renderColorSelect('editor.cell_bar_color', 'cell_bar_color', ['range', 'delta'], 'range', '#43a047')}
              ${this._renderSelector('editor.cell_bar_opacity', 'cell_bar_opacity', opacitySelector, 0.6)}
              ${c.cell_bar_color === 'delta' ? html`
                ${this._renderColorField('editor.cell_bar_top_color', 'cell_bar_top_color', '#173117')}
                ${this._renderColorField('editor.cell_bar_bottom_color', 'cell_bar_bottom_color', '#3c2222')}
              ` : ''}
            </div>
          ` : ''}
        </div>

        <div class="section">
          <span class="section-header">${this._localize('editor.main_sensors')}</span>
          ${this._renderEntitySelector('editor.soc', 'soc_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.power', 'watt_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.voltage', 'total_voltage_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.current', 'total_current_entity', sensorSelector)}
          ${this._renderEntitySelector('editor.drift', 'cell_diff_sensor', sensorSelector)}
          ${this._renderEntitySelector('editor.temp', 'temp_entity', sensorSelector)}

          ${detailed ? html`
            <div class="detailed-options">
              <span class="sub-header" style="margin-top:0;">${this._localize('editor.detailed_sensors')}</span>
              ${this._renderStateEntity('editor.stat_charge', 'stat_charge_entity', 'stat_charge_on', 'stat_charge_off')}
              ${this._renderStateEntity('editor.stat_discharge', 'stat_discharge_entity', 'stat_discharge_on', 'stat_discharge_off')}
              ${this._renderStateEntity('editor.stat_balance', 'stat_balance_entity', 'stat_balance_on', 'stat_balance_off')}
              ${this._renderStateEntity('editor.stat_heater', 'stat_heater_entity', 'stat_heater_on', 'stat_heater_off')}
              ${this._renderEntitySelector('editor.soh', 'soh_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.capacity', 'capacity_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.cycle_capacity', 'cycle_capacity_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.cycles', 'cycle_count_entity', sensorSelector)}
              ${this._renderEntitySelector('editor.temp_mos', 'temp_mos_entity', sensorSelector)}
            </div>
          ` : ''}
        </div>

        <div class="section">
          <span class="section-header">${this._localize('editor.cells')}</span>
          ${cells.map((cell, index) => html`
            <div class="list-row">
              <div class="cell-row">
                <ha-selector class="cell-name" .label=${this._localize('editor.cell_name')} .hass=${this.hass} .selector=${textSelector} .value=${cell.name ?? ''} .required=${false} @value-changed=${(e) => this._editCell(index, 'name', e.detail.value)}></ha-selector>
                <ha-selector class="cell-entity" .label=${this._localize('editor.cell_entity')} .hass=${this.hass} .selector=${sensorSelector} .value=${cell.entity} .required=${false} @value-changed=${(e) => this._editCell(index, 'entity', e.detail.value)}></ha-selector>
              </div>
              <div class="cell-row">
                <div class="cell-spacer"></div>
                <ha-selector class="cell-entity" .label=${this._localize('editor.cell_balance_entity')} .hass=${this.hass} .selector=${binarySelector} .value=${cell.balance_entity} .required=${false} @value-changed=${(e) => this._editCell(index, 'balance_entity', e.detail.value)}></ha-selector>
              </div>
              ${detailed ? html`
                <div class="cell-row">
                  <div class="cell-spacer"></div>
                  <ha-selector class="cell-entity" .label=${this._localize('editor.cell_resistance_entity')} .hass=${this.hass} .selector=${sensorSelector} .value=${cell.resistance_entity} .required=${false} @value-changed=${(e) => this._editCell(index, 'resistance_entity', e.detail.value)}></ha-selector>
                </div>
              ` : ''}
              <ha-icon-button class="delete-btn" .path=${ICON_CLOSE} @click=${() => this._removeCell(index)}></ha-icon-button>
            </div>
          `)}
          <button class="add-button" @click=${this._addCell}>
            <ha-icon icon="mdi:plus"></ha-icon> ${this._localize('editor.add_cell')}
          </button>
        </div>

      </div>
    `;
  }
}

if (!customElements.get("bms-battery-cells-card-editor")) {
  customElements.define("bms-battery-cells-card-editor", BmsBatteryCellsCardEditor);
}

console.log(
  "%c🔋 BMS Battery Cells Card v_2.0 loaded",
  "background: #2ecc71; color: #000; padding: 2px 6px; border-radius: 4px; font-weight: bold;"
);

// Helper for making sure that HA-Components are loaded
const loadCardHelpers = async () => {
  if (window.loadCardHelpers) return window.loadCardHelpers();
  if (customElements.get("hui-view")) {
    const element = document.createElement("hui-view");
    if (element.getCardHelpers) return element.getCardHelpers();
  }
  return undefined;
};

class BmsBatteryCellsCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._initialized = false;
        this.chartVoltage = null;
        this.chartDelta = null;
        this._renderToken = 0;
        this._lastStates = null;
        this._docClickHandler = null;
        this._resizeObserver = null;
    }

    connectedCallback() {
        // Tooltip-Handler wieder anmelden, falls die Karte erneut eingehängt wird
        if (this._docClickHandler) document.addEventListener('click', this._docClickHandler);
    }

    disconnectedCallback() {
        // Globale Listener entfernen (verhindert Speicherlecks beim Verlassen des Dashboards)
        if (this._docClickHandler) document.removeEventListener('click', this._docClickHandler);
    }

    getCardSize() {
        if (this._config?.show_detailed_view) return 10;
        return Math.max(2, Math.round((this._config?.card_height || 380) / 50));
    }

    static async getConfigElement() {
        await loadCardHelpers();
        return document.createElement("bms-battery-cells-card-editor");
    }

    static getStubConfig() {
        return {
            cells: Array.from({length: 4}, (_, i) => ({ entity: `sensor.cell_${i+1}`, name: `${i+1}`, balance_entity: '' }))
        };
    }

    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;
        if (!this._initialized || (oldHass && oldHass.locale?.language !== hass.locale?.language)) {
            // Erstes Rendern oder Sprachwechsel (Beschriftungen/Titel stehen im HTML) -> neu aufbauen
            this._initRender();
        } else if (oldHass && !this._relevantStateChanged(oldHass, hass)) {
            // Home Assistant ruft den Setter bei JEDER Zustandsänderung im System auf.
            // Nur neu zeichnen, wenn sich eine Entität dieser Karte geändert hat.
            return;
        }
        this._updateValues();
    }

    // Alle Entitäten, die diese Karte verwendet
    _relevantEntities() {
        if (this._entityCache) return this._entityCache;
        const c = this._config || {};
        const ids = new Set();
        Object.keys(c).forEach(k => { if ((k.endsWith('_entity') || k === 'cell_diff_sensor') && c[k]) ids.add(c[k]); });
        (c.cells || []).forEach(cell => {
            ['entity', 'balance_entity', 'resistance_entity'].forEach(k => { if (cell && cell[k]) ids.add(cell[k]); });
        });
        this._entityCache = [...ids];
        return this._entityCache;
    }

    _relevantStateChanged(oldHass, newHass) {
        if (oldHass.locale?.language !== newHass.locale?.language) return true;
        return this._relevantEntities().some(id => oldHass.states[id] !== newHass.states[id]);
    }

    setConfig(config) {
        if (!config) throw new Error("Invalid configuration");
        this._config = {
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
            cell_background_color: 'gradient',  // 'gradient' or color string
            cell_background_opacity: 0.25,      // 0.0 - 1.0
            cell_bar_color: 'range',            // 'range': uses dynamic color to visualize cell voltage
                                                // 'delta': uses dynamic color between cell_bar_top_color 
                                                //          and cell_bar_bottom_color based on deltaV
                                                // color name or hex color string for a static color
            cell_bar_opacity: 0.6,              // 0.0 - 1.0
            cell_bar_top_color: '#173117',    // hex color string, used if cell_bar_color is 'delta'
            cell_bar_bottom_color: '#3c2222', // hex color string, used if cell_bar_color is 'delta'
            ...config
        };
        if (!Array.isArray(this._config.cells)) this._config.cells = [];
        // Title explicitly set by the user (the default title is not shown in the detailed view)
        this._userTitle = config.title || '';
        this._entityCache = null;
        this._initialized = false;
        if (this._hass) {
            this._initRender();
            this._updateValues(); // sonst stehen nach einer Konfigurationsänderung bis zum nächsten Update nur "--" da
        }
    }

    _localize(key) {
        return localize(this._hass, key);
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

    // --- UNIT HELPERS (Issue #5, #12) ---
    // Unit as reported by Home Assistant (unit_of_measurement), '' if unknown
    _getUnit(entityId) {
        if (!this._hass || !entityId) return '';
        const stateObj = this._hass.states[entityId];
        const unit = stateObj && stateObj.attributes ? stateObj.attributes.unit_of_measurement : '';
        return unit ? String(unit).trim() : '';
    }

    // Temperature: keep the unit of the entity (°C / °F / K), fallback °C
    _getTempUnit(entityId) {
        return this._getUnit(entityId) || '°C';
    }

    // Convert a temperature value to °C (needed for the color thresholds)
    _tempToCelsius(value, unit) {
        const u = String(unit || '').toUpperCase();
        if (u.includes('F')) return (value - 32) * 5 / 9;
        if (u === 'K') return value - 273.15;
        return value;
    }

    // Voltage -> Volt. Uses unit_of_measurement, falls back to the old heuristic (> 80 = mV)
    _toVolts(entityId, value) {
        if (value === null || value === undefined || isNaN(value)) return null;
        const unit = this._getUnit(entityId).toLowerCase();
        if (unit === 'mv') return value / 1000;
        if (unit === 'v') return value;
        return (value > 80) ? value / 1000 : value;
    }

    // Voltage difference -> millivolt. Uses unit_of_measurement, falls back to the old heuristic (< 1 = Volt)
    _toMilliVolts(entityId, value) {
        if (value === null || value === undefined || isNaN(value)) return null;
        const unit = this._getUnit(entityId).toLowerCase();
        if (unit === 'mv') return value;
        if (unit === 'v') return value * 1000;
        return (value < 1) ? value * 1000 : value;
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
        
        // Handle switches, input_booleans, lights
        if (domain === 'switch' || domain === 'input_boolean' || domain === 'light') {
            this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
            return;
        }

        // Handle input_select AND select
        if (domain === 'input_select' || domain === 'select') {
            const current = String(stateObj.state).trim();
            const targetOn = customOn && String(customOn).trim() !== '' ? String(customOn).trim() : 'on';
            const targetOff = customOff && String(customOff).trim() !== '' ? String(customOff).trim() : 'off';
            
            // Logic: If current is targetOn, switch to targetOff, else switch to targetOn
            const isCurrentOn = current.toLowerCase() === targetOn.toLowerCase();
            const nextOption = isCurrentOn ? targetOff : targetOn;
            
            // Correct service call based on domain
            const serviceDomain = domain === 'select' ? 'select' : 'input_select';
            
            this._hass.callService(serviceDomain, "select_option", { entity_id: entityId, option: nextOption });
        }
    }

    // Diagramme hängen an den Canvas-Elementen -> vor jedem Neu-Rendern (Konfigurationsänderung,
    // Wechsel Detail-/Standardansicht) sauber abbauen
    _teardownCharts() {
        this._renderToken++;
        if (this.chartVoltage) { this.chartVoltage.destroy(); this.chartVoltage = null; }
        if (this.chartDelta) { this.chartDelta.destroy(); this.chartDelta = null; }
        if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    }

    _initRender() {
        if (!this._config || !this._hass) return;
        this._teardownCharts();
        if (this._config.show_detailed_view) {
            this._renderDetailedView();
        } else {
            this._renderStandardView();
        }
        this._initialized = true;
    }

    async _fetchHistory(entityId, hours = 6, convert = null) {
        if (!entityId) return [];
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        try {
            const history = await this._hass.callApi(
                "GET", 
                `history/period/${startTime.toISOString()}?filter_entity_id=${entityId}&end_time=${endTime.toISOString()}&minimal_response`
            );
            if (history && history[0]) {
                return history[0]
                    .map(entry => {
                        const raw = parseFloat(String(entry.state).replace(',', '.'));
                        const y = (convert && !isNaN(raw)) ? convert(raw) : raw;
                        return { x: new Date(entry.last_changed).getTime(), y };
                    })
                    .filter(pt => pt.y !== null && !isNaN(pt.y));
            }
            return [];
        } catch (e) { return []; }
    }

    // Delta-Verlauf ohne externen Sensor: aus den Verläufen aller Zellspannungen berechnen (Max - Min in mV)
    async _fetchCellDeltaHistory(hours = 6) {
        const cells = (this._config.cells || []).filter(c => c && c.entity);
        if (cells.length < 2) return [];
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));
        try {
            const ids = cells.map(c => c.entity);
            const history = await this._hass.callApi(
                "GET",
                `history/period/${startTime.toISOString()}?filter_entity_id=${ids.join(',')}&end_time=${endTime.toISOString()}&minimal_response&no_attributes`
            );
            if (!Array.isArray(history)) return [];
            // Alle Änderungen chronologisch sortieren und jeweils den letzten Wert pro Zelle fortschreiben
            const events = [];
            history.forEach((series) => {
                if (!Array.isArray(series) || !series.length) return;
                const entityId = series[0].entity_id;
                series.forEach(entry => {
                    const raw = parseFloat(String(entry.state).replace(',', '.'));
                    events.push({ t: new Date(entry.last_changed).getTime(), id: entityId, v: isNaN(raw) ? null : this._toVolts(entityId, raw) });
                });
            });
            events.sort((a, b) => a.t - b.t);
            const current = new Map();
            const points = [];
            events.forEach(ev => {
                if (ev.v === null) current.delete(ev.id); else current.set(ev.id, ev.v);
                if (current.size < ids.length) return; // erst wenn alle Zellen einen Wert haben
                const vals = [...current.values()];
                const y = (Math.max(...vals) - Math.min(...vals)) * 1000;
                const last = points[points.length - 1];
                if (last && last.x === ev.t) last.y = y; else points.push({ x: ev.t, y });
            });
            return points;
        } catch (e) { return []; }
    }

    _initCharts() {
        const token = this._renderToken;
        setTimeout(async () => {
            const cv = this.shadowRoot.getElementById('canvas-voltage');
            const cd = this.shadowRoot.getElementById('canvas-delta');
            // Abbrechen, wenn inzwischen neu gerendert wurde (sonst landet das Diagramm auf einem alten Canvas)
            const stale = (canvas) => token !== this._renderToken || !canvas || !canvas.isConnected;

            if (cv && this._config.total_voltage_entity && !this.chartVoltage) {
                const dataV = await this._fetchHistory(this._config.total_voltage_entity, 6);
                if (!stale(cv)) this.chartVoltage = this._createChart(cv, dataV, '#ffa726', 'V');
            }
            if (cd && !this.chartDelta) {
                let dataD = null;
                if (this._config.cell_diff_sensor) {
                    // Issue #5: history values must be normalized to mV, exactly like the live values
                    const deltaEntity = this._config.cell_diff_sensor;
                    dataD = await this._fetchHistory(deltaEntity, 6, (v) => this._toMilliVolts(deltaEntity, v));
                } else if ((this._config.cells || []).length >= 2) {
                    // Kein externer Sensor: Delta aus den Zellspannungen berechnen
                    dataD = await this._fetchCellDeltaHistory(6);
                }
                if (dataD && !stale(cd)) this.chartDelta = this._createChart(cd, dataD, '#1e88e5', 'mV', 0);
            }
            this._observeChartSize();
        }, 200);
    }

    // Diagramme an die Boxbreite anpassen (z. B. Editor-Vorschau, Spaltenwechsel, Seitenleiste)
    _observeChartSize() {
        if (this._resizeObserver) this._resizeObserver.disconnect();
        if (typeof ResizeObserver === 'undefined') return;
        const containers = this.shadowRoot.querySelectorAll('.chart-container-full');
        if (!containers.length) return;
        this._resizeObserver = new ResizeObserver(() => {
            [this.chartVoltage, this.chartDelta].forEach(ch => { if (ch && ch.canvas && ch.canvas.isConnected) ch.resize(); });
        });
        containers.forEach(el => this._resizeObserver.observe(el));
    }

    _createChart(ctx, data, color, unit = '', fixedDecimals = null) {
        const ChartLib = window.Chart || Chart;
        if (!ChartLib) return null;
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, color + '66'); 
        gradient.addColorStop(1, color + '00'); 

        return new ChartLib(ctx, {
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
                                const decimals = (fixedDecimals !== null) ? fixedDecimals : ((val < 10 && val > -10) ? 3 : 2);
                                return val.toFixed(decimals) + (unit ? ' ' + unit : '');
                            }
                        }
                    } 
                },
                // bounds 'data': X-Achse exakt vom ersten bis zum letzten Messpunkt. Mit dem Standard 'ticks'
                // rundet Chart.js auf "schöne" Werte und rechts/links bleibt ein leerer Streifen.
                scales: { x: { type: 'linear', display: false, bounds: 'data', offset: false }, y: { display: false } },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });
    }

    _updateChartData(chart, timestamp, value) {
        if (!chart) return;
        const data = chart.data.datasets[0].data;
        const last = data[data.length - 1];
        // Gleiche Werte nur alle 5 Minuten erneut speichern (verhindert tausende identische Punkte)
        if (last && last.y === value && (timestamp - last.x) < 5 * 60 * 1000) return;
        data.push({ x: timestamp, y: value });
        const cutoff = timestamp - (6 * 60 * 60 * 1000);
        while(data.length > 0 && data[0].x < cutoff) { data.shift(); }
        chart.update('none');
    }

    // STANDARD VIEW
    // =========================================================================
    _renderStandardView() {
        const { title, cells = [], card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table, cell_bar_opacity, cell_background_opacity, container_padding } = this._config;
        const colors = this._getColors();
        const cellCount = cells.length;
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
            const range = max_voltage - min_voltage; const step = range / 7;
            for (let i = 0; i <= 7; i++) mapPoints.push(Math.round((min_voltage + (step * i)) * 1000) / 1000);
        }
        let scaleLabels = horizontal_layout ? [...mapPoints].map(v=>v.toFixed(2)+'V') : [...mapPoints].reverse().map(v => v.toFixed(2) + 'V');

        const style = `
            <style>
                :host { display: block; --cell-gap: ${cell_gap}px; --badge-bg-color: rgba(0, 0, 0, 0.5); --val-display: ${valDisplay}; --name-fs: ${nameFontSize}; --name-pad: ${namePadding}; --bar-border-width: ${borderWidth}; --main-display: ${show_as_table || hide_bars ? 'none' : 'flex'}; --main-direction: ${horizontal_layout ? 'column' : 'row'}; --bar-transition: ${horizontal_layout ? 'width' : 'height'} 0.4s ease-out; --legend-direction: ${horizontal_layout ? 'row' : 'column'}; --legend-align: ${horizontal_layout ? 'space-between' : 'space-between'}; --legend-border: ${horizontal_layout ? 'none' : '1px solid rgba(255,255,255,0.1)'}; --legend-border-top: ${horizontal_layout ? '1px solid rgba(255,255,255,0.1)' : 'none'}; }
                ha-card { display: flex; flex-direction: column; z-index: 0; height: ${(hide_bars || horizontal_layout || show_as_table) ? 'auto' : card_height + 'px'}; padding: ${Number.isFinite(Number(container_padding)) ? Number(container_padding) : 16}px; box-sizing: border-box; position: relative; color: ${colors.text}; overflow: hidden; }
                .header.card-header { display: grid; grid-template-areas: "title stats" "subinfo stats"; grid-template-columns: 1fr auto; align-items: center; margin-bottom: 12px; flex-shrink: 0; padding-bottom: 8px; border-bottom: ${(hide_bars && !show_as_table) ? 'none' : '1px solid rgba(255,255,255,0.05)'}; }
                .title { grid-area: title; font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; margin-top: -4px; }			
				.sub-info-row { grid-area: subinfo; display: flex; gap: 12px; align-items: center; font-size: 1.125rem; color: var(--secondary-text-color); margin-top: 2px; }
				.sub-info-item, .stat-item { cursor: pointer; transition: opacity 0.2s; }
				.sub-info-item:hover, .stat-item:hover { opacity: 0.7; }
				.sub-info-item { display: flex; align-items: center; gap: 4px; }
				.sub-info-item ha-icon { --mdc-icon-size: 20px; color: var(--secondary-text-color); }
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
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${this._getCellBackground()}; opacity: ${cell_background_opacity}; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar { position: absolute; ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'} background: pink; ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);' : 'border-top: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);'} z-index: 1; transition: var(--bar-transition); ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'} opacity: ${cell_bar_opacity}; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                .cell-bar.is-discharging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear reverse; }
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
        if (show_as_table) { containerHtml = `<div class="table-container">${cells.map((cell, index) => `<div class="table-item" id="table-item-${index}"><span class="table-name">${this._esc(cell.name || (index+1))}</span><span class="table-val" id="table-val-${index}">-</span></div>`).join('')}</div>`; } 
        else if (!horizontal_layout) { containerHtml = `<div class="main-container cells-container">${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}</div>`; } 
        else { containerHtml = `<div class="main-container cells-container">${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}</div>`; }
        const html = `<ha-card><div class="header card-header"><div class="title">${this._esc(title ?? this._localize('card.default_title'))}</div><div class="sub-info-row" id="sub-info-container"></div><div class="stats" id="stats-container"></div></div>${containerHtml}</ha-card>`;
        this.shadowRoot.innerHTML = style + html;
        this._setupTooltips();
    }

    _renderCellHtml(cell, index) {
        return `<div class="cell-wrapper cell-item" id="cell-wrap-${index}"><div class="custom-tooltip" id="tooltip-${index}">-</div><div class="cell-track-bg"></div><div class="cell-bar" id="bar-${index}" style="height: 0%; width: 0%;"><div class="charging-overlay"></div></div><div class="cell-info-layer">${this._config.horizontal_layout ? `<div class="cell-name-wrap"><span class="cell-name-badge">${this._esc(cell.name || (index + 1))}</span></div><div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div>` : `<div class="cell-val-wrap"><span class="cell-val-badge cell-voltage" id="val-${index}">-</span></div><div class="cell-name-wrap"><span class="cell-name-badge">${this._esc(cell.name || (index + 1))}</span></div>`}</div></div>`;
    }

    _setupTooltips() {
        const wrappers = this.shadowRoot.querySelectorAll('.cell-wrapper');
        wrappers.forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                wrappers.forEach(w => { if (w !== el) w.classList.remove('show-tooltip'); });
                el.classList.toggle('show-tooltip');
            });
        });
        // Nur EIN globaler Listener pro Karte (vorher kam bei jedem Rendern ein weiterer dazu)
        if (!this._docClickHandler) {
            this._docClickHandler = () => {
                this.shadowRoot.querySelectorAll('.cell-wrapper.show-tooltip').forEach(w => w.classList.remove('show-tooltip'));
            };
            document.addEventListener('click', this._docClickHandler);
        }
    }

    _esc(value) {
        return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    _updateStandardValues() {
        const { cells = [], watt_entity, soc_entity, cell_diff_sensor, temp_entity, total_voltage_entity, total_current_entity, show_values, show_values_on_top, show_min_max, min_voltage, max_voltage, horizontal_layout, show_voltage_diff, show_average, hide_bars, show_as_table, cell_bar_color, cell_bar_top_color, cell_bar_bottom_color } = this._config;
        
        const rowClass = show_values_on_top ? 'stat-value-row vertical-layout' : 'stat-value-row';

        const wattVal = this._parseNumber(watt_entity);
        const isCharging = (this._config.enable_animations !== false) && (wattVal !== null && wattVal > 0);
        const isDischarging = (this._config.enable_animations !== false) && (wattVal !== null && wattVal < 0);
        
        let minV = 999, maxV = -999, minIdx = -1, maxIdx = -1, cellValues = [];
        cells.forEach((cell, index) => {
            const val = this._parseNumber(cell.entity);
            if (val !== null) {
                const v = this._toVolts(cell.entity, val);
                cellValues[index] = v;
                if (v < minV) {
                    minV = v;
                    minIdx = index;
                }
                if (v > maxV) {
                    maxV = v;
                    maxIdx = index;
                }
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
                    // Issue #12: use the unit of the entity (°C / °F / K); thresholds are always evaluated in °C
                    const tUnit = this._getTempUnit(temp_entity);
                    const tCelsius = this._tempToCelsius(valNum, tUnit);
                    const tColor = (tCelsius < 12) ? '#42a5f5' : ((tCelsius > 28) ? '#ef5350' : 'var(--secondary-text-color)');
                    el.style.color = tColor;
                    const content = `<ha-icon icon="mdi:thermometer" style="${'color:'+tColor }"></ha-icon><span>${valFormatted}${tUnit}</span>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(temp_entity); };
                });
            } else idx += removeElement(subInfoContainer, 'sub-temp');
        }

        const statsContainer = this.shadowRoot.getElementById('stats-container');
        if (statsContainer) {
            const socValRaw = this._parseNumber(soc_entity);
            // Issue #5: normalize delta to mV via unit_of_measurement (fallback: value < 1 = Volt)
            const diffVal = this._toMilliVolts(cell_diff_sensor, this._parseNumber(cell_diff_sensor));
            
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
                    const socStep = Math.round(socInt / 10) * 10;
                    const iconName = socValRaw === null ? 'mdi:battery-unknown' : (socInt >= 95 ? 'mdi:battery' : (socStep <= 0 ? 'mdi:battery-outline' : `mdi:battery-${socStep}`));
                    const content = `<span class="stat-label">${this._localize('card.soc')}</span><div class="${rowClass}" style="color: ${color}"><ha-icon icon="${iconName}"></ha-icon><span>${valStr}</span></div>`;
                    if(el.innerHTML !== content) el.innerHTML = content;
                    el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(soc_entity); };
                });
            } else idx += removeElement(statsContainer, 'stat-soc');
            
            let deltaContent = null;
            let deltaEntity = null;
            let deltaColor = '';
            
            if (cell_diff_sensor && diffVal !== null) {
                deltaEntity = cell_diff_sensor;
                deltaColor = (diffVal > 20) ? '#ef5350' : '#66bb6a';
                deltaContent = `<span class="stat-label">${this._localize('card.delta')}</span><div class="${rowClass}" style="color: ${deltaColor}"><ha-icon icon="mdi:delta"></ha-icon><span>${Math.round(diffVal)} <span style="font-size:0.8em">mV</span></span></div>`;
            } else if (show_voltage_diff && maxIdx !== -1 && minIdx !== -1) {
                deltaEntity = null; 
                const calcDiff = (maxV - minV) * 1000;
                deltaColor = (calcDiff > 20) ? '#ef5350' : '#66bb6a';
                deltaContent = `<span class="stat-label">${this._localize('card.delta')}</span><div class="${rowClass}" style="color: ${deltaColor}"><ha-icon icon="mdi:delta"></ha-icon><span>${Math.round(calcDiff)} <span style="font-size:0.8em">mV</span></span></div>`;
            }

            if (deltaContent) {
                idx += updateElement(statsContainer, 'stat-delta', idx, (el) => {
                    el.className = 'stat-item';
                    if(el.innerHTML !== deltaContent) el.innerHTML = deltaContent;
                    if(deltaEntity) {
                        el.onclick = (e) => { e.stopPropagation(); this._fireMoreInfo(deltaEntity); };
                        el.style.cursor = 'pointer';
                    } else {
                        el.onclick = null; el.style.cursor = 'default';
                    }
                });
            } else idx += removeElement(statsContainer, 'stat-delta');
            
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
                
                // --- COLOR LOGIC ---
                let color = '#363694'; // DEBUG Default
                if (cell_bar_color === 'delta') { // Dynamic Color based on delta
                    color = this._lerpColor(cell_bar_bottom_color, cell_bar_top_color, displayValNum, minV, maxV);
                    //console.log('Delta Color:', { displayValNum, minV, maxV, color });
                }
                else if (cell_bar_color === 'range') { // Dynamic Color based on mapPoints
                    color = '#d32f2f'; // Default Red (Below point 1)
                    if (displayValNum >= mapPoints[6]) color = '#ff7043'; // Orange-Red (High)
                    else if (displayValNum >= mapPoints[5]) color = '#1565c0'; // Dark Blue
                    else if (displayValNum >= mapPoints[4]) color = '#42a5f5'; // Blue
                    else if (displayValNum >= mapPoints[3]) color = '#43a047'; // Green (Center)
                    else if (displayValNum >= mapPoints[2]) color = '#ffd600'; // Yellow
                    else if (displayValNum >= mapPoints[1]) color = '#ffa726'; // Orange 
                }
                else { // Static Color 
                    color = cell_bar_color;
                }
                bar.style.background = color;
                
                // --- BAR SIZE LOGIC ---
                if (horizontal_layout) {
                    bar.style.width = `${pct}%`;
                    bar.style.height = '100%';
                } else {
                    bar.style.width = '100%';
                    bar.style.height = `${pct}%`;
                }

                // --- BAR ANIMATION LOGIC ---
                // (vorher: cell.charge_state - wird nirgends gesetzt, dadurch lief die Animation nie)
                bar.classList.toggle('is-charging', isCharging);
                bar.classList.toggle('is-discharging', isDischarging);
                
                // --- VALUE LOGIC ---
                valLabel.innerText = displayVal;
                if (tooltip) tooltip.innerText = displayVal;
            }
        });
    }

    // DETAILED VIEW (Dashboard)
    // =========================================================================
    _renderDetailedView() {


        const { cells = [], show_cell_list, show_charts, show_standard_in_detail, card_height, cell_gap, show_values, min_voltage, max_voltage, thicker_borders, hide_bars, horizontal_layout, show_as_table, cell_bar_opacity, cell_background_opacity } = this._config;
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
                .cell-track-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: ${this._getCellBackground()}; opacity: ${cell_background_opacity}; z-index: 0; border-radius: 6px; overflow: hidden; }
                .cell-bar { position: absolute; ${horizontal_layout ? 'top: 0; bottom: 0; left: 0;' : 'bottom: 0; left: 0; right: 0;'} background: pink; ${horizontal_layout ? 'border-right: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);' : 'border-top: var(--bar-border-width) solid rgba(255, 255, 255, 0.6);'} z-index: 1; transition: var(--bar-transition); ${horizontal_layout ? 'border-radius: 0 4px 4px 0;' : 'border-radius: 4px 4px 0 0;'} opacity: ${cell_bar_opacity}; box-shadow: 0 -2px 8px rgba(0,0,0,0.3); overflow: hidden; }
                .cell-bar.is-charging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear; }
                .cell-bar.is-discharging .charging-overlay { opacity: 1; animation: ${horizontal_layout ? 'shimmer-move-right' : 'shimmer-move-up'} 2s infinite linear reverse; }
                @keyframes shimmer-move-up { 0% { transform: translateY(100%); } 100% { transform: translateY(-100%); } } @keyframes shimmer-move-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
                .charging-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to ${horizontal_layout ? 'right' : 'top'}, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 100%); z-index: 2; transform: ${horizontal_layout ? 'translateX(-100%)' : 'translateY(100%)'}; opacity: 0; pointer-events: none; }
                .cell-info-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3; ${horizontal_layout ? 'display: flex; align-items: center; justify-content: space-between; padding: 0 8px;' : ''} }
                ${!horizontal_layout ? `.cell-name-wrap { position: absolute; bottom: 8px; width: 100%; text-align: center; } .cell-val-wrap { position: absolute; bottom: 34px; width: 100%; text-align: center; }` : `.cell-name-wrap { position: relative; } .cell-val-wrap { position: relative; margin-right: 12px; }`}
                .cell-name-badge { background: rgba(0,0,0,0.6); color: white; padding: var(--name-pad); font-size: var(--name-fs); border-radius: 4px; font-weight: bold; backdrop-filter: blur(2px); white-space: nowrap; }
                .cell-val-badge.cell-voltage { background: var(--badge-bg-color); color: #fff; padding: 4px 10px; font-size: 13px; border-radius: 12px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); display: var(--val-display); white-space: nowrap; }
                .legend-col { display: flex; flex-direction: var(--legend-direction); justify-content: var(--legend-align); ${horizontal_layout ? 'width: 100%; height: 20px; border-top: var(--legend-border-top); padding-top: 2px;' : 'height: 100%; padding-right: 8px; margin-right: 4px; border-right: var(--legend-border); min-width: 40px;'} font-size: 11px; color: var(--secondary-text-color); text-align: right; font-weight: 500; }
             `;
             
            if (show_as_table) {
                standardHtml = `<div class="standard-view-wrapper"><div class="table-container">${cells.map((cell, index) => `<div class="table-item" id="table-item-${index}"><span class="table-name">${this._esc(cell.name || (index + 1))}</span><span class="table-val" id="table-val-${index}">-</span></div>`).join('')}</div></div>`;
            } 
            else if (!horizontal_layout) {
                standardHtml = `<div class="standard-view-wrapper"><div class="main-container cells-container">${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}</div></div>`;
            } 
            else {
                standardHtml = `<div class="standard-view-wrapper"><div class="main-container cells-container">${cells.map((cell, index) => this._renderCellHtml(cell, index)).join('')}${this._config.show_legend ? `<div class="legend-col">${scaleLabels.map(l => `<span>${l}</span>`).join('')}</div>` : ''}</div></div>`;
            }
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
                
                .box { background: rgba(var(--rgb-primary-text-color), 0.04); border-radius: 8px; padding: 10px 14px; display: flex; flex-direction: column; position: relative; overflow: hidden; min-width: 0; }
                .clickable { cursor: pointer; transition: background 0.2s; }
                .clickable:active { background: rgba(var(--rgb-primary-text-color), 0.08); }
                
                .box-title { font-size: 0.85rem; color: var(--secondary-text-color); font-weight: 500; display: flex; justify-content: space-between; margin-bottom: 2px; pointer-events: none; }
                .box-val-row { font-size: 1.8rem; font-weight: 400; line-height: 1; display: flex; align-items: baseline; gap: 4px; pointer-events: none; margin-bottom: 4px; }
                .unit { font-size: 1rem; color: var(--secondary-text-color); font-weight: 400; }
                
                .chart-box { height: 110px; justify-content: space-between; }
                .chart-meta { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 6px; font-size: 0.8rem; color: var(--secondary-text-color); margin-top: auto; }
                .max-val-red { color: #e53935; font-weight: bold; }
                .min-val-blue { color: #1e88e5; font-weight: bold; }
                
                /* Diagramm randlos über die volle Boxbreite: negative Ränder gleichen das Box-Padding (14px) aus.
                   Das Canvas liegt absolut im Container, damit Chart.js immer die Containergröße übernimmt. */
                .chart-container-full {
                    flex: 1 1 auto;
                    position: relative;
                    align-self: stretch;
                    width: auto;
                    min-width: 0;
                    min-height: 0;
                    margin: 0 -14px;
                    overflow: hidden;
                }
                .chart-container-full canvas {
                    position: absolute; top: 0; left: 0;
                    width: 100% !important; height: 100% !important;
                    display: block;
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
                .cell-res { color: var(--secondary-text-color); font-size: 0.75rem; margin-left: auto; margin-right: 8px; align-self: center; }
                .bal-led { display: inline-block; width: 10px; height: 10px; border-radius: 50%; vertical-align: middle; background: var(--disabled-text-color, #9e9e9e); opacity: 0.5; }
                .bal-led.on { background: #4caf50; opacity: 1; box-shadow: 0 0 6px #4caf50; }
                .detail-title { font-size: 1.3rem; font-weight: 500; letter-spacing: 0.5px; padding: 0 4px; }
                .status-summary { justify-content: center; align-items: center; flex-direction: row; gap: 8px; padding: 10px; font-size: 0.9rem; font-weight: 500; }
                .status-summary .status-val { font-weight: 700; }
                .status-row.has-heater { flex-wrap: wrap; }
                .status-row.has-heater .status-pill { flex: 1 1 40%; }
                
                @media (max-width: 500px) { .col-3 { grid-template-columns: 1fr; } .cell-list-grid { grid-template-columns: 1fr; } }
                
                ${standardCss}
            </style>
        `;

        // Issue #3: title in the detailed view (only if the user has set one and it is not switched off)
        const detailTitle = (this._userTitle && this._config.show_title_in_detail !== false) ? this._userTitle : '';

        const html = `
            <ha-card>
                ${detailTitle ? `<div class="detail-title">${this._esc(detailTitle)}</div>` : ''}
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
                    
                    <div class="box chart-box clickable" data-entity="${this._config.cell_diff_sensor}" id="chart-delta">
                        <div class="box-title">
                            <span>${this._localize('card.delta_cell_vol')}</span>
                            <ha-icon icon="mdi:delta" style="width:16px; height:16px; color:#1e88e5"></ha-icon>
                        </div>
                        <div class="box-val-row"><span id="d-delta-val">--</span> <span class="unit">mV</span></div>
                        <div class="chart-container-full"><canvas id="canvas-delta"></canvas></div>
                        <div class="chart-meta">
                            <span>${this._localize('card.max_cell')} : <span id="d-max-cell-idx" class="max-val-red">--</span></span>
                            <span>${this._localize('card.min_cell')} : <span id="d-min-cell-idx" class="min-val-blue">--</span></span>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${this._config.show_status ? `
                <div class="box status-summary">
                    <span>${this._localize('card.status')} :</span> <span class="status-val" id="d-status">--</span>
                </div>
                ` : ''}

                <div class="status-row ${this._config.stat_heater_entity ? 'has-heater' : ''}">
                    <div class="status-pill" id="btn-charge">
                        <span>${this._localize('card.charge')} :</span> <span class="status-val" id="d-stat-charge">--</span>
                    </div>
                    <div class="status-pill" id="btn-discharge">
                        <span>${this._localize('card.discharge')} :</span> <span class="status-val" id="d-stat-discharge">--</span>
                    </div>
                    <div class="status-pill" id="btn-balance">
                        <span>${this._localize('card.balance')} :</span> <span class="status-val" id="d-stat-balance">--</span>
                    </div>
                    ${this._config.stat_heater_entity ? `
                    <div class="status-pill" id="btn-heater">
                        <span>${this._localize('card.heater')} :</span> <span class="status-val" id="d-stat-heater">--</span>
                    </div>
                    ` : ''}
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

        this.shadowRoot.getElementById('btn-heater')?.addEventListener('click', (e) => {
             e.stopPropagation(); this._handleSwitchAction(this._config.stat_heater_entity, this._config.stat_heater_on, this._config.stat_heater_off);
        });

        this.shadowRoot.getElementById('btn-balance')?.addEventListener('click', (e) => {
             e.stopPropagation(); 
             if(this._config.stat_balance_entity) {
                this._handleSwitchAction(this._config.stat_balance_entity, this._config.stat_balance_on, this._config.stat_balance_off);
             }
        });
        
        this._initCharts();
    }



    _getCellBackground() { 
        const { horizontal_layout, cell_background_color} = this._config;

        if (cell_background_color === 'gradient') {
            let direction = horizontal_layout ? 'to right' : 'to top';
            return "linear-gradient(" + direction + ", #d32f2f 0%, #ef5350 7%, #ffa726 14.28%, #ffd600 28.57%, #43a047 42.85%, #42a5f5 57.14%, #1565c0 71.42%, #ff7043 85.71%, #ff5722 100%)";
        }

        return cell_background_color && cell_background_color.length > 0 ? cell_background_color : 'var(--card-background-color, #1c1c1e)';
    }

    _lerpColor(bottom, top, value, min, max) {
        // Clamp + normalize
        const t = max === min ? 0 : (value - min) / (max - min);
        const clamped = Math.min(1, Math.max(0, t));
      
        // Convert hex → RGB
        const c1 = this._hexToRgb(bottom);
        const c2 = this._hexToRgb(top);
      
        // Interpolate channels
        const r = Math.round(c1.r + (c2.r - c1.r) * clamped);
        const g = Math.round(c1.g + (c2.g - c1.g) * clamped);
        const b = Math.round(c1.b + (c2.b - c1.b) * clamped);
      
        //console.log('Lerp Color:', { value, min, max, t, clamped, c1, c2, r, g, b });

        return `rgb(${r}, ${g}, ${b})`;
    }
      
    _hexToRgb(hex) {
        const clean = hex.replace('#', '');
        const bigint = parseInt(clean.length === 3
          ? clean.split('').map(c => c + c).join('')
          : clean, 16);
      
        return {
          r: (bigint >> 16) & 255,
          g: (bigint >> 8) & 255,
          b: bigint & 255
        };
    }

    _getColors() {
        return { bg: 'var(--card-background-color, #1c1c1e)', text: 'var(--primary-text-color, #ffffff)', textSecondary: 'var(--secondary-text-color, #9e9e9e)' };
    }

    _updateValues() {
        if (!this._initialized || !this._hass) return;
        if (this._config.show_detailed_view) {
            this._updateDetailedValues();
            return;
        }
        this._updateStandardValues();
    }

    _updateDetailedValues() {
        const c = this._config;
        const setTxt = (id, val) => { const el = this.shadowRoot.getElementById(id); if(el) el.innerHTML = (val !== null && val !== undefined) ? val : '--'; };
        const setStyle = (id, prop, val) => { const el = this.shadowRoot.getElementById(id); if(el) el.style[prop] = val; };

        // --- HELPER FUNCTION DEFINE FIRST ---
        const isStateOn = (current, customOn) => {
            if (!current) return false;
            const curStr = String(current).trim();
            if (customOn && String(customOn).trim() !== '') { 
                return curStr.toLowerCase() === String(customOn).trim().toLowerCase(); 
            }
            const lower = curStr.toLowerCase();
            return (lower === 'on' || lower === 'true' || lower === 'balancing');
        };

        const vTotal = this._parseNumber(c.total_voltage_entity);
        const iTotal = this._parseNumber(c.total_current_entity);
        const pTotal = this._parseNumber(c.watt_entity);
        const delta  = this._parseNumber(c.cell_diff_sensor);
        const soc    = this._parseNumber(c.soc_entity);
        const soh    = this._parseNumber(c.soh_entity);
        
        const leftList = []; const rightList = [];
        
        const addIfConf = (list, confKey, labelKey, unit, isTemp=false, fixed=null) => {
            if (!c[confKey]) return;
            let val = this._parseNumber(c[confKey]);
            if (val !== null && fixed !== null) {
                val = val.toFixed(fixed);
            }
            // Issue #12: temperatures use the unit of the entity (°C / °F / K)
            if (isTemp) unit = this._getTempUnit(c[confKey]);

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
                const val = this._toVolts(cell.entity, v);
                if (val < minV) { minV = val; minIdx = i; }
                if (val > maxV) { maxV = val; maxIdx = i; }
                cellSum += val; cellCnt++;
            }
        });
        const avgVal = cellCnt > 0 ? (cellSum / cellCnt).toFixed(3) + ' V' : '--';
        leftList.push(`<div class="detail-item"><span class="detail-label">${this._localize('card.avg_cell')} :</span><span class="detail-val-txt">${avgVal}</span></div>`);
        
        addIfConf(leftList, 'temp_entity', 'editor.temp', '°C', true, 1);
        
        if (c.capacity_entity && c.soc_entity) {
            const cap = this._parseNumber(c.capacity_entity);
            if(cap && soc !== null) {
                const rem = Math.round(cap * (soc/100)) + ' Ah';
                rightList.push(`<div class="detail-item"><span class="detail-label">${this._localize('card.remain_capacity')} :</span><span class="detail-val-txt">${rem}</span></div>`);
            }
        }
        addIfConf(rightList, 'cycle_count_entity', 'card.cycle_count', '');
        
        // Issue #5: delta always in mV (unit_of_measurement of the sensor, fallback: value < 1 = Volt)
        let deltaDisplay = this._toMilliVolts(c.cell_diff_sensor, delta);
        if (deltaDisplay === null && maxV > 0 && minV < 999) deltaDisplay = (maxV - minV) * 1000;
        const deltaStr = deltaDisplay !== null ? (deltaDisplay/1000).toFixed(3) + ' V' : '--';
        const deltaEnt = c.cell_diff_sensor || '';
        const deltaClass = deltaEnt ? 'detail-item clickable' : 'detail-item';
        rightList.push(`<div class="${deltaClass}" data-entity="${deltaEnt}"><span class="detail-label">${this._localize('card.delta_cell_vol')} :</span><span class="detail-val-txt">${deltaStr}</span></div>`);
        
        addIfConf(rightList, 'temp_mos_entity', 'card.mos_temp', '°C', true, 1); // PR #13 (evilstan): 1 Nachkommastelle

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

        setTxt('d-delta-val', deltaDisplay !== null ? Math.round(deltaDisplay) : '--');
        setTxt('d-max-cell-idx', maxIdx !== -1 ? (c.cells[maxIdx].name || (maxIdx+1)) : '--');
        setTxt('d-min-cell-idx', minIdx !== -1 ? (c.cells[minIdx].name || (minIdx+1)) : '--');
        
        const stBal  = this._getState(c.stat_balance_entity);

        // --- CHECK GLOBAL BALANCE STATE ---
        const isBalGlobal = isStateOn(stBal, c.stat_balance_on);

        // --- OVERALL STATUS (Issue #3): charging / discharging / balancing / idle ---
        if (c.show_status) {
            const statusEl = this.shadowRoot.getElementById('d-status');
            if (statusEl) {
                const anyCellBalancing = c.cells.some(cell => cell.balance_entity && isStateOn(this._getState(cell.balance_entity)));
                const balancing = isBalGlobal || anyCellBalancing;
                // positive = charging, negative = discharging (same convention as the rest of the card)
                let flow = null;
                if (pTotal !== null && Math.abs(pTotal) > 0.1) flow = pTotal;
                else if (iTotal !== null && Math.abs(iTotal) > 0.05) flow = iTotal;
                const parts = []; let color = 'var(--secondary-text-color)';
                if (flow !== null && flow > 0)      { parts.push(this._localize('card.status_charging')); color = '#43a047'; }
                else if (flow !== null && flow < 0) { parts.push(this._localize('card.status_discharging')); color = '#03a9f4'; }
                if (balancing) { parts.push(this._localize('card.status_balancing')); if (flow === null) color = '#ffa726'; }
                if (parts.length === 0) parts.push(this._localize('card.status_idle'));
                statusEl.innerText = parts.join(' + ');
                statusEl.style.color = color;
            }
        }

        // Status-Pills: ohne Entität "--" (vorher irreführend "AUS"), klickbar nur bei schaltbaren Domains
        const TOGGLE_DOMAINS = ['switch', 'input_boolean', 'light', 'select', 'input_select'];
        const setStatus = (id, entityId, customOn) => {
            const el = this.shadowRoot.getElementById(id);
            if (!el) return;
            const pill = el.parentElement;
            if (!entityId) {
                el.innerText = '--';
                el.className = 'status-val';
                if (pill) pill.classList.remove('interactive');
                return;
            }
            const isOn = isStateOn(this._getState(entityId), customOn);
            el.innerText = isOn ? this._localize('card.on') : this._localize('card.off');
            el.className = `status-val ${isOn ? 'status-on' : 'status-off'}`;
            if (pill) pill.classList.toggle('interactive', TOGGLE_DOMAINS.includes(String(entityId).split('.')[0]));
        };

        setStatus('d-stat-charge', c.stat_charge_entity, c.stat_charge_on);
        setStatus('d-stat-discharge', c.stat_discharge_entity, c.stat_discharge_on);
        setStatus('d-stat-balance', c.stat_balance_entity, c.stat_balance_on);
        setStatus('d-stat-heater', c.stat_heater_entity, c.stat_heater_on);

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
            
            // --- Generate HTML List (Hybrid Logic) ---
            const showResistance = c.cells.some(cell => cell.resistance_entity);
            c.cells.forEach((cell, i) => {
                const v = this._parseNumber(cell.entity);
                if (v !== null) {
                    const val = this._toVolts(cell.entity, v);
                    const colIdx = i < Math.ceil(c.cells.length/2) ? 0 : 1;
                    
                    // --- HYBRID BALANCING LOGIC START ---
                    let isCellBalancing = false;
                    
                    if (cell.balance_entity) {
                        const bState = this._getState(cell.balance_entity);
                        isCellBalancing = isStateOn(bState); 
                    } else {
                        isCellBalancing = isBalGlobal && (i === maxIdx || i === minIdx);
                    }
                    
                    let balText = 'bal. off';
                    let balStyle = '';

                    if (isCellBalancing) {
                        balText = 'bal. on';
                        balStyle = 'color: #4caf50; font-weight: bold;';
                    }

                    // Issue #3: optional LED instead of the "bal. on / bal. off" text
                    const balHtml = c.balance_led
                        ? `<span class="cell-bal"><span class="bal-led ${isCellBalancing ? 'on' : 'off'}" title="${balText}"></span></span>`
                        : `<span class="cell-bal" style="${balStyle}">${balText}</span>`;

                    // Issue #3: optional internal resistance per cell
                    let resHtml = '';
                    if (showResistance) {
                        let resStr = '';
                        if (cell.resistance_entity) {
                            const r = this._parseNumber(cell.resistance_entity);
                            if (r !== null) {
                                const rUnit = this._getUnit(cell.resistance_entity);
                                resStr = `${parseFloat(r.toFixed(2))}${rUnit ? ' ' + rUnit : ''}`;
                            } else resStr = '--';
                        }
                        resHtml = `<span class="cell-res clickable" ${cell.resistance_entity ? `data-entity="${cell.resistance_entity}"` : ''}>${resStr}</span>`;
                    }

                    cellListHtml[colIdx].push(`<div class="cell-text-row clickable" data-entity="${cell.entity}"><span><span class="cell-num">${String(i+1).padStart(2,'0')}.</span><span class="cell-v">${val.toFixed(3)} V</span></span>${resHtml}${balHtml}</div>`);
                }
            });
            listContainer.innerHTML = `<div class="cell-list-col">${cellListHtml[0].join('')}</div><div class="cell-list-col">${cellListHtml[1].join('')}</div>`;
        }
        
        if (this.chartVoltage && vTotal !== null) { this._updateChartData(this.chartVoltage, Date.now(), vTotal); }
        if (this.chartDelta && deltaDisplay !== null) { this._updateChartData(this.chartDelta, Date.now(), deltaDisplay); }
        
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
