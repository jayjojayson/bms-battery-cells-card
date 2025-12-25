[![HACS validation](https://img.shields.io/github/actions/workflow/status/jayjojayson/bms-battery-cells-card/validate.yml?label=HACS%20Validation)](https://github.com/jayjojayson/bms-battery-cells-card/actions?query=workflow%3Avalidate)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/bms-battery-cells-card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/bms-battery-cells-card/releases/)
![File size](https://img.shields.io/github/size/jayjojayson/bms-battery-cells-card/dist/bms-battery-cells-card.js?label=Card%20Size)
![last commit](https://img.shields.io/github/last-commit/jayjojayson/bms-battery-cells-card)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/README-eng.md)
[![stars](https://img.shields.io/github/stars/jayjojayson/bms-battery-cells-card)](https://github.com/jayjojayson/bms-battery-cells-card/stargazers)


# BMS Battery Cells Card
Visualisierung der Einzelzellenspannungen deines Batteriespeichersystems (BMS) 


Die 🔋 **BMS Battery Cells Card** ist eine benutzerdefinierte Lovelace-Karte zur Visualisierung der einzelnen Zellspannungen deines Batteriespeichers (BMS). Sie bietet eine übersichtliche Darstellung des Zustands aller Zellen, inklusive Min/Max-Werten und Balancing-Status.

Die Karte ist vollständig über die Benutzeroberfläche des Karteneditors konfigurierbar.
Du benötigst die entsprechenden Entitäten deines BMS (z.B. Victron, JK-BMS, Daly), die die Zellspannungen in Home Assistant bereitstellen.
Es funktionieren natürlich auch normale Batterien (AGM und Co) soweit ihr dafür Entitäten in HA erhaltet.

Wenn euch die custom Card gefällt, würde ich mich sehr über eine Sternebewertung ⭐ freuen. 🤗

## Features

- ### 🔋 **Visualisierung einzelner Zellspannungen**
- ### 📉 **Min / Max / Drift / Durchschnitts-Anzeige**
- ### 🎨 **Dynamische Farbgebung (Schwellenwerte)**
- ### ⚖️ **Balancing Indikatoren**
- ### ✨ **Animierte Zellen (Power in/out)**
- ### ⚡ **Batterie Voltage, Current, Temp & Power Status (in/out)**
- ### 📐 **Flexibles Layout (Grid/Liste)**
- ### ⚙️ **UI-Konfiguration**

<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card2.png" />  
<img width="96%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card_big.png" />
<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card-compact.png" />  


---

## Installation

### HACS (Empfohlen)

- Das github über den Link in Home Assistant einfügen.
 
  [![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=jayjojayson&repository=bms-battery-cells-card&category=plugin)

- Die "BMS Battery Cells Card" sollte nun in HACS verfügbar sein. Klicke auf "INSTALLIEREN" ("INSTALL").
- Die Ressource wird automatisch zu deiner Lovelace-Konfiguration hinzugefügt.

<details>
  <summary> <b>Manuelle Installation über Hacs</b></summary>  

### Manuelle Installation über Hacs 
Öffne HACS in Home Assistant.

- Gehe zu "Frontend" und klicke auf die drei Punkte in der oberen rechten Ecke.
- Wähle "Benutzerdefinierte Repositories" ("Custom repositories") aus.
- Füge die URL zu deinem GitHub-Repository hinzu und wähle "Lovelace" als Kategorie.
- Klicke auf "HINZUFÜGEN" ("ADD").
- Die "BMS Battery Cells Card" sollte nun in HACS verfügbar sein. Klicke auf "INSTALLIEREN" ("INSTALL").
- Die Ressource wird automatisch zu deiner Lovelace-Konfiguration hinzugefügt.
</details>

<details>
  <summary> <b>Manuelle Installation in HA</b></summary>  
 
### Manuelle Installation in HA
1.  **Dateien herunterladen:**
    * Lade die `bms-battery-cells-card.js` aus diesem Repository herunter.

2.  **Dateien in Home Assistant hochladen:**
    * Erstelle einen neuen Ordner namens `bms-battery-cells-card` im `www/community`-Verzeichnis deiner Home Assistant-Konfiguration. (Das `www`-Verzeichnis befindet sich im selben Ordner wie deine `configuration.yaml`).
    * Kopiere **alle heruntergeladenen Dateien** in diesen neuen Ordner. Deine Ordnerstruktur sollte wie folgt aussehen:
        ```
        /config/www/community/bms-battery-cells-card/bms-battery-cells-card.js
        ```

3.  **Ressource zu Home Assistant hinzufügen:**
    * Gehe in Home Assistant zu **Einstellungen > Dashboards**.
    * Klicke auf das Menü mit den drei Punkten oben rechts und wähle **Ressourcen**.
    * Klicke auf **+ Ressource hinzufügen**.
    * Gebe als URL `/local/community/bms-battery-cells-card/bms-battery-cells-card.js` ein.
    * Wähle als Ressourcentyp **JavaScript-Modul**.
    * Klicke auf **Erstellen**.
</details>

---

## Konfiguration

Nach der Installation kannst du die Karte zu deinem Dashboard hinzufügen:

1.  **Bearbeitungsmodus aktivieren:**
    * Öffne das Dashboard, zu dem die Karte hinzufügt werden soll, und klicke auf **Bearbeiten**.

2.  **Karte hinzufügen:**
    * Klicke auf **+ Karte hinzufügen** und suche nach der **"BMS Battery Cells Card"**.

3.  **Optionen konfigurieren:**
    * Ein Konfigurationsfenster wird angezeigt, in dem alle Einstellungen bequem angepasst werden können.
    * **BMS Entity:** Die Hauptentitäten oder Liste der Sensoren.
    * **Voltage Range:** Definiere Min und Max Spannung für die grafische Darstellung.
    * **Details:** Blende Zusatzwerte wie Battery Power, Temp, Drif oder Durschnittsspannung an.

---

## YAML-Modus (Alternative)

Obwohl die UI-Konfiguration empfohlen wird, kann die Karte auch manuell über den YAML-Editor konfiguriert werden:

### Optionen

| name | typ | erforderlich | Beschreibung | Standard |
| ---- | --- | ------------ | ------------ | -------- |
| `type` | `string` | Ja | Kartentyp. Muss `custom:bms-battery-cells-card` sein. | |
| `title` | `string` | Nein | Titel, der oben in der Karte angezeigt wird. | `"Batterie Zellen"` |
| `cells` | `list` | Ja | Liste der Zellen (jeweils mit Entität und optionalem Namen). | 4 Beispiel-Zellen |
| `cells[].entity` | `string` | Ja | Sensor-Entität der Zellspannung. | |
| `cells[].name` | `string` | Nein | Anzeigename der Zelle. | Zell-Index |
| `show_legend` | `boolean` | Nein | Zeigt die Spannungs-Skala (Y-Achse) auf der linken Seite an. | `true` |
| `container_padding` | `number` | Nein | Innenabstand des Karten-Containers in Pixeln. | `16` |
| `card_height` | `number` | Nein | Feste Höhe der Karte in Pixeln. | `380` |
| `cell_gap` | `number` | Nein | Abstand zwischen einzelnen Zellen in Pixeln. | `4` |
| `show_values` | `boolean` | Nein | Zeigt die exakten Zellspannungen als Text an. | `true` |
| `show_values_on_top` | `boolean` | Nein | Zeigt Statistikwerte oberhalb der Icons an. | `false` |
| `enable_animations` | `boolean` | Nein | Aktiviert Lade- und Entlade-Animationen. | `true` |
| `min_voltage` | `number` | Nein | Minimale Zellspannung für die Skalierung. | `2.60` |
| `max_voltage` | `number` | Nein | Maximale Zellspannung für die Skalierung. | `3.65` |
| `show_min_max` | `boolean` | Nein | Markiert die Zellen mit minimaler und maximaler Spannung. | `true` |
| `show_average` | `boolean` | Nein | Zeigt die durchschnittliche Zellspannung in den Statistiken an. | `false` |
| `soc_entity` | `string` | Nein | Sensor-Entität für den Ladezustand (SoC). | |
| `watt_entity` | `string` | Nein | Leistungs-Sensor (positiv = Laden, negativ = Entladen). | |
| `cell_diff_sensor` | `string` | Nein | Sensor für die Zellspannungs-Abweichung (mV). | |
| `temp_entity` | `string` | Nein | Sensor-Entität für die Batterietemperatur. | |


### Beispielkonfiguration

Einfaches Beispiel:

```yaml
type: custom:bms-battery-cells-card
title: Batterie Zellen
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
Erweitertes Beispiel:

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
title: Batterie Zellen
thicker_borders: true
min_voltage: 2.6
max_voltage: 3.65
show_average: false
```

---


### CSS Elements

| Selector | Description |
| :--- | :--- |
| `.header` | Kopfbereich der Karte. |
| `.card-header` | Header mit Titel und Statistiken. |
| `.title` | Karten-Titel. |
| `.stats` | Container für Statistikwerte. |
| `.stat-item` | Einzelner Statistikblock. |
| `.stat-label` | Beschriftung der Statistik. |
| `.stat-value-row` | Zeile mit Icon und Wert. |
| `.vertical-layout` | Vertikale Anordnung von Icon/Wert. |
| `.main-container` | Hauptcontainer der Zellen. |
| `.cells-container` | Container für alle Zell-Elemente. |
| `.legend-col` | Spannungs-Skala (Y-Achse). |
| `.cell-wrapper` | Wrapper einer einzelnen Zelle. |
| `.cell-item` | Einzelne Batteriezelle. |
| `.min-cell` | Markierung der Zelle mit Minimalspannung. |
| `.max-cell` | Markierung der Zelle mit Maximalspannung. |
| `.custom-tooltip` | Tooltip bei Klick / Hover. |
| `.cell-track-bg` | Hintergrund mit Farbverlauf. |
| `.cell-bar` | Spannungs-Balken. |
| `.is-charging` | Lade-Animation aktiv. |
| `.is-discharging` | Entlade-Animation aktiv. |
| `.charging-overlay` | Animiertes Overlay. |
| `.cell-info-layer` | Overlay für Labels. |
| `.cell-name-wrap` | Container für Zellnamen. |
| `.cell-name-badge` | Badge mit Zellnamen. |
| `.cell-val-wrap` | Container für Spannungswert. |
| `.cell-val-badge` | Spannungs-Anzeige. |
| `.cell-voltage` | Kennzeichnung Spannungswert. |
| `ha-card` | Home Assistant Kartencontainer. |
| `ha-icon` | Icons in Statistikbereich. |


Header & Titel anpassen 
```yaml
type: custom:bms-battery-cells-card
title: Batterie Zellen
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

Min-/Max-Zellen hervorheben  
```yaml
type: custom:bms-battery-cells-card
title: Batterie Zellen
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

Zellnamen dezenter darstellen 
```yaml
type: custom:bms-battery-cells-card
title: Batterie Zellen
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

Tooltip Design anpassen (Touch, Hover) 
```yaml
type: custom:bms-battery-cells-card
title: Batterie Zellen
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
