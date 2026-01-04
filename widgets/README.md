# ioBroker.vis Widgets für public-transport

## Abfahrtstafel Widget (Departure Table)

Ein Widget zur Anzeige von Abfahrten im Stil einer deutschen Bahnhofsanzeige.

### Features

- **Bahnhofs-Design**: Authentisches Design im Stil einer digitalen Bahnhofsanzeige
  - Schwarzer Hintergrund mit gelber Schrift
  - Grüne Zeitanzeige
  - Farbcodierte Verkehrsmittel (Bus, Tram, S-Bahn, U-Bahn, Zug)
  
- **Echtzeit-Informationen**:
  - Abfahrtszeit
  - Linie und Ziel
  - Verspätung (farblich markiert: grün = pünktlich, rot = verspätet)
  - Gleis/Bahnsteig
  - Ausfall-Informationen

- **Konfigurierbar**:
  - Anpassbare Überschrift
  - Maximale Anzahl anzuzeigender Abfahrten
  - Optional: Uhr-Anzeige
  - Konfigurierbares Aktualisierungsintervall

### Installation

Die Widget-Dateien befinden sich in:
```
widgets/
├── pub-trans.html          # Widget-Definition
└── pub_trans/
    ├── css/
    │   └── style-deptt.css  # Styling der Abfahrtstafel
    └── js/
        └── deptt.js         # Widget-Logik
```

### Verwendung

1. **In ioBroker.vis**:
   - Öffnen Sie Ihr Vis-Projekt
   - Fügen Sie das Widget "Departure Table" aus dem Widget-Set "pub_trans" hinzu

2. **Konfiguration**:
   - **Überschrift**: Titel der Abfahrtstafel (z.B. "Hauptbahnhof")
   - **Abfahrten Objekt ID**: Datenpunkt mit den Abfahrtsinformationen
   - **Max. Abfahrten**: Anzahl der anzuzeigenden Einträge (Standard: 10)
   - **Uhr anzeigen**: Zeigt aktuelle Uhrzeit im Header an
   - **Aktualisierungsintervall**: Intervall in Sekunden (Standard: 30)

### Datenformat

Das Widget erwartet Daten im folgenden JSON-Format:

```json
[
  {
    "when": "2026-01-04T15:30:00+01:00",
    "line": "S1",
    "direction": "Flughafen",
    "delay": 5,
    "platform": "3",
    "cancelled": false,
    "product": "sbahn"
  },
  {
    "when": "2026-01-04T15:35:00+01:00",
    "line": "U2",
    "direction": "Messegelände",
    "delay": 0,
    "platform": "2",
    "cancelled": false,
    "product": "subway"
  }
]
```

**Unterstützte Felder**:
- `when` / `time` / `scheduledWhen`: Abfahrtszeit (ISO-Format oder HH:MM)
- `line` / `lineName` / `number`: Linienbezeichnung
- `direction` / `destination`: Fahrtrichtung/Ziel
- `delay`: Verspätung in Minuten (optional)
- `platform` / `track`: Gleis/Bahnsteig (optional)
- `cancelled`: Ausfall (boolean, optional)
- `product` / `productName`: Verkehrsmittel-Typ (optional)

**Unterstützte Verkehrsmittel-Typen**:
- `bus` - Bus (magenta)
- `tram` / `straßenbahn` - Straßenbahn (rot)
- `subway` / `ubahn` / `u-bahn` - U-Bahn (blau)
- `sbahn` / `s-bahn` - S-Bahn (grün)
- `train` - Zug (weiß mit rotem Rand)

### Integration mit ioBroker.public-transport

Dieses Widget ist perfekt geeignet zur Anzeige von Daten aus dem ioBroker.public-transport Adapter:

1. Konfigurieren Sie im Adapter Ihre gewünschten Haltestellen
2. Der Adapter erstellt Datenpunkte mit Abfahrtsinformationen
3. Verbinden Sie den entsprechenden Datenpunkt mit dem Widget

### Styling

Das Widget verwendet folgende CSS-Klassen, die bei Bedarf überschrieben werden können:

- `.pub-trans-deptt-container` - Hauptcontainer
- `.pub-trans-deptt-header` - Header-Bereich
- `.pub-trans-deptt-row` - Einzelne Abfahrtszeile
- `.pub-trans-deptt-line-icon` - Linienicon
  - `.bus`, `.tram`, `.subway`, `.train`, `.sbahn` - Spezifische Verkehrsmittel

### Lizenz

Copyright 2026 tt-tom17 tgb@kabelmail.de

### Version

0.0.1 - Erste Version mit Bahnhofs-Design
