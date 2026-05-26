# VIS Widgets

The adapter includes two ready-made widgets for [ioBroker VIS](https://github.com/ioBroker/ioBroker.vis) that display departure data and journey data directly on a dashboard. The widgets read the adapter's JSON datapoint and present the information as a clear table.

> 🖼️ **Image missing:** Screenshot of the VIS widget editor with both widgets in the widget palette
> ![Widget palette in VIS](Pictures/vis-widget-palette.png)

---

## Prerequisites

- ioBroker VIS adapter (VIS 1.x)
- At least one configured stop or journey in the public-transport adapter

---

## Widget 1: Departure Table

**Name in VIS:** `Departure Table`
**Widget identifier:** `tplpublic-transportDepTt`
**Minimum size:** 620 × 600 px

The widget displays departures from a stop as a tabular timetable display. The JSON datapoint of the stop serves as the data source.

> 🖼️ **Image missing:** Preview of the departure table in live operation
> ![Departure Table Widget](Pictures/widget-deptt-preview.png)

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `headerText` | Text | `Abfahrten` | Widget headline |
| `oidDepartures` | Object ID | — | JSON datapoint of the stop, e.g. `public-transport.0.Stations.{id}.json` |
| `maxDepartures` | Number (1–50) | `10` | Maximum number of departures to display |
| `showClock` | Checkbox | `off` | Show current time in the header |
| `remarkHint` | Checkbox | `off` | Show hints (yellow triangle) in the info column |
| `remarkWarning` | Checkbox | `off` | Show warnings (red circle) in the info column |
| `remarkStatus` | Checkbox | `off` | Show status messages (blue circle) in the info column |
| `useFilter` | Checkbox | `off` | Apply transport mode filter from the adapter configuration |

### Displayed Columns

| Column | Content |
|--------|---------|
| Time | Actual departure time (real-time) |
| Line / Direction | Line name with coloured icon + direction |
| Delay | Deviation in minutes; "on time" when no delay |
| Platform | Departure platform or stop; highlighted when platform changes |
| Info | Only when remarks are enabled: icon for hint, warning, or status |

> Clicking an icon in the Info column opens a popup with the full hint text.

### Remarks (Info Column)

When at least one of the three remark options is enabled, the Info column appears. The icons show the full text on click:

| Icon | Colour | Meaning |
|------|--------|---------|
| `!` (circle) | Red | Warning (`type: warning`) |
| `!` (triangle) | Yellow | Hint (`type: hint`) |
| `i` (circle) | Blue | Status message (`type: status`) |

---

## Widget 2: Connections Table

**Name in VIS:** `Connections Table`
**Widget identifier:** `tplpublic-transportConnections`
**Minimum size:** 800 × 600 px

The widget displays connection options between two stops as a tabular overview. The JSON datapoint of the journey serves as the data source.

> 🖼️ **Image missing:** Preview of the connections table in live operation
> ![Connections Table Widget](Pictures/widget-connections-preview.png)

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `headerTextConn` | Text | `Verbindungen` | Widget headline |
| `oidConnections` | Object ID | — | JSON datapoint of the journey, e.g. `public-transport.0.Journeys.{id}.json` |
| `maxConnections` | Number (1–50) | `10` | Maximum number of connections to display |
| `showClockConn` | Checkbox | `off` | Show current time in the header |

### Displayed Columns

| Column | Content |
|--------|---------|
| Departure | Departure time at the origin stop (real-time) |
| Delay (Dep) | Departure delay in minutes |
| Platform (Dep) | Departure platform; highlighted when changed |
| Arrival | Arrival time at the destination stop (real-time) |
| Delay (Arr) | Arrival delay in minutes |
| Platform (Arr) | Arrival platform; highlighted when changed |
| Transfers | Number of transfers |
| Info | Icons for hints, warnings, and status messages |

> Clicking a table row opens a modal with the individual journey legs, including intermediate stops, platform information, and walking distances.

### Journey Detail Modal

The modal shows per leg:
- Transport mode icon with line name and direction
- Departure time and platform (including delay)
- Arrival time and platform (including delay)
- For walking legs: distance in metres

---

## Installing the Widgets in VIS

The widgets are automatically available once the public-transport adapter is installed. They appear in VIS under the widget set **"public-transport"**.

1. Open the VIS editor
2. Select or create a view
3. In the widget panel, click **"public-transport"**
4. Drag the desired widget into the view
5. In the widget settings, enter the Object ID of the JSON datapoint

---

## Object IDs for the Widgets

### Departure Table

Object ID of the JSON datapoint for a stop:

```
public-transport.0.Stations.{StationID}.json
```

Example: `public-transport.0.Stations.900350163.json`

### Connections Table

Object ID of the JSON datapoint for a journey:

```
public-transport.0.Journeys.{JourneyID}.json
```

Example: `public-transport.0.Journeys.home_work.json`

---

## See Also

- [Configure Departures](en-Departures)
- [Configure Journeys](en-Journeys)
- [Datapoints Reference](en-Datapoints)
