const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

class BmsBatteryCellsCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._initialized = false;
  }
    
  setConfig(config) {
    this._config = config;
    if (this.shadowRoot) {
      this._render();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot) {
        this.shadowRoot.querySelectorAll("ha-entity-picker").forEach(picker => {
            if (picker) { picker.hass = hass; }
        });
    }
  }

  connectedCallback() {
    this._render();
  }
  
  _render() {
    if (!this.shadowRoot || !this._config) return;

    if (this._initialized) {
        this._updateValues();
        return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        .card-config { display: flex; flex-direction: column; gap: 16px; padding: 8px; }
        .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
        ha-textfield, ha-entity-picker { width: 100%; display: block; }
        h4 { margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid var(--divider-color); color: var(--primary-text-color); }
        .cell-row { display: flex; gap: 8px; align-items: center; background: var(--secondary-background-color, rgba(0,0,0,0.05)); padding: 8px; border-radius: 8px; margin-bottom: 8px; }
        .cell-name { width: 80px; flex-shrink: 0; }
        .cell-entity { flex: 1; }
        .actions { display: flex; justify-content: flex-end; margin-top: 8px; }
      </style>

      <div class="card-config">
        <ha-textfield id="title" label="Titel der Karte"></ha-textfield>

        <h4>Haupt-Sensoren</h4>
        <ha-entity-picker id="soc_entity" label="SoC (Batteriestand %)" domain-filter="sensor" allow-custom-entity></ha-entity-picker>
        <ha-entity-picker id="watt_entity" label="Gesamtleistung (Watt)" domain-filter="sensor" allow-custom-entity></ha-entity-picker>
        <ha-entity-picker id="cell_diff_sensor" label="Zelldrift (Delta mV)" domain-filter="sensor" allow-custom-entity></ha-entity-picker>

        <h4>Darstellung</h4>
        <div class="row">
          <span>Werte über Icons anzeigen (Header)</span>
          <ha-switch id="show_values_on_top"></ha-switch>
        </div>
        <div class="row">
          <span>Animationen aktivieren</span>
          <ha-switch id="enable_animations"></ha-switch>
        </div>

        <h4>Zellen</h4>
        <div id="cell-list"></div>
        <div class="actions">
            <mwc-button id="add-cell" raised>+ Zelle hinzufügen</mwc-button>
        </div>
      </div>
    `;

    this._attachListeners();
    this._initialized = true;
    this._updateValues();
  }

  _attachListeners() {
    const root = this.shadowRoot;
    const add = (id, event) => {
        const el = root.getElementById(id);
        if(el) {
            el.configValue = id;
            el.addEventListener(event, this._valueChanged.bind(this));
        }
    };
    add('title', 'input');
    add('soc_entity', 'value-changed');
    add('watt_entity', 'value-changed');
    add('cell_diff_sensor', 'value-changed');
    add('show_values_on_top', 'change');
    add('enable_animations', 'change');
    root.getElementById('add-cell').addEventListener('click', this._addCell.bind(this));
  }

  _updateValues() {
    const config = this._config;
    const root = this.shadowRoot;
    const setVal = (id, val) => { const el = root.getElementById(id); if(el) el.value = val || ''; };
    const setCheck = (id, val) => { const el = root.getElementById(id); if(el) el.checked = val; };

    setVal('title', config.title);
    setVal('soc_entity', config.soc_entity);
    setVal('watt_entity', config.watt_entity);
    setVal('cell_diff_sensor', config.cell_diff_sensor);
    setCheck('show_values_on_top', config.show_values_on_top ?? false);
    setCheck('enable_animations', config.enable_animations ?? true);

    this._renderCellList();
  }

  _renderCellList() {
    const root = this.shadowRoot;
    const listContainer = root.getElementById('cell-list');
    listContainer.innerHTML = '';
    const cells = this._config.cells || [];
    cells.forEach((cell, index) => {
        const row = document.createElement('div');
        row.className = 'cell-row';
        row.innerHTML = `
            <ha-textfield class="cell-name" label="Name" value="${cell.name || ''}"></ha-textfield>
            <ha-entity-picker class="cell-entity" label="Entität" value="${cell.entity || ''}" domain-filter="sensor" allow-custom-entity></ha-entity-picker>
            <ha-icon-button icon="mdi:close" style="color: #ef5350;"></ha-icon-button>
        `;
        row.querySelector('.cell-name').addEventListener('input', (e) => this._cellChanged(index, 'name', e.target.value));
        const picker = row.querySelector('.cell-entity');
        picker.hass = this._hass;
        picker.addEventListener('value-changed', (e) => this._cellChanged(index, 'entity', e.detail.value));
        row.querySelector('ha-icon-button').addEventListener('click', () => this._removeCell(index));
        listContainer.appendChild(row);
    });
  }

  _valueChanged(ev) {
    if (!this._config) return;
    const target = ev.target;
    const configValue = target.configValue;
    let newValue = target.tagName === 'HA-SWITCH' ? target.checked : target.value;
    fireEvent(this, "config-changed", { config: { ...this._config, [configValue]: newValue } });
  }

  _cellChanged(index, field, value) {
    let newCells = [...(this._config.cells || [])];
    newCells[index] = { ...newCells[index], [field]: value };
    fireEvent(this, "config-changed", { config: { ...this._config, cells: newCells } });
  }

  _addCell() {
    let newCells = [...(this._config.cells || [])];
    newCells.push({ name: `${newCells.length + 1}`, entity: '' });
    fireEvent(this, "config-changed", { config: { ...this._config, cells: newCells } });
  }

  _removeCell(index) {
    let newCells = [...(this._config.cells || [])];
    newCells.splice(index, 1);
    fireEvent(this, "config-changed", { config: { ...this._config, cells: newCells } });
  }
}
customElements.define("bms-battery-cells-card-editor", BmsBatteryCellsCardEditor);
