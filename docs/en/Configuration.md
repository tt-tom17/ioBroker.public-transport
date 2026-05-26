# Configuration

The **"Configuration"** tab is divided into two sections: **Client Configuration** (service and client name) and **Settings** (interval, logs, delay offset).

> 🖼️ **Image missing:** Screenshot of the Configuration tab in the admin interface
> Path: `Pictures/konfiguration/admin-tab-konfiguration.png`

![Configuration tab](Pictures/konfiguration/admin-tab-konfiguration.png)

---

## Section: Client Configuration

### Profile (Transport Service + Profile)

| Property | Value |
|----------|-------|
| Type | Dropdown (single selection) |
| Default | `HAFAS - VBB (Berlin/Brandenburg)` |

**Important:** Service type and profile are stored separately internally but selected via a single combined dropdown. The selection defines both the API used and which transport modes are available.

| Display option | Internal value | Service | Profile |
|----------------|----------------|---------|---------|
| HAFAS - VBB (Berlin/Brandenburg) | `hafas:vbb` | HAFAS | vbb |
| HAFAS - ÖBB (Austria) | `hafas:oebb` | HAFAS | oebb |
| HAFAS - VBN (Bremen/Lower Saxony) | `hafas:vbn` | HAFAS | vbn |
| Vendo - Deutsche Bahn | `vendo:db` | Vendo | db |
| MOTIS - Transitous (DE & Europe) | `motis:compat` | MOTIS | compat |

> Which transport modes are available per profile is described on the [Transport Services](en-Services) page.

### Client Name

| Property | Value |
|----------|-------|
| Type | Text field (optional) |
| Default | empty (adapter auto-generates a name) |

Optional name set as the User-Agent identifier for API requests (e.g. `my-iobroker`). If left empty, the adapter uses an automatically generated name (`iobroker-public-transport-{random}`).

> This value has no effect on the retrieved data.

---

## Section: Settings

### Query Interval (minutes)

| Property | Value |
|----------|-------|
| Type | Number input |
| Default | `5` |
| Minimum | `5` |
| Maximum | `60` |
| Unit | minutes |

Defines how often the adapter updates departures and journeys for all configured stops and connections. A shorter interval increases data freshness but increases API load.

> **Note:** The interval applies globally to all stops and journeys. Each polling cycle queries all active configurations sequentially.

### Suppress Advanced Info Logs

| Property | Value |
|----------|-------|
| Type | Checkbox |
| Default | `false` (not suppressed) |

When enabled, detailed info log messages (e.g. per-cycle query notifications) are not written to the ioBroker log. Error and warning logs are still output.

> Useful in production to keep the log clean.

### Delay Offset (minutes)

| Property | Value |
|----------|-------|
| Type | Number input |
| Default | `2` |
| Minimum | `2` |
| Maximum | `60` |
| Unit | minutes |

Defines the tolerance for on-time status. A departure is considered **on time** (`DepartureOnTime = true`) when the delay is below this offset.

**Example:** With `delayOffset = 2`, a departure that is 1 minute late is still considered on time. Only from 2 minutes onward is `DepartureDelayed = true` set.

The datapoints `DepartureDelayed` and `DepartureOnTime` (for stops) and their equivalents in journeys are calculated based on this value.

---

## Native-only Fields (not available in Admin UI)

The following fields exist in the adapter configuration but are not accessible via the admin tab. They can be set directly in the configuration object if needed.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `logCompletelyJSON` | Boolean | `false` | Log complete API responses (debug) |
| `logUnknownTokens` | Boolean | `false` | Log unknown i18n translation tokens |

> **Note:** These fields are intended for debugging and development only. They do not need to be set in normal operation.

---

## Field Interactions

- **Profile ↔ Departures/Journeys:** After changing the profile, existing stops and journeys may need to be reconfigured since the available transport modes change. The adapter does not automatically delete existing datapoints.
- **Query interval ↔ Polling:** All active stops and journeys are queried in the same cycle. With many configurations and a short interval, API requests may be issued frequently.
