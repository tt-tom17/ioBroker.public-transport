# NSPanel-Integration

Der Adapter unterstützt eine direkte Integration mit dem [**ioBroker NSPanel Lovelace UI Adapter**](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui). Wenn aktiviert, legt der public-transport-Adapter zusätzliche Datenpunkte in einem Format an, das der NSPanel-Adapter direkt als Fahrplananzeige lesen kann.

---

## Voraussetzungen

- [ioBroker NSPanel Lovelace UI Adapter](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui) muss installiert und konfiguriert sein
- NSPanel-Hardware (Sonoff NSPanel)
- Der **„Channel für NSPanel"**-Schalter muss in der jeweiligen Station oder Verbindung aktiviert sein

---

## Aktivierung

Der NSPanel-Channel wird pro Station und pro Verbindung individuell aktiviert:

**Für Stationen:** In der [Abfahrten](Abfahrten)-Konfiguration den Schalter **„Channel für NSPanel (Adapter)"** aktivieren.

**Für Verbindungen:** In der [Verbindungen](Verbindungen)-Konfiguration den Schalter **„Channel für NSPanel (Adapter)"** aktivieren.

Beim nächsten Polling-Zyklus werden die NSPanel-Channels automatisch angelegt.

---

## Angelegte Datenpunkte

### Abfahrten: `nspanelDep{N}`

Unterhalb jedes `Departures_XX`-Channels wird ein zusätzlicher Channel `nspanelDep{N}` mit der Rolle `timeTable` angelegt. Der Index `N` entspricht dem numerischen Index der Abfahrt (**ohne** führende Null: `nspanelDep0`, `nspanelDep1`, …).

**Pfad:** `public-transport.0.Stations.{stationId}.Departures_00.nspanelDep0`

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `ACTUAL` | string (date) | Tatsächliche (prognostizierte) Abfahrtszeit |
| `VEHICLE` | string | Fahrzeugtyp (`line.mode`, z.B. `train`, `bus`) |
| `DEPARTURE` | string (date) | Geplante Abfahrtszeit |
| `DELAY` | number | Verspätung in Sekunden |
| `DIRECTION` | string | Fahrtrichtung (Endstation) |

### Verbindungen: `nspanelJourney{N}`

Unterhalb jedes `Journey_XX`-Channels wird ein zusätzlicher Channel `nspanelJourney{N}` mit der Rolle `timeTable` angelegt. Der Index `N` entspricht dem numerischen Index der Verbindungsoption (**ohne** führende Null: `nspanelJourney0`, `nspanelJourney1`, …).

**Pfad:** `public-transport.0.Journeys.{journeyId}.Journey_00.nspanelJourney0`

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `ACTUAL` | string (date) | Ist-Abfahrtszeit des ersten Legs |
| `VEHICLE` | string | Fahrzeugtyp des ersten Fahrzeug-Legs (nicht Fußweg) |
| `DEPARTURE` | string (date) | Geplante Abfahrtszeit des ersten Legs |
| `DELAY` | number | Abfahrtsverspätung des ersten Legs in Sekunden |
| `DIRECTION` | string | Name der Zielstation (letztes Leg) |

---

## Hinweise

- Die NSPanel-Channels werden **nur** angelegt, wenn der entsprechende Schalter in der Station/Verbindung aktiv ist. Ist der Schalter nicht aktiv, entstehen keine `nspanelDep*`- oder `nspanelJourney*`-Datenpunkte.
- Die Channels werden bei jedem Polling-Zyklus aktualisiert (nicht nur beim ersten Lauf).
- Der NSPanel Lovelace UI Adapter liest die Datenpunkte selbstständig aus. Es ist keine weitere Konfiguration im public-transport-Adapter nötig, sobald der Channel aktiviert ist.
- Vollständige Datenpunktübersicht: [Datenpunkte](Datenpunkte#nspanel-datenpunkte)

---

## Weiterführende Seiten

- [Abfahrten](Abfahrten) — NSPanel-Schalter in der Stationskonfiguration
- [Verbindungen](Verbindungen) — NSPanel-Schalter in der Verbindungskonfiguration
- [Datenpunkte](Datenpunkte) — Vollständige Datenpunktstruktur
