![Home Assistant](https://img.shields.io/badge/home%20assistant-41BDF5?logo=home-assistant&logoColor=white)
[![hacs_badge](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/jayjojayson/bms-battery-cells-card?include_prereleases=&sort=semver&color=blue)](https://github.com/jayjojayson/bms-battery-cells-card/releases/)
![File size](https://img.shields.io/github/size/jayjojayson/bms-battery-cells-card/dist/bms-battery-cells-card.js?label=Card%20Size)
![last commit](https://img.shields.io/github/last-commit/jayjojayson/bms-battery-cells-card)
[![README English](https://img.shields.io/badge/README-Eng-orange)](https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/README-eng.md)
[![stars](https://img.shields.io/github/stars/jayjojayson/bms-battery-cells-card)](https://github.com/jayjojayson/bms-battery-cells-card/stargazers)


# bms-battery-cells-card
Visualisierung der Einzelzellenspannungen deines Batteriespeichersystems (BMS)


Die 🔋 **BMS Battery Cells Card** ist eine benutzerdefinierte Lovelace-Karte zur Visualisierung der einzelnen Zellspannungen deines Batteriespeichers (BMS). Sie bietet eine übersichtliche Darstellung des Zustands aller Zellen, inklusive Min/Max-Werten und Balancing-Status.

Die Karte ist vollständig über die Benutzeroberfläche des Karteneditors konfigurierbar.
Du benötigst die entsprechenden Entitäten deines BMS (z.B. Victron, JK-BMS, Daly), die die Zellspannungen in Home Assistant bereitstellen.
Es funktionieren natürlich auch normale Batterien (AGM und Co) soweit ihr dafür Entitäten in HA erhaltet.

Wenn euch die custom Card gefällt, würde ich mich sehr über eine Sternebewertung ⭐ freuen. 🤗

## Features

### 🔋 **Visualisierung einzelner Zellspannungen**
### 📉 **Min / Max / Durchschnitts-Anzeige**
### 🎨 **Dynamische Farbgebung (Schwellenwerte)**
### ⚖️ **Balancing Indikatoren**
### 📐 **Flexibles Layout (Grid/Liste)**
### ⚙️ **UI-Konfiguration**

<img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card.png" /> <img width="48%" height="auto" alt="image" src="https://github.com/jayjojayson/bms-battery-cells-card/blob/main/docs/bms-battery-cells-card2.png" />

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
    * **BMS Entity:** Die Hauptentität oder Liste der Sensoren.
    * **Voltage Range:** Definiere Min und Max Spannung für die grafische Darstellung.
    * **Colors:** Passe die Farben für niedrige, normale und hohe Spannung an.


---

## YAML-Modus (Alternative)

Obwohl die UI-Konfiguration empfohlen wird, kann die Karte auch manuell über den YAML-Editor konfiguriert werden:

### Optionen

| name                  | typ      | required   | description                                                                                                 | standard                                 |
| --------------------- | -------- | ---------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `type`                | `string` | Yes        | `custom:bms-battery-cells-card`                                                                             |                                          |
| `entity`              | `string` | Yes        | Die Entität des BMS (oder Liste der Zell-Sensoren).                                  		                  |                                          |
| `title`   		   	| `string` | No         | Titel der Karte. 										                                                      | 										                     |
| `min_voltage`         | `number` | No         | Minimale Zellspannung für die Skala (z.B. 2.5V). 									                          | `2.5`                 		        			 |
| `max_voltage`         | `number` | No         | Maximale Zellspannung für die Skala (z.B. 3.65V). 								                          | `3.65`                                   |
| `show_values`         | `boolean`| No         | Zeige die exakten Spannungswerte als Text. 										                          | `true`                                   |
| `show_min_max`	    | `boolean`| No         | Markiere die Zelle mit der niedrigsten/höchsten Spannung.							                  		  | `true`                		        			 |
| `columns` 		    | `number` | No         | Anzahl der Spalten für die Zellen-Anzeige.                                                				  | `4`               			          			 |


### Beispielkonfiguration

Einfaches Beispiel:

```yaml
type: custom:bms-battery-cells-card
entity: sensor.victron_system_battery_voltage
title: Mein Akku
```
Erweitertes Beispiel:

```yaml
type: custom:bms-battery-cells-card
entity: sensor.bms_master_cells
title: DIY LiFePO4
min_voltage: 2.8
max_voltage: 3.6
show_values: true
show_min_max: true
columns: 8
card_mod:
  style: |
    ha-card {
      background: rgba(0,0,0,0.5);
    }
```
