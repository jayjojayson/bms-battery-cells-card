[![hacs_badge](https://img.shields.io/badge/HACS-Default%20✔-brightgreen.svg)](https://github.com/hacs/plugin)
[![HACS validation](https://img.shields.io/github/actions/workflow/status/jayjojayson/bms-battery-cells-card/validate.yml?label=HACS%20Validation)](https://github.com/jayjojayson/bms-battery-cells-card/actions?query=workflow%3Avalidate)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/bms-battery-cells-card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/bms-battery-cells-card/releases/)
![Downloads](https://img.shields.io/github/downloads/jayjojayson/bms-battery-cells-card/total?label=Downloads&color=blue) 
[![README Deutsch](https://img.shields.io/badge/README-DE-orange)](https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/README-de.md)
[![Support](https://img.shields.io/badge/%20-Support%20Me-steelblue?style=flat&logo=paypal&logoColor=white)](https://www.paypal.me/quadFlyerFW)
[![stars](https://img.shields.io/github/stars/jayjojayson/bms-battery-cells-card)](https://github.com/jayjojayson/bms-battery-cells-card/stargazers)


# BMS Battery Cells Card
Visualization of individual cell voltages of your battery storage system (BMS)


The 🔋 BMS Battery Cells Card is a custom Lovelace card for visualizing the individual cell voltages of your battery storage system (BMS). It provides a clear overview of the status of all cells, including min/max values and balancing status.

The card can be fully configured via the card editor user interface.
You need the corresponding entities from your BMS (e.g. Victron, JK-BMS, Daly, Seplos, JBD) that provide the cell voltages in Home Assistant.
Regular batteries (AGM and similar with 12, 24v or 48v) also work, as long as you have suitable entities available in Home Assistant.

Supported Card languages are English and German. If you need other languages as well, tell me.

If you like this custom card, I would really appreciate a star rating ⭐. Thanks 🤗

## Features

### 🔋 **Visualizations & Layouts**
- **Individual Cell Voltage:** Bar charts with dynamic color thresholds (Min/Max/Avg)
- **Multiple Layout Modes:**
  - 📏 **Standard View:** Classic bar chart visualization
  - 📋 **Table View:** Compact grid showing only numbers (no bars)
  - 📃 **List View:** Horizontal layout for a list-like appearance
  - 🎛️ **Detailed View:** A full BMS dashboard view
- **Compact Mode:** Option to hide bars and show only header stats
- **Animations:** Charging (power in) and Discharging (power out) animations on cell bars

### 📈 **Detailed View (optional)**
- **Integrated Charts:** Live history graphs for **Total Voltage** and **Cell Drift** (using Chart.js)
- **Extended BMS Metrics:** Display of **SoH**, **Cycles**, **Capacity** (Ah), and **MOS Temperature**
- **Remaining Capacity:** Auto-calculation based on Amp-hours and SoC
- **Cell List:** detailed table of all cell voltages including individual balancing status
- **Hybrid View:** Option to show the standard cell bars *inside* the detailed view

### ⚡ **BMS Control & Interactive Elements**
- **Interactive Status Switches:** Toggle **Charge**, **Discharge**, and **Balance** directly from the card (supports Switches, Input Booleans, and Input Selects)
- **Custom State Logic:** Define custom values for "On" and "Off" states (e.g., `True`/`False`, `On`/`Off`)
- **Balance Switch:** for BMS like seplos, tdt BMS, daily or jbd
- **Balance Sensor:** Define a Balance Sensor for each cell (like JK-BMS)
- **Click Actions:** Click on sensors, charts, or cells to open the Home Assistant "More Info" dialog

### 📉 **Statistics & Monitoring**
- **Real-time Stats:** Total Voltage, Current, Power (Watt), and Temperature
- **Smart Drift Calculation:** Automatically calculates the delta between Min and Max cells (or uses an external sensor)
- **Min/Max Indicators:** Visual highlighting of the highest and lowest voltage cells
- **Average Voltage:** Option to display the calculated average cell voltage

### ⚙️ **Configuration & Customization**
- **UI Editor:** Fully configurable via the Home Assistant UI editor (no YAML required)
- **Thresholds:** Adjustable Minimum and Maximum voltage for color scaling
- **Visual Tweaks:** Options for thicker borders, hiding header values, and a lot more


<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card2.png" />  
<img width="96%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card_big.png" />
<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card-compact-2.png" />  <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card-compact.png" />  
<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card_one_cell.png" />  <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card-ani.gif" /> 

---

detailed view:

<img width="96%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card-detailed-view.png" />

---

## Installation

### HACS (Recommended)

- Add the GitHub repository via the link in Home Assistant.
 
  [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=bms-battery-cells-card&category=plugin)

- The "BMS Battery Cells Card" should now be available in HACS. Click "INSTALL".
- The resource will be automatically added to your Lovelace configuration.

<details>
  <summary> <b>Manual Installation via Hacs</b></summary>  

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
  <summary> <b>Manual Installation in HA</b></summary>  
 
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

## YAML-Mode (optinal)

Although UI configuration is recommended, the map can also be configured manually via the YAML editor:

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
