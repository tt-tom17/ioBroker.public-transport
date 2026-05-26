# Transport Services

The adapter supports three different transport service backends, selected via the profile dropdown in [Configuration](en-Configuration). All three services implement the same internal interface and provide the same datapoints.

---

## Overview

| Service | Profile selection | npm package | Region |
|---------|------------------|-------------|--------|
| HAFAS – VBB | `hafas:vbb` | `hafas-client` | Berlin/Brandenburg |
| HAFAS – ÖBB | `hafas:oebb` | `hafas-client` | Austria |
| HAFAS – VBN | `hafas:vbn` | `hafas-client` | Bremen/Lower Saxony |
| Deutsche Bahn (Vendo) | `vendo:db` | `db-vendo-client` | Germany |
| MOTIS/Transitous | `motis:compat` | `@motis-project/motis-fptf-client` | International |

---

## HAFAS (`hafas:vbb`, `hafas:oebb`, `hafas:vbn`)

[HAFAS](https://www.hacon.de/en/portfolio/hafas/) is the widely-used timetable information system of many European transport associations. The adapter uses the open-source [`hafas-client`](https://github.com/public-transport/hafas-client) package, which provides HAFAS profiles for numerous operators.

The adapter includes three pre-configured profiles:

### VBB – Verkehrsverbund Berlin-Brandenburg (`hafas:vbb`)

Covers public transport in Berlin and Brandenburg (S-Bahn, U-Bahn, tram, bus, ferry, regional/express rail).

**Available products:** suburban, subway, tram, bus, ferry, express, regional

### ÖBB – Austrian Federal Railways (`hafas:oebb`)

Covers public transport in Austria (ICE/Railjet, IC/EC, Interregio, regional trains, S-Bahn, bus, ferry, subway, tram, on-call services).

**Available products:** nationalExpress, national, interregional, regional, suburban, bus, ferry, subway, tram, onCall

### VBN – Verkehrsverbund Bremen/Niedersachsen (`hafas:vbn`)

Covers public transport in Bremen and Lower Saxony.

**Available products:** expressTrain, nationalTrain, localTrain, suburban, bus, watercraft, subway, tram, dialARide

### Throttling

All HAFAS clients are initialised with throttling enabled (`withThrottling`) to limit the rate of API requests and avoid being blocked by the service.

### Client Name

The client name is used in the HTTP User-Agent of API requests. It is composed of:
```
{clientName}-{random number 0–1000}
```
The `clientName` can optionally be configured in [Settings](en-Configuration#settings). Default: `iobroker-public-transport`.

---

## Deutsche Bahn – Vendo (`vendo:db`)

For Deutsche Bahn long-distance services, the adapter uses the [`db-vendo-client`](https://github.com/public-transport/db-vendo-client) package. This communicates with the DB Vendo system (official DB API) and covers the entire Deutsche Bahn network.

**Profile:** `db` (from `db-vendo-client/p/db`)

**Available products:** nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram, taxi

> **Note:** The `vendo:db` profile is specifically optimised for the DB network and often provides more detailed platform information than HAFAS.

### Throttling

This client is also initialised with throttling enabled.

---

## MOTIS / Transitous (`motis:compat`)

[Transitous](https://transitous.org/) is a community-operated, open-source project for international timetable information based on the [MOTIS](https://motis-project.de/) server. The adapter uses the [`@motis-project/motis-fptf-client`](https://github.com/motis-project/motis-fptf-client) package with the `compat` profile.

**Special feature:** `enrichStations` is disabled to avoid automatically loading the DB stop database.

**Available products:** nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram

> **Note:** Transitous is a community service. Availability and data quality may vary by region. For Germany and Austria, the dedicated HAFAS or Vendo profiles generally provide more reliable results.

---

## Choosing the Right Service

| Use case | Recommendation |
|----------|----------------|
| Berlin/Brandenburg (incl. S-Bahn/U-Bahn/Tram) | `hafas:vbb` |
| Austria (ÖBB, Wiener Linien, etc.) | `hafas:oebb` |
| Bremen and Lower Saxony | `hafas:vbn` |
| Germany-wide long-distance (ICE/IC/RE/RB) | `vendo:db` |
| International / other countries | `motis:compat` |

---

## Related Pages

- [Configuration](en-Configuration) — Select service and profile
- [Departures](en-Departures) — Available products per profile
- [Datapoints](en-Datapoints) — What data the adapter stores
