# Journeys

The **"Journeys"** tab manages point-to-point connection queries between two stops. It consists of a **journey overview** (left) and a **configuration panel** (right).

> 🖼️ **Image missing:** Screenshot of the Journeys tab with journey list and configuration panel
> Path: `Pictures/verbindungen/admin-tab-verbindungen.png`

![Journeys tab](Pictures/verbindungen/admin-tab-verbindungen.png)

---

## Journey Overview

The left side shows all configured journeys in a list. Each entry displays the journey name and whether it is active.

### Adding a Journey

Click **"Add journey"** to create a new journey with an empty name and no start/destination stop. The stops must then be selected in the configuration panel using the search buttons.

### Deleting a Journey

Each journey has a delete button. A confirmation dialog appears before deletion. **All associated ioBroker datapoints** under `Journeys.{journeyId}` are recursively deleted together with the journey.

---

## Journey Configuration

Clicking a journey in the overview activates the configuration panel on the right. All fields can only be edited when the adapter is running (green status).

### Fields

#### Journey Name

| Property | Value |
|----------|-------|
| Type | Text field |
| Default | empty |

A freely chosen name to identify this journey (e.g. `Home_to_Work`). Not directly used in the datapoint path — the path uses the internal journey ID.

#### From Station

| Property | Value |
|----------|-------|
| Type | Text field (read-only) + search button |
| Default | empty |

Departure stop for the journey. The text field shows the stop name (read-only); the stop ID is shown as hint text below.

Click **"Select start station"** (or **"Change start station"** if already set) to open the station search dialog:
- Minimum characters: 2
- Search uses the configured transport service

#### To Station

| Property | Value |
|----------|-------|
| Type | Text field (read-only) + search button |
| Default | empty |

Destination stop for the journey. Works the same as the From Station field.

#### Enabled

| Property | Value |
|----------|-------|
| Type | Toggle (on/off) |
| Default | `on` (active) |

Enables or disables querying this journey. Disabled journeys are skipped during the next polling cycle. Datapoints are retained.

> When disabled, the product selector is also greyed out.

#### NSPanel Channel

| Property | Value |
|----------|-------|
| Type | Toggle (on/off) |
| Default | `off` |

Creates an additional channel of type `timetable` with all datapoints required for NSPanel Lovelace UI. Requires the [NSPanel Lovelace UI adapter](en-NSPanel).

#### Number of Connections

| Property | Value |
|----------|-------|
| Type | Number input |
| Default | `5` |
| Minimum | `1` |
| Maximum | `20` |

Number of route options retrieved from the transport service and stored as datapoints. Determines the number of `Journey_00` through `Journey_NN` objects.

---

## Transport Mode Filter (Product Selector)

Below the journey fields is the product selector. It shows all transport modes available for the selected profile as checkboxes.

For journeys: if no `availableProducts` are stored for the journey, the products of the currently configured profile are used as the available set.

> Disabled products exclude corresponding transport modes from the journey search.

The available transport modes and their display are identical to those on the [Departures](en-Departures) page.

### Available Products per Profile

| Profile | Available products |
|---------|-------------------|
| VBB (hafas:vbb) | suburban, subway, tram, bus, ferry, express, regional |
| VBN (hafas:vbn) | expressTrain, nationalTrain, localTrain, suburban, bus, watercraft, subway, tram, dialARide |
| ÖBB (hafas:oebb) | nationalExpress, national, interregional, regional, suburban, bus, ferry, subway, tram, onCall |
| Deutsche Bahn (vendo:db) | nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram, taxi |
| MOTIS/Transitous (motis:compat) | nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram |

---

## Related Pages

- [Configuration](en-Configuration) — Set profile and polling interval
- [Datapoints](en-Datapoints) — All datapoints of a journey in detail
- [NSPanel Integration](en-NSPanel) — Set up NSPanel channel
