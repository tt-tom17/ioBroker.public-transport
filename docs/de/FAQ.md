# Häufig gestellte Fragen (FAQ)

---

## Allgemein

### Welcher Dienst ist für meine Region geeignet?

| Region | Empfohlener Dienst/Profil |
|--------|--------------------------|
| Deutschland (DB, IC, ICE, Regionalzüge) | `Vendo (DB)` |
| Berlin & Brandenburg (BVG, S-Bahn) | `HAFAS – VBB` |
| Österreich (ÖBB) | `HAFAS – ÖBB` |
| Norddeutschland (VBN, Bremen/Niedersachsen) | `HAFAS – VBN` |
| Andere Regionen (experimentell) | `MOTIS Transitous (compat)` |

Weitere Details: [Transportdienste](Dienste)

---

### Wie viele Stationen und Verbindungen kann ich konfigurieren?

Es gibt keine fest codierte Obergrenze. Die Anzahl ist praktisch durch die Systemressourcen und das Abfrageintervall begrenzt. Jede Station und Verbindung erzeugt einen eigenen API-Aufruf pro Abfragezyklus.

---

### Kann ich mehrere Instanzen des Adapters betreiben?

Ja. Mehrere Instanzen sind möglich und sinnvoll, wenn verschiedene Dienste (z.B. HAFAS und Vendo gleichzeitig) genutzt werden sollen, da pro Instanz nur ein Dienst konfiguriert wird.

---

### Welche Node.js-Version ist erforderlich?

Node.js ≥ 22 sowie js-controller ≥ 7.0.6 sind erforderlich. Ältere Versionen werden nicht unterstützt.

---

## Abfahrten

### Warum werden keine Abfahrten angezeigt (`countDepartures` = 0)?

Mögliche Ursachen:

1. **Haltestellen-ID nicht gefunden** — Die eingegebene ID oder der Suchbegriff liefert keine Ergebnisse. Prüfe die ID über die Haltestellensuche in der Adapter-Konfiguration.
2. **Verkehrsmittelfilter zu restriktiv** — Alle verfügbaren Verkehrsmittel sind deaktiviert. Aktiviere zumindest eines.
3. **Zeitversatz zu groß** — Der eingestellte Zeitversatz (Minuten) liegt jenseits der verfügbaren Abfahrten im Abfragezeitraum. Reduziere den Zeitversatz oder erhöhe den Abfragezeitraum.
4. **API nicht erreichbar** — Die API des gewählten Dienstes ist vorübergehend nicht verfügbar. Prüfe das Adapter-Log auf Fehlermeldungen.
5. **Adapter gestoppt** — Prüfe im ioBroker Admin, ob der Adapter läuft (grünes Symbol).

---

### Was bedeutet der Wert im Datenpunkt `Delay`?

Der Verzögerungswert wird in **Sekunden** angegeben. Ein Wert von `120` bedeutet 2 Minuten Verspätung. Negative Werte bedeuten, dass das Fahrzeug früher als geplant fährt.

---

### Was ist der Unterschied zwischen `Departure` und `DeparturePlanned`?

- `Departure` — tatsächliche (Echtzeit-)Abfahrtszeit; enthält die Verspätung
- `DeparturePlanned` — planmäßige Abfahrtszeit laut Fahrplan

Wenn keine Echtzeit-Daten verfügbar sind, entspricht `Departure` der geplanten Zeit.

---

### Wie funktioniert der Zeitversatz?

Der Zeitversatz filtert Abfahrten, die in weniger als N Minuten stattfinden. Nützlich, wenn der Weg zur Haltestelle einige Minuten dauert und Abfahrten, die man nicht mehr erreichen kann, ausgeblendet werden sollen.

Beispiel: Zeitversatz = 5 → Es werden nur Abfahrten angezeigt, die in mindestens 5 Minuten stattfinden.

---

### Warum fehlt der `Operator`-Datenpunkt manchmal?

Nicht alle Dienste und Profile liefern Betreiberinformationen. Wenn die API keinen Betreiber zurückmeldet, bleibt der Datenpunkt leer.

---

## Verbindungen

### Warum werden keine Verbindungen gefunden?

1. **Start- oder Zielstation nicht konfiguriert** — Verbindungen benötigen mindestens eine konfigurierte Abfahrtsstation als Quelle. Prüfe, ob die gewählten Stationen im Tab „Abfahrten" vorhanden sind.
2. **Kein Dienst mit Verbindungssuche** — Verbindungssuche (Journeys) wird nur von Diensten unterstützt, die diese Funktion anbieten. MOTIS Transitous hat ggf. eingeschränkte Unterstützung.
3. **Gleiche Start- und Zielstation** — Start und Ziel müssen unterschiedliche Stationen sein.

---

### Was ist der Unterschied zwischen `Leg` und `Journey`?

- **Journey** — die gesamte Verbindung von A nach B
- **Leg** — ein einzelner Fahrtabschnitt innerhalb der Journey (z.B. eine U-Bahn-Fahrt oder ein Fußweg zum Umstieg)

---

## VIS-Widgets

### Welche VIS-Version wird unterstützt?

Die Widgets wurden für **ioBroker VIS 1.x** entwickelt. VIS 2.x ist nicht getestet und wird aktuell nicht offiziell unterstützt.

---

### Das Widget zeigt „Lade Daten" und ändert sich nicht

1. Prüfe, ob die eingetragene Objekt-ID korrekt ist (JSON-Datenpunkt der Station/Verbindung, z.B. `public-transport.0.Stations.{id}.json`).
2. Prüfe, ob der Adapter läuft und der JSON-Datenpunkt gültige Daten enthält.
3. Stelle sicher, dass VIS Zugriff auf den ioBroker-State hat.

---

### Kann ich das Layout der Widgets anpassen?

Die Widgets unterstützen die Standard-VIS-CSS-Klassen. Eigene Anpassungen können über das CSS-Feld im VIS-Editor vorgenommen werden. Die Klassen-Präfixe sind `pub-trans-deptt-*` (Abfahrtstafel) bzw. `pub-trans-conn-*` (Verbindungstabelle).

---

## NSPanel Lovelace UI

### Welchen Adapter benötige ich für die NSPanel-Integration?

Den [NSPanel Lovelace UI Adapter](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui). Dieser muss separat installiert und konfiguriert werden.

---

### Wie aktiviere ich die NSPanel-Kanäle?

Den **„Channel für NSPanel"**-Schalter in der jeweiligen Stations- oder Verbindungskonfiguration aktivieren. Die Datenpunkte werden beim nächsten Abfragezyklus automatisch angelegt.

Details: [NSPanel-Integration](NSPanel)

---

## Weitere Hilfe

- [Konfiguration](Konfiguration)
- [Abfahrten](Abfahrten)
- [Verbindungen](Verbindungen)
- [Transportdienste](Dienste)
