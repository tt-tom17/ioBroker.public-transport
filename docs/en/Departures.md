# Departures

The **"Departures"** tab manages stops for which departure data is retrieved. It consists of a **stop overview** (left) and a **configuration panel** (right).

> 🖼️ **Image missing:** Screenshot of the Departures tab with stop list and configuration panel
> Path: `Pictures/abfahrten/admin-tab-abfahrten.png`

![Departures tab](Pictures/abfahrten/admin-tab-abfahrten.png)

---

## Stop Overview

The left side shows all configured stops in a list. Each entry displays the stop name (or custom name) and whether it is active.

### Adding a Stop

Click **"Add stop"** to open the station search dialog:

- **Minimum characters:** 2 characters must be entered before the search triggers
- The search uses the currently configured transport service
- Results show the name and ID of matching stops
- Clicking a stop selects it and closes the dialog

> 🖼️ **Image missing:** Screenshot of the station search dialog with results
> Path: `Pictures/abfahrten/stationssuche-dialog.png`

![Station search dialog](Pictures/abfahrten/stationssuche-dialog.png)

> **Note:** If a stop that is already in the list is selected, it will not be added again.

### Deleting a Stop

Each stop has a delete button. A confirmation dialog appears before deletion. **All associated ioBroker datapoints** under `Stations.{stationId}` are recursively deleted together with the stop.

---

## Stop Configuration

Clicking a stop in the overview activates the configuration panel on the right. All fields can only be edited when the adapter is running (green status).

### Fields

#### Station ID

| Property | Value |
|----------|-------|
| Type | Text field (read-only) |
| Source | automatically from station search |

Unique ID of the stop in the respective transport service (e.g. `900350163`). Filled automatically, cannot be changed.

#### Station Name

| Property | Value |
|----------|-------|
| Type | Text field (read-only) |
| Source | API response during station search |

Official name of the stop according to the API (e.g. `Berlin Hbf`). Filled automatically.

#### Custom Name

| Property | Value |
|----------|-------|
| Type | Text field |
| Default | same as station name |

Optional display name for the stop in ioBroker. Pre-filled with the station name on creation. Useful for better identification (e.g. `Bus_Stop_Work`).

> This name is **not** used as the datapoint path — the path always uses the station ID.

#### Enabled

| Property | Value |
|----------|-------|
| Type | Toggle (on/off) |
| Default | `on` (active) |

Enables or disables querying this stop. Disabled stops are skipped during the next polling cycle. Datapoints are retained.

> When disabled, the product selector is also greyed out.

#### NSPanel Channel

| Property | Value |
|----------|-------|
| Type | Toggle (on/off) |
| Default | `off` |

Creates an additional channel of type `timetable` with all datapoints required for NSPanel Lovelace UI. Requires the [NSPanel Lovelace UI adapter](en-NSPanel).

#### Number of Departures

| Property | Value |
|----------|-------|
| Type | Number input |
| Default | `10` (on creation), display fallback: `3` if unset |
| Minimum | `1` |
| Maximum | `50` |

Number of departures retrieved from the transport service and stored as datapoints. Determines the number of `Departures_00` through `Departures_NN` objects.

> The more departures configured, the more datapoints are created and updated each polling cycle.

#### Time Offset (minutes)

| Property | Value |
|----------|-------|
| Type | Number input |
| Default | `0` |
| Minimum | `0` |
| Unit | minutes |

Defines from which future point in time departures are retrieved. At `0`, departures are shown from now. At `5`, only departures leaving in at least 5 minutes are shown.

**Use case:** If a stop is 4 minutes away on foot, an offset of 4 hides departures that can no longer be caught.

---

## Transport Mode Filter (Product Selector)

Below the stop fields is the product selector. It shows all transport modes available for the selected profile as checkboxes.

> **Important:** Which products are shown depends on the configured profile. Each profile only shows transport modes relevant to that service.

**Underlined products** were reported by the API for this specific stop. They indicate which transport modes actually serve this stop.

Disabled products are filtered out during queries and not stored as datapoints.

### Available Transport Modes

| Key | Display name | Color |
|-----|-------------|-------|
| `express` | ICE/IC/EC | Red (#EC0016) |
| `nationalExpress` | ICE | Orange (#FF6F00) |
| `national` | IC/EC | Light orange (#FF8F00) |
| `regionalExpress` | RE | Light blue (#709EBF) |
| `regional` | RE/RB | Blue (#1455C0) |
| `suburban` | S-Bahn | Green (#008D4F) |
| `subway` | U-Bahn (Subway) | Dark blue (#0065AE) |
| `tram` | Tram | Red (#D5001C) |
| `bus` | Bus | Purple (#A5027D) |
| `ferry` | Ferry | Light blue (#0080C8) |
| `expressTrain` | ICE | Red (#EC0016) |
| `nationalTrain` | IC/EC/CNL/IR | Orange (#FF6F00) |
| `localTrain` | Local train | Blue (#1455C0) |
| `watercraft` | Boat/Ferry | Light blue (#0080C8) |
| `dialARide` | Dial-a-ride | Purple (#A5027D) |
| `interregional` | IR | Light orange (#FF8F00) |
| `onCall` | On-call service | Brown (#6D4C41) |
| `taxi` | Taxi | Yellow (#F9A825) |

> Not all 18 transport modes are visible for every profile. The selector hides modes not supported by the chosen profile.

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
- [Datapoints](en-Datapoints) — All datapoints of a stop in detail
- [NSPanel Integration](en-NSPanel) — Set up NSPanel channel
