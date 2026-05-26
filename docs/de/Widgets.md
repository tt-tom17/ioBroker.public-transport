# VIS-Widgets

Der Adapter enthält zwei fertige Widgets für [ioBroker VIS](https://github.com/ioBroker/ioBroker.vis), die Abfahrtsdaten und Verbindungsdaten direkt auf einem Dashboard anzeigen. Die Widgets lesen den jeweiligen JSON-Datenpunkt des Adapters und stellen die Informationen als übersichtliche Tabelle dar.

> 🖼️ **Bild fehlt:** Screenshot des Widget-Editors in VIS mit beiden Widgets in der Widget-Palette
> ![Widget-Palette in VIS](Pictures/vis-widget-palette.png)

---

## Voraussetzungen

- ioBroker VIS-Adapter (VIS 1.x)
- Mindestens eine konfigurierte Station oder Verbindung im public-transport-Adapter

---

## Widget 1: Abfahrtstafel

**Name in VIS:** `Departure Table`
**Widget-Kennung:** `tplpublic-transportDepTt`
**Mindestgröße:** 620 × 600 px

Das Widget zeigt Abfahrten einer Station als tabellarische Fahrplananzeige. Als Datenquelle dient der JSON-Datenpunkt der Station.

> 🖼️ **Bild fehlt:** Vorschau der Abfahrtstafel im Live-Betrieb
> ![Abfahrtstafel-Widget](Pictures/widget-deptt-preview.png)

### Konfigurationsparameter

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `headerText` | Text | `Abfahrten` | Überschrift des Widgets |
| `oidDepartures` | Objekt-ID | — | JSON-Datenpunkt der Station, z.B. `public-transport.0.Stations.{id}.json` |
| `maxDepartures` | Zahl (1–50) | `10` | Maximale Anzahl angezeigter Abfahrten |
| `showClock` | Checkbox | `aus` | Aktuelle Uhrzeit im Header anzeigen |
| `remarkHint` | Checkbox | `aus` | Hinweise (gelbes Dreieck) in der Info-Spalte anzeigen |
| `remarkWarning` | Checkbox | `aus` | Warnungen (roter Kreis) in der Info-Spalte anzeigen |
| `remarkStatus` | Checkbox | `aus` | Statusmeldungen (blauer Kreis) in der Info-Spalte anzeigen |
| `useFilter` | Checkbox | `aus` | Verkehrsmittelfilter aus der Adapter-Konfiguration übernehmen |

### Angezeigte Spalten

| Spalte | Inhalt |
|--------|--------|
| Zeit | Tatsächliche Abfahrtszeit (Echtzeit) |
| Linie / Ziel | Linienname mit farbigem Icon + Fahrtrichtung |
| Verspätung | Abweichung in Minuten; „pünktlich" wenn kein Verzug |
| Gleis | Abfahrtsgleis oder -kante; bei Gleisänderung farblich hervorgehoben |
| Info | Nur bei aktivierten Remarks: Icon für Hinweis, Warnung oder Status |

> Klick auf ein Icon in der Info-Spalte öffnet ein Popup mit dem vollständigen Hinweistext.

### Remarks (Info-Spalte)

Wenn mindestens eine der drei Remark-Optionen aktiviert ist, erscheint die Info-Spalte. Die Icons zeigen per Klick den vollständigen Text:

| Icon | Farbe | Bedeutung |
|------|-------|-----------|
| `!` (Kreis) | Rot | Warnung (`type: warning`) |
| `!` (Dreieck) | Gelb | Hinweis (`type: hint`) |
| `i` (Kreis) | Blau | Statusmeldung (`type: status`) |

---

## Widget 2: Verbindungstabelle

**Name in VIS:** `Connections Table`
**Widget-Kennung:** `tplpublic-transportConnections`
**Mindestgröße:** 800 × 600 px

Das Widget zeigt Verbindungsoptionen zwischen zwei Stationen als tabellarische Übersicht. Als Datenquelle dient der JSON-Datenpunkt der Verbindung.

> 🖼️ **Bild fehlt:** Vorschau der Verbindungstabelle im Live-Betrieb
> ![Verbindungstabelle-Widget](Pictures/widget-connections-preview.png)

### Konfigurationsparameter

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|--------------|
| `headerTextConn` | Text | `Verbindungen` | Überschrift des Widgets |
| `oidConnections` | Objekt-ID | — | JSON-Datenpunkt der Verbindung, z.B. `public-transport.0.Journeys.{id}.json` |
| `maxConnections` | Zahl (1–50) | `10` | Maximale Anzahl angezeigter Verbindungen |
| `showClockConn` | Checkbox | `aus` | Aktuelle Uhrzeit im Header anzeigen |

### Angezeigte Spalten

| Spalte | Inhalt |
|--------|--------|
| Abfahrt | Abfahrtszeit am Startbahnhof (Echtzeit) |
| Verspätung (Ab) | Verspätung Abfahrt in Minuten |
| Gleis Ab | Abfahrtsgleis; bei Gleisänderung hervorgehoben |
| Ankunft | Ankunftszeit am Zielbahnhof (Echtzeit) |
| Verspätung (An) | Verspätung Ankunft in Minuten |
| Gleis An | Ankunftsgleis; bei Gleisänderung hervorgehoben |
| Umstiege | Anzahl der Umstiege |
| Info | Icons für Hinweise, Warnungen und Statusmeldungen |

> Klick auf eine Tabellenzeile öffnet ein Modal mit den einzelnen Fahrtabschnitten (Legs), inklusive Zwischenstopps, Gleisinformationen und Fußwegdistanzen.

### Verbindungsdetail-Modal

Das Modal zeigt pro Fahrtabschnitt:
- Verkehrsmittel-Icon mit Linienname und Fahrtrichtung
- Abfahrtszeit und -gleis (inkl. Verspätung)
- Ankunftszeit und -gleis (inkl. Verspätung)
- Bei Fußwegen: Distanz in Metern

---

## Installation der Widgets in VIS

Die Widgets sind automatisch verfügbar, sobald der public-transport-Adapter installiert ist. Sie erscheinen in VIS unter dem Widget-Set **„public-transport"**.

1. VIS-Editor öffnen
2. Einen View auswählen oder neu erstellen
3. Im Widget-Bereich auf **„public-transport"** klicken
4. Das gewünschte Widget per Drag & Drop in den View ziehen
5. In den Widget-Einstellungen die Objekt-ID des JSON-Datenpunkts eintragen

---

## Objekt-IDs für die Widgets

### Abfahrtstafel

Objekt-ID des JSON-Datenpunkts für eine Station:

```
public-transport.0.Stations.{StationsID}.json
```

Beispiel: `public-transport.0.Stations.900350163.json`

### Verbindungstabelle

Objekt-ID des JSON-Datenpunkts für eine Verbindung:

```
public-transport.0.Journeys.{VerbindungsID}.json
```

Beispiel: `public-transport.0.Journeys.home_work.json`

---

## Weiterführende Links

- [Abfahrten konfigurieren](Abfahrten)
- [Verbindungen konfigurieren](Verbindungen)
- [Datenpunkte-Referenz](Datenpunkte)
