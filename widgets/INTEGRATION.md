# Integrationsanleitung - Abfahrtstafel Widget

## Verwendung mit ioBroker.public-transport Adapter

### 1. Adapter konfigurieren

Im ioBroker.public-transport Adapter:
- Konfigurieren Sie Ihre gewünschte Haltestelle
- Der Adapter erstellt automatisch Datenpunkte mit Abfahrtsinformationen
- Typischer Pfad: `public-transport.0.Haltestelle.departures`

### 2. Widget in ioBroker.vis hinzufügen

1. Öffnen Sie Ihr Vis-Projekt
2. Wählen Sie "Widget hinzufügen"
3. Suchen Sie nach "pub_trans" im Widget-Set
4. Ziehen Sie "Departure Table" auf Ihre View

### 3. Widget konfigurieren

Im Widget-Editor:

**Basiskonfiguration:**
- **headerText**: "Hauptbahnhof" (oder Ihre Haltestelle)
- **oidDepartures**: Object-ID des Abfahrten-Datenpunkts (z.B. `public-transport.0.Haltestelle.departures`)
- **maxDepartures**: 10 (Anzahl der anzuzeigenden Abfahrten)
- **showClock**: ☑️ aktivieren (zeigt Uhrzeit im Header)
- **updateInterval**: 30 (Sekunden zwischen Aktualisierungen)

**Widget-Größe anpassen:**
- Empfohlene Breite: 800px
- Empfohlene Höhe: 600px (kann je nach Anzahl Abfahrten angepasst werden)

### 4. Datenformat vom Adapter

Der ioBroker.public-transport Adapter sollte Daten in folgendem Format liefern:

```javascript
[
  {
    "when": "2026-01-04T15:30:00+01:00",  // Abfahrtszeit
    "line": "S1",                          // Linie
    "direction": "Flughafen",              // Richtung/Ziel
    "delay": 5,                            // Verspätung in Minuten
    "platform": "3",                       // Gleis/Bahnsteig
    "cancelled": false,                    // Ausfall ja/nein
    "product": "sbahn"                     // Verkehrsmittel-Typ
  }
]
```

### 5. Datenpunkt-Mapping

Falls der Adapter andere Feldnamen verwendet, unterstützt das Widget folgende Alternativen:

| Widget-Feld | Alternative Feldnamen |
|------------|----------------------|
| `when` | `time`, `scheduledWhen` |
| `line` | `lineName`, `number` |
| `direction` | `destination` |
| `platform` | `track` |
| `product` | `productName` |

### 6. Verkehrsmittel-Typen

Das Widget erkennt automatisch folgende Typen (Groß-/Kleinschreibung egal):

- **Bus**: Enthält "bus" → Magenta
- **Straßenbahn**: Enthält "tram" oder "straßenbahn" → Rot
- **U-Bahn**: Enthält "ubahn", "u-bahn" oder "subway" → Blau
- **S-Bahn**: Enthält "sbahn" oder "s-bahn" → Grün
- **Zug**: Standard/Rest → Weiß mit rotem Rand

### 7. Beispiel-Script zur Datenkonvertierung

Falls Sie Daten aus einer anderen Quelle haben:

```javascript
// Beispiel: Datenkonvertierung im Script-Adapter
const rawData = getState('anderesSystem.daten').val;
const departures = rawData.map(dep => ({
    when: dep.departureTime,
    line: dep.trainNumber,
    direction: dep.destination,
    delay: dep.delayMinutes || 0,
    platform: dep.trackNumber,
    cancelled: dep.isCancelled || false,
    product: dep.vehicleType
}));

setState('public-transport.0.converted.departures', JSON.stringify(departures));
```

### 8. Troubleshooting

**Problem: Keine Daten werden angezeigt**
- Prüfen Sie, ob der Datenpunkt existiert: Admin → Objekte
- Überprüfen Sie das Datenformat: Sollte JSON-Array sein
- Schauen Sie in die Browser-Konsole (F12) nach Fehlermeldungen

**Problem: Zeiten werden nicht korrekt angezeigt**
- Daten sollten ISO-8601 Format haben: `2026-01-04T15:30:00+01:00`
- Alternativ: HH:MM Format wie `15:30`

**Problem: Farben der Verkehrsmittel stimmen nicht**
- Prüfen Sie das `product` Feld in den Daten
- Feld sollte einen der erkannten Typen enthalten (siehe Punkt 6)

### 9. Anpassungen

**CSS überschreiben:**
Fügen Sie in Vis unter "CSS" folgendes hinzu:

```css
/* Beispiel: Andere Hintergrundfarbe */
.pub-trans-deptt-container {
    background-color: #2a2a2a !important;
}

/* Beispiel: Andere Schriftgröße */
.pub-trans-deptt-row {
    font-size: 16px !important;
}
```

**JavaScript-Erweiterung:**
Bearbeiten Sie `/widgets/pub_trans/js/deptt.js` für erweiterte Funktionen.

### 10. Demo

Öffnen Sie `/widgets/demo.html` im Browser für eine Vorschau ohne ioBroker.

---

**Support & Feedback:**
Bei Fragen oder Problemen erstellen Sie bitte ein Issue auf GitHub.
