# NSPanel Integration

The adapter supports direct integration with the [**ioBroker NSPanel Lovelace UI Adapter**](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui). When enabled, the public-transport adapter creates additional datapoints in a format that the NSPanel adapter can directly read as a timetable display.

---

## Prerequisites

- [ioBroker NSPanel Lovelace UI Adapter](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui) must be installed and configured
- NSPanel hardware (Sonoff NSPanel)
- The **"NSPanel Channel"** toggle must be enabled for the respective stop or journey

---

## Enabling

The NSPanel channel is enabled individually per stop and per journey:

**For stops:** In the [Departures](en-Departures) configuration, enable the **"NSPanel Channel"** toggle.

**For journeys:** In the [Journeys](en-Journeys) configuration, enable the **"NSPanel Channel"** toggle.

On the next polling cycle, NSPanel channels are created automatically.

---

## Created Datapoints

### Departures: `nspanelDep{N}`

Below each `Departures_XX` channel, an additional channel `nspanelDep{N}` with role `timeTable` is created. The index `N` corresponds to the numeric index of the departure (**without** leading zero: `nspanelDep0`, `nspanelDep1`, …).

**Path:** `public-transport.0.Stations.{stationId}.Departures_00.nspanelDep0`

| Datapoint | Type | Description |
|----------|------|-------------|
| `ACTUAL` | string (date) | Actual (forecasted) departure time |
| `VEHICLE` | string | Vehicle type (`line.mode`, e.g. `train`, `bus`) |
| `DEPARTURE` | string (date) | Planned departure time |
| `DELAY` | number | Delay in seconds |
| `DIRECTION` | string | Destination (direction) |

### Journeys: `nspanelJourney{N}`

Below each `Journey_XX` channel, an additional channel `nspanelJourney{N}` with role `timeTable` is created. The index `N` corresponds to the numeric index of the journey option (**without** leading zero: `nspanelJourney0`, `nspanelJourney1`, …).

**Path:** `public-transport.0.Journeys.{journeyId}.Journey_00.nspanelJourney0`

| Datapoint | Type | Description |
|----------|------|-------------|
| `ACTUAL` | string (date) | Actual departure time of the first leg |
| `VEHICLE` | string | Vehicle type of the first non-walking leg |
| `DEPARTURE` | string (date) | Planned departure time of the first leg |
| `DELAY` | number | Departure delay of the first leg in seconds |
| `DIRECTION` | string | Name of the destination stop (last leg) |

---

## Notes

- NSPanel channels are **only** created when the corresponding toggle is active for the stop/journey. If the toggle is off, no `nspanelDep*` or `nspanelJourney*` datapoints are created.
- Channels are updated on every polling cycle (not just on first run).
- The NSPanel Lovelace UI adapter reads the datapoints automatically. No further configuration in the public-transport adapter is needed once the channel is enabled.
- Full datapoint reference: [Datapoints](en-Datapoints#nspanel-datapoints)

---

## Related Pages

- [Departures](en-Departures) — NSPanel toggle in stop configuration
- [Journeys](en-Journeys) — NSPanel toggle in journey configuration
- [Datapoints](en-Datapoints) — Full datapoint structure
