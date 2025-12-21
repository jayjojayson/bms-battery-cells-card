![Home Assistant](https://img.shields.io/badge/home%20assistant-41BDF5?logo=home-assistant&logoColor=white)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/bms-battery-cells-card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/bms-battery-cells-card/releases/)
![File size](https://img.shields.io/github/size/jayjojayson/bms-battery-cells-card/dist/bms-battery-cells-card.js?label=Card%20Size)
![last commit](https://img.shields.io/github/last-commit/jayjojayson/bms-battery-cells-card)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/README-eng.md)
[![stars](https://img.shields.io/github/stars/jayjojayson/bms-battery-cells-card)](https://github.com/jayjojayson/bms-battery-cells-card/stargazers)


# BMS Battery Cells Card
Visualization of individual cell voltages of your battery storage system (BMS)


The 🔋 BMS Battery Cells Card is a custom Lovelace card for visualizing the individual cell voltages of your battery storage system (BMS). It provides a clear overview of the status of all cells, including min/max values and balancing status.

The card can be fully configured via the card editor user interface.
You need the corresponding entities from your BMS (e.g. Victron, JK-BMS, Daly) that provide the cell voltages in Home Assistant.
Regular batteries (AGM and similar) also work, as long as you have suitable entities available in Home Assistant.

If you like this custom card, I would really appreciate a star rating ⭐. 🤗

## Features

### 🔋 **Visualization of individual cell voltages**
### 📉 **Min / Max / Drift / Average display**
### 🎨 **Dynamic coloring (thresholds)**
### ⚖️ **Balancing indicators**
### ✨ **Animated cells (Power in/out)**
### ⚡ **Battery Temp & Power State (in/out)**
### 📐 **Flexible layout (grid/list)**
### ⚙️ **UI configuration**

<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card2.png" />
<img width="96%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card_big.png" />

---

## Installation

### HACS (Recommended)

- Add the GitHub repository via the link in Home Assistant.
 
  [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=bms-battery-cells-card&category=plugin)

- The "BMS Battery Cells Card" should now be available in HACS. Click "INSTALL".
- The resource will be automatically added to your Lovelace configuration.

<details>
  <summary> <b>Manuelle Installation über Hacs</b></summary>  

### Manual  Installation via Hacs 
Open HACS in Home Assistant..

- Go to "Frontend" and click the three dots in the upper right corner.
- Select "Custom repositories".
- Add the URL of your GitHub repository and select "Lovelace" as the category.
- Click "ADD".
- The "BMS Battery Cells Card" should now be available in HACS. Click "INSTALL".
- The resource will be automatically added to your Lovelace configuration.
</details>

<details>
  <summary> <b>Manuelle Installation in HA</b></summary>  
 
### Manual  Installation in HA
1.  **Download files:**
    * Download the bms-battery-cells-card.js from this repository.

2.  **import files to Home Assistant:**
    * Create a new folder named `bms-battery-cells-card` in the `www/community`-directory of your Home Assistant configuration. (The www directory is located in the same folder as your configuration.yaml).
    * Copy all downloaded files into this new folder. Your folder structure should look like this:
        ```
        /config/www/community/bms-battery-cells-card/bms-battery-cells-card.js
        ```

3.  **Add the resource to Home Assistant::**
    * In Home Assistant, go to Settings > Dashboards.
	* Click the three-dot menu in the top right corner and select Resources.
	* Click + Add resource.
	* Enter /local/community/bms-battery-cells-card/bms-battery-cells-card.js as the URL.
	* Select JavaScript module as the resource type.
	* Click Create.
</details>

---

## Configuration

After installation, you can add the card to your dashboard:

1.  **Enable edit mode:**
    * Open the dashboard where you want to add the card and click **Edit.**.

2.  **Add card:**
    * Click + Add card and search for **"BMS Battery Cells Card"**.

3.  **Configure options:**
    * A configuration dialog will open where all settings can be conveniently adjusted.
    * **BMS Entity:** The main entity or list of sensors.
    * **Voltage Range:** Define the minimum and maximum voltage for the graphical display.
    * **Details:** Display additional values ​​such as battery power, temperature, drift, or average voltage.

---

## YAML-Modus (alternative)

Obwohl die UI-Konfiguration empfohlen wird, kann die Karte auch manuell über den YAML-Editor konfiguriert werden:

### Options

| name | type | required | description | default |
| ---- | ---- | -------- | ----------- | ------- |
| `type` | `string` | Yes | Card type definition. Must be `custom:bms-battery-cells-card`. | |
| `title` | `string` | No | Title displayed at the top of the card. | `"Batterie Zellen"` |
| `cells` | `list` | Yes | List of cell definitions (entity + name). | 4 example cells |
| `cells[].entity` | `string` | Yes | Sensor entity representing the cell voltage. | |
| `cells[].name` | `string` | No | Display name of the cell. | Cell index |
| `show_legend` | `boolean` | No | Show voltage scale (Y-axis) on the left side. | `true` |
| `container_padding` | `number` | No | Inner padding of the card container (px). | `16` |
| `card_height` | `number` | No | Fixed height of the card in pixels. | `380` |
| `cell_gap` | `number` | No | Gap between individual cells (px). | `4` |
| `show_values` | `boolean` | No | Display voltage values inside each cell. | `true` |
| `show_values_on_top` | `boolean` | No | Display statistic values above icons instead of inline. | `false` |
| `enable_animations` | `boolean` | No | Enable charging/discharging animations. | `true` |
| `min_voltage` | `number` | No | Minimum cell voltage for scaling. | `2.60` |
| `max_voltage` | `number` | No | Maximum cell voltage for scaling. | `3.65` |
| `show_min_max` | `boolean` | No | Highlight the cells with minimum and maximum voltage. | `true` |
| `show_average` | `boolean` | No | Display average cell voltage in statistics. | `false` |
| `soc_entity` | `string` | No | State of Charge (SoC) sensor entity. | |
| `watt_entity` | `string` | No | Power sensor entity (positive = charging, negative = discharging). | |
| `cell_diff_sensor` | `string` | No | Cell voltage drift sensor (mV). | |
| `temp_entity` | `string` | No | Battery temperature sensor entity. | |

### Example configuration

simple example:

```yaml
type: custom:bms-battery-cells-card
title: Battery Cells
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
  - entity: sensor.cell_3
    name: "3"
  - entity: sensor.cell_4
    name: "4"
```
advanced example:

```yaml
type: custom:bms-battery-cells-card
cells:
  - name: "1"
    entity: sensor.vrm_maximum_cell_voltage_batt_1
  - name: "2"
    entity: sensor.vrm_minimum_cell_voltage_batt_1
  - name: "3"
    entity: sensor.vrm_maximum_cell_voltage_batt_2
  - name: "4"
    entity: sensor.vrm_minimum_cell_voltage_batt_2
soc_entity: sensor.victron_system_battery_soc
watt_entity: sensor.vrm_battery_power_batt_1024
cell_diff_sensor: sensor.vrm_minimum_cell_voltage_batt_1
temp_entity: sensor.vrm_battery_temperature_batt_1
show_values_on_top: false
enable_animations: true
title: Battery Cells
thicker_borders: true
min_voltage: 2.6
max_voltage: 3.65
show_average: false
```

---

### CSS Elements

| Selector | Description |
| :--- | :--- |
| `.header` | Card header area. |
| `.card-header` | Header containing the title and statistics. |
| `.title` | Card title. |
| `.stats` | Container for statistic values. |
| `.stat-item` | Individual statistic block. |
| `.stat-label` | Label of a statistic value. |
| `.stat-value-row` | Row containing icon and value. |
| `.vertical-layout` | Vertical layout for icon/value. |
| `.main-container` | Main container for the cells. |
| `.cells-container` | Container holding all cell elements. |
| `.legend-col` | Voltage scale (Y-axis). |
| `.cell-wrapper` | Wrapper for a single cell. |
| `.cell-item` | Individual battery cell. |
| `.min-cell` | Highlights the cell with the lowest voltage. |
| `.max-cell` | Highlights the cell with the highest voltage. |
| `.custom-tooltip` | Tooltip shown on click / hover. |
| `.cell-track-bg` | Cell background with gradient. |
| `.cell-bar` | Voltage bar of the cell. |
| `.is-charging` | Charging animation active. |
| `.is-discharging` | Discharging animation active. |
| `.charging-overlay` | Animated overlay layer. |
| `.cell-info-layer` | Overlay layer for labels. |
| `.cell-name-wrap` | Container for the cell name. |
| `.cell-name-badge` | Badge displaying the cell name. |
| `.cell-val-wrap` | Container for the voltage value. |
| `.cell-val-badge` | Voltage value display. |
| `.cell-voltage` | Voltage value modifier. |
| `ha-card` | Home Assistant card container. |
| `ha-icon` | Icons used in the statistics section. |


Adjust Header & Titel
```yaml
type: custom:bms-battery-cells-card
title: Battery Cells
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .title {
      font-size: 1.6rem;
      font-weight: 600;
      color: #00e676;
    }
    .header.card-header {
      border-bottom: 1px solid rgba(0,224,118,0.3);
    }
```

Point out Min-/Max-Cells 
```yaml
type: custom:bms-battery-cells-card
title: Battery Cells
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .cell-wrapper.min-cell {
      border: 2px solid #2196f3;
      box-shadow: 0 0 12px rgba(33,150,243,0.8) inset;
    }

    .cell-wrapper.max-cell {
      border: 2px solid #f44336;
      box-shadow: 0 0 12px rgba(244,67,54,0.8) inset;
    }
```

Cell-Name present more discreetly
```yaml
type: custom:bms-battery-cells-card
title: Battery Cells
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .cell-name-badge {
      background: rgba(255,255,255,0.08);
      color: #e0e0e0;
      font-weight: 500;
      letter-spacing: 0.4px;
    }
```

Customize tooltip design (Touch, Hover) 
```yaml
type: custom:bms-battery-cells-card
title: Battery Cells
cells:
  - entity: sensor.cell_1
    name: "1"
  - entity: sensor.cell_2
    name: "2"
card_mod:
  style: |
    .cell-name-badge {
      background: rgba(255,255,255,0.08);
      color: #e0e0e0;
      font-weight: 500;
      letter-spacing: 0.4px;
    }
```
