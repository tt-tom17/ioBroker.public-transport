# Datapoints

The adapter stores all departure and journey data as ioBroker states. Datapoints are created automatically during the first polling cycle and updated on every subsequent cycle.

**Namespace:** `public-transport.X` (where `X` is the instance number)

---

## Overview: Hierarchy

```
public-transport.X
├── Stations
│   └── {stationId}             ← one per configured stop
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
    └── {journeyId}             ← one per configured journey
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
                └── Distance (walking legs only)
```

---

## Departures (`Stations`)

### Stations.{stationId}

The station folder uses the **custom name** (if set) or the station name from the API as its `name`.

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `json` | string | json | Raw data of all departures as JSON string |
| `enabled` | boolean | indicator | Matches the "Enabled" toggle in the configuration |
| `countDepartures` | number | value | Number of departures returned by the API |

> `enabled` is also used as `statusStates.onlineId` — ioBroker shows the connection status of the stop in the object list.

---

### Departures_00 … Departures_NN

For each configured departure (0 to count–1), a channel `Departures_XX` is created (two digits with leading zero: `Departures_00`, `Departures_01`, …).

#### Direct states in the channel

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `Departure` | string | date | Actual (forecasted) departure time as ISO string |
| `DeparturePlanned` | string | date | Planned departure time as ISO string |
| `Delay` | number | time | Delay in **seconds** (0 if no data) |
| `DepartureDelayed` | boolean | indicator | `true` if delay > configured delay offset |
| `DepartureOnTime` | boolean | indicator | `true` if delay ≤ configured delay offset |
| `Platform` | string | text | Actual platform/track |
| `PlatformPlanned` | string | text | Planned platform/track |
| `Direction` | string | text | Destination (direction) |
| `Name` | string | text | Line name (e.g. `S1`, `U7`, `RE3`) |
| `Product` | string | text | Product key (e.g. `suburban`, `bus`) |
| `ProductName` | string | text | Product name as provided by the service (e.g. `S`, `RE`) |
| `Operator` | string | text | Operator of the line |
| `Mode` | string | text | Vehicle type per HAFAS standard (e.g. `train`, `bus`) |

> **Note on `DepartureDelayed` / `DepartureOnTime`:** The threshold is based on the **delay offset** from settings (default: 2 minutes = 120 seconds). If the delay is within the offset, the departure is considered on time.

#### Remarks

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `Remarks.Hint` | string | text | All hints for the departure (combined) |
| `Remarks.Status` | string | text | Status messages (combined) |
| `Remarks.Warning` | string | text | Warnings (combined) |

#### Stop (stop-point info)

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `Stop.Name` | string | text | Name of the actual stop point (can be a sub-stop) |
| `Stop.Id` | string | text | Stop point ID |
| `Stop.Type` | string | text | Type (e.g. `stop`, `station`) |

---

## Journeys (`Journeys`)

### Journeys.{journeyId}

The journey folder uses the **journey name** from the configuration as its `name`.

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `json` | string | json | Raw data of all journey options as JSON string |
| `enabled` | boolean | indicator | Matches the "Enabled" toggle in the configuration |
| `countJourneys` | number | value | Number of journey options returned by the API |

#### StationFrom / StationTo

Under `Journeys.{journeyId}.StationFrom` and `StationTo`, the full station data for the start and destination of the overall journey are stored (once per journey ID, not per option).

| Datapoint | Type | Description |
|----------|------|-------------|
| `JSON` | string (json) | Raw station data |
| `Name` | string | Station name |
| `Type` | string | Station type (e.g. `station`, `stop`) |
| `ID` | string | Station ID |

---

### Journey_00 … Journey_NN

For each journey option (0 to count–1), a channel `Journey_XX` is created.

#### Summary states of the journey

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `json` | string | json | Raw data of the journey option as JSON string |
| `Arrival` | string | date | Arrival time (last leg, actual/forecasted) |
| `ArrivalPlanned` | string | date | Planned arrival time |
| `ArrivalDelay` | number | time | Arrival delay in seconds |
| `ArrivalDelayed` | boolean | indicator | `true` if arrival is delayed (> delay offset) |
| `ArrivalOnTime` | boolean | indicator | `true` if arrival is on time (≤ delay offset) |
| `Departure` | string | date | Departure time (first leg, actual/forecasted) |
| `DeparturePlanned` | string | date | Planned departure time |
| `DepartureDelay` | number | time | Departure delay in seconds |
| `DepartureDelayed` | boolean | indicator | `true` if departure is delayed |
| `DepartureOnTime` | boolean | indicator | `true` if departure is on time |
| `Changes` | number | value | Number of transfers (walking legs between sections) |
| `DurationMinutes` | number | value | Total journey duration in minutes |

---

### Leg_00 … Leg_MM

Each journey option consists of one or more legs (`Leg_XX`). Walking transfers between legs are also stored as their own leg.

#### Direct states in the leg channel

For **regular legs** (not walking):

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `json` | string | json | Raw leg data |
| `Arrival` | string | date | Arrival time at destination |
| `ArrivalPlanned` | string | date | Planned arrival time |
| `ArrivalDelay` | number | time | Arrival delay in seconds |
| `ArrivalDelayed` | boolean | indicator | Arrival delayed? |
| `ArrivalOnTime` | boolean | indicator | Arrival on time? |
| `Departure` | string | date | Departure time at origin |
| `DeparturePlanned` | string | date | Planned departure time |
| `DepartureDelay` | number | time | Departure delay in seconds |
| `DepartureDelayed` | boolean | indicator | Departure delayed? |
| `DepartureOnTime` | boolean | indicator | Departure on time? |
| `Reachable` | boolean | indicator | Transfer reachable? |

For **walking legs** (`walking = true`), **only** these states are available:

| Datapoint | Type | Role | Description |
|----------|------|------|-------------|
| `json` | string | json | Raw walking leg data |
| `Distance` | number | value.distance | Distance in meters |

#### StationFrom / StationTo (within a leg)

Start and destination stations are stored as separate channels per leg. Walking legs only have `StationFrom`.

| Datapoint | Type | Description |
|----------|------|-------------|
| `JSON` | string (json) | Raw station data |
| `Name` | string | Station name |
| `Type` | string | Station type |
| `ID` | string | Station ID |
| `Platform` | string | Actual platform/track |
| `PlatformPlanned` | string | Planned platform/track |

#### Line (within a leg)

Only for regular legs (not walking):

| Datapoint | Type | Description |
|----------|------|-------------|
| `Direction` | string | Destination (direction) |
| `Product` | string | Product key |
| `Mode` | string | Vehicle type |
| `Name` | string | Line name |
| `Operator` | string | Operator |
| `ProductName` | string | Product name |

#### Remarks (within a leg)

Only for regular legs:

| Datapoint | Type | Description |
|----------|------|-------------|
| `Remarks.Hints` | string | Hints (combined) |
| `Remarks.Warnings` | string | Warnings (combined) |
| `Remarks.Status` | string | Status messages (combined) |

---

## Example Paths

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
public-transport.0.Journeys.home_work.Journey_00.Leg_01.Distance  ← walking leg
```

---

## Related Pages

- [Departures](en-Departures) — Stop configuration in the admin tab
- [Journeys](en-Journeys) — Journey configuration in the admin tab
- [NSPanel Integration](en-NSPanel) — Additional datapoints for NSPanel
