# Datenpunkte

Der Adapter legt alle Abfahrts- und Verbindungsdaten als ioBroker-States ab. Die Datenpunkte werden beim ersten Polling-Zyklus automatisch erzeugt und bei jedem folgenden Zyklus aktualisiert.

**Namespace:** `public-transport.X` (wobei `X` die Instanznummer ist)

---

## Übersicht: Hierarchie

```
public-transport.X
├── Stations
│   └── {stationId}             ← eine pro konfigurierter Station
│       ├── json
│       ├── enabled
│       ├── countDepartures
│       └── Departures_00 … Departures_NN
│           ├── Departure, DeparturePlanned, Delay, …
│           ├── Remarks
│           │   ├── Hint, Status, Warning
│           └── Stop
│               ├── Name, Id, Type
└── Journeys
    └── {journeyId}             ← eine pro konfigurierter Verbindung
        ├── json
        ├── enabled
        ├── countJourneys
        ├── StationFrom, StationTo
        └── Journey_00 … Journey_NN
            ├── Arrival, ArrivalPlanned, ArrivalDelay, …
            ├── Departure, DeparturePlanned, DepartureDelay, …
            ├── Changes, DurationMinutes
            └── Leg_00 … Leg_MM
                ├── StationFrom, StationTo
                ├── Line
                ├── Arrival, Departure, …
                ├── Remarks
                └── Distance (nur bei Fußweg)
```

---

## Abfahrten (`Stations`)

### Stations.{stationId}

Der Ordner der Station trägt als `name` den **eigenen Namen** (falls gesetzt) oder den Stationsnamen aus der API.

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `json` | string | json | Rohdaten aller Abfahrten als JSON-String |
| `enabled` | boolean | indicator | Entspricht dem Aktiviert-Schalter in der Konfiguration |
| `countDepartures` | number | value | Anzahl der Abfahrten, die die API zurückgemeldet hat |

> `enabled` dient auch als `statusStates.onlineId` — ioBroker zeigt den Verbindungsstatus der Station in der Objektliste.

---

### Departures_00 … Departures_NN

Pro konfigurierter Abfahrt (0 bis Anzahl–1) wird ein Channel `Departures_XX` angelegt (zweistellig mit führender Null: `Departures_00`, `Departures_01`, …).

#### Direkte States im Channel

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `Departure` | string | date | Tatsächliche (prognostizierte) Abfahrtszeit als ISO-String |
| `DeparturePlanned` | string | date | Geplante Abfahrtszeit als ISO-String |
| `Delay` | number | time | Verspätung in **Sekunden** (0 wenn keine Daten) |
| `DepartureDelayed` | boolean | indicator | `true` wenn Verspätung > konfigurierter Delay-Offset |
| `DepartureOnTime` | boolean | indicator | `true` wenn Verspätung ≤ konfigurierter Delay-Offset |
| `Platform` | string | text | Tatsächliches Gleis / Steig |
| `PlatformPlanned` | string | text | Geplantes Gleis / Steig |
| `Direction` | string | text | Fahrtrichtung (Endstation) |
| `Name` | string | text | Linienname (z.B. `S1`, `U7`, `RE3`) |
| `Product` | string | text | Produkt-Schlüssel (z.B. `suburban`, `bus`) |
| `ProductName` | string | text | Produktname wie vom Dienst geliefert (z.B. `S`, `RE`) |
| `Operator` | string | text | Betreiber der Linie |
| `Mode` | string | text | Fahrzeugtyp laut HAFAS-Standard (z.B. `train`, `bus`) |

> **Hinweis zu `DepartureDelayed` / `DepartureOnTime`:** Die Schwelle basiert auf dem **Delay-Offset** aus den Einstellungen (Standard: 2 Minuten = 120 Sekunden). Liegt die Verspätung innerhalb des Offsets, gilt die Abfahrt als pünktlich.

#### Remarks (Hinweise)

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `Remarks.Hint` | string | text | Alle Hinweise der Abfahrt (zusammengefasst) |
| `Remarks.Status` | string | text | Statusmeldungen (zusammengefasst) |
| `Remarks.Warning` | string | text | Warnungen (zusammengefasst) |

#### Stop (Haltepunkt-Infos)

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `Stop.Name` | string | text | Name des tatsächlichen Haltepunkts (kann Teilhaltestelle sein) |
| `Stop.Id` | string | text | ID des Haltepunkts |
| `Stop.Type` | string | text | Typ (z.B. `stop`, `station`) |

---

## Verbindungen (`Journeys`)

### Journeys.{journeyId}

Der Ordner der Verbindung trägt als `name` den **Verbindungsnamen** aus der Konfiguration.

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `json` | string | json | Rohdaten aller Verbindungsoptionen als JSON-String |
| `enabled` | boolean | indicator | Entspricht dem Aktiviert-Schalter in der Konfiguration |
| `countJourneys` | number | value | Anzahl der Verbindungsoptionen, die die API zurückgemeldet hat |

#### StationFrom / StationTo

Unter `Journeys.{journeyId}.StationFrom` und `StationTo` werden die vollständigen Stationsdaten der Start- und Zielstation der gesamten Verbindung gespeichert (einmalig pro Verbindungs-ID, nicht je Verbindungsoption).

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `JSON` | string (json) | Rohdaten der Station |
| `Name` | string | Stationsname |
| `Type` | string | Stationstyp (z.B. `station`, `stop`) |
| `ID` | string | Stations-ID |

---

### Journey_00 … Journey_NN

Pro Verbindungsoption (0 bis Anzahl–1) wird ein Channel `Journey_XX` angelegt.

#### Zusammenfassende States der Verbindung

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `json` | string | json | Rohdaten der Verbindungsoption als JSON-String |
| `Arrival` | string | date | Ankunftszeit (letzte Teilstrecke, tatsächlich/prognostiziert) |
| `ArrivalPlanned` | string | date | Geplante Ankunftszeit |
| `ArrivalDelay` | number | time | Ankunftsverspätung in Sekunden |
| `ArrivalDelayed` | boolean | indicator | `true` wenn Ankunft verspätet (> Delay-Offset) |
| `ArrivalOnTime` | boolean | indicator | `true` wenn Ankunft pünktlich (≤ Delay-Offset) |
| `Departure` | string | date | Abfahrtszeit (erste Teilstrecke, tatsächlich/prognostiziert) |
| `DeparturePlanned` | string | date | Geplante Abfahrtszeit |
| `DepartureDelay` | number | time | Abfahrtsverspätung in Sekunden |
| `DepartureDelayed` | boolean | indicator | `true` wenn Abfahrt verspätet |
| `DepartureOnTime` | boolean | indicator | `true` wenn Abfahrt pünktlich |
| `Changes` | number | value | Anzahl der Umstiege (Fußwege zwischen Teilstrecken) |
| `DurationMinutes` | number | value | Gesamtfahrtdauer in Minuten |

---

### Leg_00 … Leg_MM

Jede Verbindungsoption besteht aus einer oder mehreren Teilstrecken (`Leg_XX`). Fußwege zwischen zwei Teilstrecken werden ebenfalls als eigenes Leg gespeichert.

#### Direkte States im Leg-Channel

Für **reguläre Teilstrecken** (kein Fußweg) stehen folgende States zur Verfügung:

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `json` | string | json | Rohdaten der Teilstrecke |
| `Arrival` | string | date | Ankunftszeit an der Zielstation |
| `ArrivalPlanned` | string | date | Geplante Ankunftszeit |
| `ArrivalDelay` | number | time | Ankunftsverspätung in Sekunden |
| `ArrivalDelayed` | boolean | indicator | Ankunft verspätet? |
| `ArrivalOnTime` | boolean | indicator | Ankunft pünktlich? |
| `Departure` | string | date | Abfahrtszeit an der Startstation |
| `DeparturePlanned` | string | date | Geplante Abfahrtszeit |
| `DepartureDelay` | number | time | Abfahrtsverspätung in Sekunden |
| `DepartureDelayed` | boolean | indicator | Abfahrt verspätet? |
| `DepartureOnTime` | boolean | indicator | Abfahrt pünktlich? |
| `Reachable` | boolean | indicator | Umstieg erreichbar? |

Für **Fußwege** (`walking = true`) stehen **nur** folgende States zur Verfügung:

| Datenpunkt | Typ | Rolle | Beschreibung |
|-----------|-----|-------|--------------|
| `json` | string | json | Rohdaten des Fußwegs |
| `Distance` | number | value.distance | Distanz in Metern |

#### StationFrom / StationTo (innerhalb eines Legs)

Pro Leg werden Start- und Zielstation als eigene Channels gespeichert. Bei Fußwegen wird nur `StationFrom` angelegt.

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `JSON` | string (json) | Rohdaten der Station |
| `Name` | string | Stationsname |
| `Type` | string | Stationstyp |
| `ID` | string | Stations-ID |
| `Platform` | string | Tatsächliches Gleis/Steig |
| `PlatformPlanned` | string | Geplantes Gleis/Steig |

#### Line (Linie innerhalb eines Legs)

Nur bei regulären Teilstrecken (nicht bei Fußwegen):

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `Direction` | string | Fahrtrichtung (Endstation) |
| `Product` | string | Produkt-Schlüssel |
| `Mode` | string | Fahrzeugtyp |
| `Name` | string | Linienname |
| `Operator` | string | Betreiber |
| `ProductName` | string | Produktname |

#### Remarks (Hinweise innerhalb eines Legs)

Nur bei regulären Teilstrecken:

| Datenpunkt | Typ | Beschreibung |
|-----------|-----|--------------|
| `Remarks.Hints` | string | Hinweise (zusammengefasst) |
| `Remarks.Warnings` | string | Warnungen (zusammengefasst) |
| `Remarks.Status` | string | Statusmeldungen (zusammengefasst) |

---

## Datenpfade im Überblick

```
public-transport.0.Stations.900350163
public-transport.0.Stations.900350163.json
public-transport.0.Stations.900350163.enabled
public-transport.0.Stations.900350163.countDepartures
public-transport.0.Stations.900350163.Departures_00.Departure
public-transport.0.Stations.900350163.Departures_00.DeparturePlanned
public-transport.0.Stations.900350163.Departures_00.Delay
public-transport.0.Stations.900350163.Departures_00.DepartureDelayed
public-transport.0.Stations.900350163.Departures_00.DepartureOnTime
public-transport.0.Stations.900350163.Departures_00.Platform
public-transport.0.Stations.900350163.Departures_00.PlatformPlanned
public-transport.0.Stations.900350163.Departures_00.Direction
public-transport.0.Stations.900350163.Departures_00.Name
public-transport.0.Stations.900350163.Departures_00.Product
public-transport.0.Stations.900350163.Departures_00.ProductName
public-transport.0.Stations.900350163.Departures_00.Operator
public-transport.0.Stations.900350163.Departures_00.Mode
public-transport.0.Stations.900350163.Departures_00.Remarks.Hint
public-transport.0.Stations.900350163.Departures_00.Remarks.Status
public-transport.0.Stations.900350163.Departures_00.Remarks.Warning
public-transport.0.Stations.900350163.Departures_00.Stop.Name
public-transport.0.Stations.900350163.Departures_00.Stop.Id
public-transport.0.Stations.900350163.Departures_00.Stop.Type

public-transport.0.Journeys.home_work
public-transport.0.Journeys.home_work.json
public-transport.0.Journeys.home_work.enabled
public-transport.0.Journeys.home_work.countJourneys
public-transport.0.Journeys.home_work.StationFrom.Name
public-transport.0.Journeys.home_work.StationTo.Name
public-transport.0.Journeys.home_work.Journey_00.Arrival
public-transport.0.Journeys.home_work.Journey_00.ArrivalPlanned
public-transport.0.Journeys.home_work.Journey_00.ArrivalDelay
public-transport.0.Journeys.home_work.Journey_00.ArrivalDelayed
public-transport.0.Journeys.home_work.Journey_00.ArrivalOnTime
public-transport.0.Journeys.home_work.Journey_00.Departure
public-transport.0.Journeys.home_work.Journey_00.DeparturePlanned
public-transport.0.Journeys.home_work.Journey_00.DepartureDelay
public-transport.0.Journeys.home_work.Journey_00.DepartureDelayed
public-transport.0.Journeys.home_work.Journey_00.DepartureOnTime
public-transport.0.Journeys.home_work.Journey_00.Changes
public-transport.0.Journeys.home_work.Journey_00.DurationMinutes
public-transport.0.Journeys.home_work.Journey_00.Leg_00.StationFrom.Name
public-transport.0.Journeys.home_work.Journey_00.Leg_00.StationTo.Name
public-transport.0.Journeys.home_work.Journey_00.Leg_00.Line.Name
public-transport.0.Journeys.home_work.Journey_00.Leg_00.Departure
public-transport.0.Journeys.home_work.Journey_00.Leg_00.Arrival
public-transport.0.Journeys.home_work.Journey_00.Leg_00.Remarks.Hints
public-transport.0.Journeys.home_work.Journey_00.Leg_01.Distance  ← Fußweg
```

---

## Weiterführende Seiten

- [Abfahrten](Abfahrten) — Stationskonfiguration im Admin-Tab
- [Verbindungen](Verbindungen) — Verbindungskonfiguration im Admin-Tab
- [NSPanel-Integration](NSPanel) — Zusätzliche Datenpunkte für NSPanel
