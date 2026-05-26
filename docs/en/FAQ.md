# Frequently Asked Questions (FAQ)

---

## General

### Which service is suitable for my region?

| Region | Recommended service/profile |
|--------|----------------------------|
| Germany (DB, IC, ICE, regional trains) | `Vendo (DB)` |
| Berlin & Brandenburg (BVG, S-Bahn) | `HAFAS – VBB` |
| Austria (ÖBB) | `HAFAS – ÖBB` |
| Northern Germany (VBN, Bremen/Lower Saxony) | `HAFAS – VBN` |
| Other regions (experimental) | `MOTIS Transitous (compat)` |

For more details: [Transport Services](en-Services)

---

### How many stops and journeys can I configure?

There is no hard-coded upper limit. The number is practically limited by system resources and the polling interval. Each stop and journey generates one API call per polling cycle.

---

### Can I run multiple instances of the adapter?

Yes. Multiple instances are possible and useful when different services need to be used simultaneously (e.g. HAFAS and Vendo at the same time), since only one service is configured per instance.

---

### Which Node.js version is required?

Node.js ≥ 22 and js-controller ≥ 7.0.6 are required. Older versions are not supported.

---

## Departures

### Why are no departures shown (`countDepartures` = 0)?

Possible causes:

1. **Stop ID not found** — The entered ID or search term returns no results. Check the ID using the stop search in the adapter configuration.
2. **Transport mode filter too restrictive** — All transport modes are disabled. Enable at least one.
3. **Time offset too large** — The configured time offset (minutes) is beyond the available departures in the query window. Reduce the time offset or increase the time window.
4. **API not reachable** — The API of the selected service is temporarily unavailable. Check the adapter log for error messages.
5. **Adapter stopped** — Check in ioBroker Admin that the adapter is running (green icon).

---

### What does the value in the `Delay` datapoint mean?

The delay value is given in **seconds**. A value of `120` means 2 minutes delay. Negative values mean the vehicle departs earlier than planned.

---

### What is the difference between `Departure` and `DeparturePlanned`?

- `Departure` — actual (real-time) departure time; includes the delay
- `DeparturePlanned` — scheduled departure time according to the timetable

When no real-time data is available, `Departure` equals the planned time.

---

### How does the time offset work?

The time offset filters out departures happening in less than N minutes. Useful when the walk to the stop takes a few minutes and you want to hide departures you can no longer catch.

Example: Time offset = 5 → Only departures at least 5 minutes away are shown.

---

### Why is the `Operator` datapoint sometimes missing?

Not all services and profiles provide operator information. If the API returns no operator, the datapoint remains empty.

---

## Journeys

### Why are no journeys found?

1. **Origin or destination stop not configured** — Journeys require at least one configured departure stop as a source. Check that the selected stops exist in the "Departures" tab.
2. **Service does not support journey search** — Journey search is only supported by services that offer this feature. MOTIS Transitous may have limited support.
3. **Same origin and destination** — Origin and destination must be different stops.

---

### What is the difference between a `Leg` and a `Journey`?

- **Journey** — the complete connection from A to B
- **Leg** — a single travel segment within the journey (e.g. a subway ride or a walking transfer)

---

## VIS Widgets

### Which VIS version is supported?

The widgets were developed for **ioBroker VIS 1.x**. VIS 2.x is untested and not officially supported at this time.

---

### The widget shows "Lade Daten" and does not update

1. Check that the entered Object ID is correct (JSON datapoint of the stop/journey, e.g. `public-transport.0.Stations.{id}.json`).
2. Check that the adapter is running and the JSON datapoint contains valid data.
3. Make sure VIS has access to the ioBroker state.

---

### Can I customise the widget layout?

The widgets support standard VIS CSS classes. Custom adjustments can be made via the CSS field in the VIS editor. The class prefixes are `pub-trans-deptt-*` (departure table) and `pub-trans-conn-*` (connections table).

---

## NSPanel Lovelace UI

### Which adapter do I need for NSPanel integration?

The [NSPanel Lovelace UI Adapter](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui). It must be installed and configured separately.

---

### How do I enable NSPanel channels?

Enable the **"NSPanel Channel"** toggle in the respective stop or journey configuration. The datapoints are created automatically on the next polling cycle.

Details: [NSPanel Integration](en-NSPanel)

---

## Further Help

- [Configuration](en-Configuration)
- [Departures](en-Departures)
- [Journeys](en-Journeys)
- [Transport Services](en-Services)
