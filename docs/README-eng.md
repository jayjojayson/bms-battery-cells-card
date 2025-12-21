![Home Assistant](https://img.shields.io/badge/home%20assistant-41BDF5?logo=home-assistant&logoColor=white)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/bms-battery-cells-card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/bms-battery-cells-card/releases/)
![File size](https://img.shields.io/github/size/jayjojayson/bms-battery-cells-card/dist/bms-battery-cells-card.js?label=Card%20Size)
![last commit](https://img.shields.io/github/last-commit/jayjojayson/bms-battery-cells-card)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/README-eng.md)
[![stars](https://img.shields.io/github/stars/jayjojayson/bms-battery-cells-card)](https://github.com/jayjojayson/bms-battery-cells-card/stargazers)


# bms-battery-cells-card
Visualization of individual cell voltages of your battery storage system (BMS)


The 🔋 BMS Battery Cells Card is a custom Lovelace card for visualizing the individual cell voltages of your battery storage system (BMS). It provides a clear overview of the status of all cells, including min/max values and balancing status.

The card can be fully configured via the card editor user interface.
You need the corresponding entities from your BMS (e.g. Victron, JK-BMS, Daly) that provide the cell voltages in Home Assistant.
Regular batteries (AGM and similar) also work, as long as you have suitable entities available in Home Assistant.

If you like this custom card, I would really appreciate a star rating ⭐. 🤗

## Features

### 🔋 **Visualization of individual cell voltages**
### 📉 **Min / Max / Average display**
### 🎨 **Dynamic coloring (thresholds)**
### ⚖️ **Balancing indicators**
### 📐 **Flexible layout (grid/list)**
### ⚙️ **UI configuration**

<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card2.png" />
<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card_big.png" />

---

## Installation

### HACS (Recommended)

- Add the GitHub repository via the link in Home Assistant.
 
  [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=bms-battery-cells-card&category=plugin)

- The "BMS Battery Cells Card" should now be available in HACS. Click "INSTALL".
- The resource will be automatically added to your Lovelace configuration.

<details>
  <summary> <b>Manuelle Installation über Hacs</b></summary>  

### Manuelle Installation über Hacs 
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
 
### Manuelle Installation in HA
1.  **Download files:**
    * Download the bms-battery-cells-card.js from this repository.

2.  **Dateien in Home Assistant hochladen:**
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

## Konfiguration

After installation, you can add the card to your dashboard:

1.  **Enable edit mode:**
    * Open the dashboard where you want to add the card and click **Edit.**.

2.  **Add card:**
    * Click + Add card and search for **"BMS Battery Cells Card"**.

3.  **Configure options:**
    * A configuration dialog will open where all settings can be conveniently adjusted.
    * **BMS Entity:** The main entity or list of sensors.
    * **Voltage Range:** Define the minimum and maximum voltage for the graphical display.
    * **Colors:** Adjust the colors for low, normal, and high voltage.

---

## YAML-Modus (Alternative)

Obwohl die UI-Konfiguration empfohlen wird, kann die Karte auch manuell über den YAML-Editor konfiguriert werden:

### Optionen

| name                  | typ      | required   | description                                                                                                 | standard                                 |
| --------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `type`                | `string` | Yes        | `custom:bms-battery-cells-card`                                                                             |                                          |
| `entity`              | `string` | Yes        | The BMS entity (or list of cell sensors).                                  		             		      |                                          |
| `title`   		   	| `string` | No         | TCard title. 										                                                   		  | 										                     |
| `min_voltage`         | `number` | No         | Minimum cell voltage for the scale (e.g. 2.5V).									                          | `2.5`                 		        			 |
| `max_voltage`         | `number` | No         | Maximum cell voltage for the scale (e.g. 3.65V). 								                    	      | `3.65`                                   |
| `show_values`         | `boolean`| No         | Show the exact voltage values as text. 										                   		      | `true`                                   |
| `show_min_max`	    | `boolean`| No         | Highlight the cell with the lowest/highest voltage.						                  				  | `true`                		        			 |
| `columns` 		    | `number` | No         | Number of columns for the cell display.                                                					  | `4`               			          			 |


### Example configuration

simple example:

```yaml
type: custom:bms-battery-cells-card
entity: sensor.victron_system_battery_voltage
title: Mein Akku
```
advanced example:

```yaml
type: custom:bms-battery-cells-card
entity: sensor.bms_master_cells
title: DIY LiFePO4
min_voltage: 2.8
max_voltage: 3.6
show_values: true
show_min_max: true
columns: 8
```

### CSS Elements

| Selector            | Description                                                                 |
| ------------------- | --------------------------------------------------------------------------- |
| `ha-card`           | The entire card container.                                                  |
| `.card-header`      | The title of the card.                                                      |
| `.cells-container`  | The container wrapping all cells.                                           |
| `.cell-item`        | A single battery cell.                                                      |
| `.cell-voltage`     | The voltage text.                                                           |
| `.cell-bar`         | The visual bar/background of the cell.                                      |
| `.min-cell`         | Specific class for the cell with the lowest voltage.                        |
| `.max-cell`         | Specific class for the cell with the highest voltage.                       |


Change font size and color of voltages  
Makes the voltage value text larger and bold.
```yaml
type: custom:bms-battery-cells-card
entity: sensor.bms_cells
card_mod:
  style: |
    .cell-voltage {
      font-size: 16px;
      font-weight: bold;
      color: white;
    }
```

Highlight Min/Max Cells  
Adds a red border to the cell with the highest voltage and a blue border to the one with the lowest.
```yaml
type: custom:bms-battery-cells-card
entity: sensor.bms_cells
card_mod:
  style: |
    .max-cell {
      border: 2px solid red;
    }
    .min-cell {
      border: 2px solid blue;
    }
```
