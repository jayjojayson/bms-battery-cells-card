import de from './lang-de.js';
import en from './lang-en.js';

// Helper um LitElement sicher zu laden
const LitElement = customElements.get("ha-lit-element") || Object.getPrototypeOf(customElements.get("home-assistant-main"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const ICON_CLOSE = "M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z";

// Selector Konfiguration für Sensoren
const sensorSelector = { entity: { domain: "sensor" } };

class BmsBatteryCellsCardEditor extends LitElement {
  constructor() {
    super();
    this.langs = { de, en };
  }

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  static get styles() {
    return css`
      .card-config { display: flex; flex-direction: column; gap: 16px; padding: 8px; }
      .section-header { 
        font-weight: 600; margin-top: 24px; margin-bottom: 8px; 
        display: block; border-bottom: 1px solid var(--divider-color); padding-bottom: 4px;
        color: var(--primary-text-color);
      }
      .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
      .list-row {
        background: var(--secondary-background-color, rgba(0,0,0,0.05)); 
        padding: 10px; border-radius: 8px; 
        border: 1px solid var(--divider-color, rgba(0,0,0,0.1));
        margin-bottom: 10px;
        display: flex; gap: 10px; align-items: center;
      }
      
      /* Auch ha-selector braucht Platz wenn er lädt */
      ha-textfield, ha-selector { 
          width: 100%; 
          display: block; 
          min-height: 56px; 
      }
      
      .cell-name { width: 90px; flex-shrink: 0; }
      .cell-entity { flex: 1; }
      .add-button { width: 100%; margin-top: 8px; }
      ha-icon-button { color: var(--error-color); cursor: pointer; --mdc-icon-button-size: 36px; }
    `;
  }

  setConfig(config) {
    this._config = config;
  }

  _localize(key) {
    const lang = this.hass?.locale?.language || 'en';
    const code = lang.split('-')[0]; 
    const dict = this.langs[code] || this.langs['en'];
    return key.split('.').reduce((o, i) => (o ? o[i] : null), dict) || key;
  }

  _fireConfigChanged(newConfig) {
    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  // Erweiterte Logik um auch Keys direkt übergeben zu können
  _valueChanged(ev, key) {
    if (!this._config) return;
    
    // Key aus dem Event-Target holen ODER direkt übergeben bekommen
    const configValue = key || ev.target.configValue; 
    
    if (!configValue) return;

    let newValue = ev.target.value;
    
    // Wichtig für ha-selector: Der Wert kommt oft im 'detail'
    if (ev.detail && ev.detail.value !== undefined) {
        newValue = ev.detail.value;
    }

    if (ev.target.tagName === 'HA-SWITCH') {
        newValue = ev.target.checked;
    }
    if (ev.target.type === 'number') {
        newValue = parseFloat(newValue);
    }

    this._fireConfigChanged({ ...this._config, [configValue]: newValue });
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
    newCells[index] = { ...newCells[index], [key]: value };
    this._fireConfigChanged({ ...this._config, cells: newCells });
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const cells = this._config.cells || [];

    return html`
      <div class="card-config">
        
        <ha-textfield
          label="${this._localize('editor.title')}"
          .value=${this._config.title || ''}
          .configValue=${'title'}
          @input=${this._valueChanged}
        ></ha-textfield>

        <div>
            <span class="section-header">${this._localize('editor.main_sensors')}</span>
            
            <ha-selector
              .label="${this._localize('editor.soc')}"
              .hass=${this.hass}
              .selector=${sensorSelector}
              .value=${this._config.soc_entity}
              @value-changed=${(e) => this._valueChanged(e, 'soc_entity')}
              style="margin-bottom: 8px;"
            ></ha-selector>

            <ha-selector
              .label="${this._localize('editor.power')}"
              .hass=${this.hass}
              .selector=${sensorSelector}
              .value=${this._config.watt_entity}
              @value-changed=${(e) => this._valueChanged(e, 'watt_entity')}
              style="margin-bottom: 8px;"
            ></ha-selector>

            <ha-selector
              .label="${this._localize('editor.voltage')}"
              .hass=${this.hass}
              .selector=${sensorSelector}
              .value=${this._config.total_voltage_entity}
              @value-changed=${(e) => this._valueChanged(e, 'total_voltage_entity')}
              style="margin-bottom: 8px;"
            ></ha-selector>

            <ha-selector
              .label="${this._localize('editor.current')}"
              .hass=${this.hass}
              .selector=${sensorSelector}
              .value=${this._config.total_current_entity}
              @value-changed=${(e) => this._valueChanged(e, 'total_current_entity')}
              style="margin-bottom: 8px;"
            ></ha-selector>

            <ha-selector
              .label="${this._localize('editor.drift')}"
              .hass=${this.hass}
              .selector=${sensorSelector}
              .value=${this._config.cell_diff_sensor}
              @value-changed=${(e) => this._valueChanged(e, 'cell_diff_sensor')}
              style="margin-bottom: 8px;"
            ></ha-selector>

            <ha-selector
              .label="${this._localize('editor.temp')}"
              .hass=${this.hass}
              .selector=${sensorSelector}
              .value=${this._config.temp_entity}
              @value-changed=${(e) => this._valueChanged(e, 'temp_entity')}
            ></ha-selector>
        </div>

        <div>
            <span class="section-header">${this._localize('editor.display_options')}</span>
            
            <div class="row">
                <ha-textfield
                    label="${this._localize('editor.min_voltage')}"
                    type="number"
                    step="0.01"
                    .value=${this._config.min_voltage ?? 2.60}
                    .configValue=${'min_voltage'}
                    @input=${this._valueChanged}
                ></ha-textfield>
                <div style="width: 16px;"></div>
                <ha-textfield
                    label="${this._localize('editor.max_voltage')}"
                    type="number"
                    step="0.01"
                    .value=${this._config.max_voltage ?? 3.65}
                    .configValue=${'max_voltage'}
                    @input=${this._valueChanged}
                ></ha-textfield>
            </div>

            <div class="row">
                <span>${this._localize('editor.show_header_values')}</span>
                <ha-switch
                    .checked=${this._config.show_values_on_top || false}
                    .configValue=${'show_values_on_top'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.show_as_table')}</span>
                <ha-switch
                    .checked=${this._config.show_as_table || false}
                    .configValue=${'show_as_table'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.hide_bars')}</span>
                <ha-switch
                    .checked=${this._config.hide_bars || false}
                    .configValue=${'hide_bars'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.horizontal_layout')}</span>
                <ha-switch
                    .checked=${this._config.horizontal_layout || false}
                    .configValue=${'horizontal_layout'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.thick_borders')}</span>
                <ha-switch
                    .checked=${this._config.thicker_borders || false}
                    .configValue=${'thicker_borders'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>
            
            <div class="row">
                <span>${this._localize('editor.enable_animations')}</span>
                <ha-switch
                    .checked=${this._config.enable_animations !== false}
                    .configValue=${'enable_animations'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.show_cell_voltages')}</span>
                <ha-switch
                    .checked=${this._config.show_values !== false}
                    .configValue=${'show_values'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.show_min_max')}</span>
                <ha-switch
                    .checked=${this._config.show_min_max !== false}
                    .configValue=${'show_min_max'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.show_average')}</span>
                <ha-switch
                    .checked=${this._config.show_average || false}
                    .configValue=${'show_average'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>

            <div class="row">
                <span>${this._localize('editor.calc_drift')}</span>
                <ha-switch
                    .checked=${this._config.show_voltage_diff || false}
                    .configValue=${'show_voltage_diff'}
                    @change=${this._valueChanged}
                ></ha-switch>
            </div>
        </div>

        <div>
            <span class="section-header">${this._localize('editor.cells')}</span>
            
            ${cells.map((cell, index) => html`
              <div class="list-row">
                <ha-textfield
                    class="cell-name"
                    label="${this._localize('editor.cell_name')}"
                    .value=${cell.name || ''}
                    @input=${(e) => this._editCell(index, 'name', e.target.value)}
                ></ha-textfield>
                
                <ha-selector
                    class="cell-entity"
                    .label="${this._localize('editor.cell_entity')}"
                    .hass=${this.hass}
                    .selector=${sensorSelector}
                    .value=${cell.entity}
                    @value-changed=${(e) => this._editCell(index, 'entity', e.detail.value)}
                ></ha-selector>

                <ha-icon-button
                    .path=${ICON_CLOSE}
                    @click=${() => this._removeCell(index)}
                ></ha-icon-button>
              </div>
            `)}

            <mwc-button class="add-button" outlined @click=${this._addCell}>
              <ha-icon icon="mdi:plus" style="margin-right: 8px;"></ha-icon> ${this._localize('editor.add_cell')}
            </mwc-button>
        </div>

      </div>
    `;
  }
}

customElements.define("bms-battery-cells-card-editor", BmsBatteryCellsCardEditor);
