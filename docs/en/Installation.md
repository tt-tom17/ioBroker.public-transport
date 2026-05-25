# Installation

## Requirements

| Requirement | Details |
|-------------|---------|
| **Node.js** | ≥ 22 (since v0.3.0) |
| **ioBroker** | js-controller ≥ 7.0.6, Admin ≥ 7.7.20 |
| **Internet connection** | Required — the adapter fetches data from cloud APIs |

> **Note:** The adapter runs as a daemon (persistent process) and polls the API at the configured interval. A continuous internet connection is required.

---

## Installation via ioBroker Admin

1. Open the ioBroker Admin interface
2. Navigate to the **"Adapters"** tab
3. Search for `public-transport`
4. Click **"Install"**
5. After installation, an instance (`public-transport.0`) is created automatically

> 🖼️ **Image missing:** Admin interface showing search result for "public-transport" with install button
> Path: `Pictures/installation/admin-install.png`

![Installation via Admin](Pictures/installation/admin-install.png)

---

## Installation via CLI

```bash
cd /opt/iobroker
iobroker add public-transport
```

---

## First Start

After installation the adapter starts automatically and shows status **"yellow"** (no valid configuration yet) or **"green"** (running).

**What happens on first start:**
1. Adapter checks the configuration
2. Connection to the selected transport service (HAFAS / Vendo / MOTIS) is established
3. First query of configured stops and journeys
4. Datapoints are created under `public-transport.0`

> **Note:** Without configured stops or journeys, no datapoints are created. Configuration is done in the adapter's admin tab.

---

## Next Steps

- [Configuration](en-Configuration) — Select service, set polling interval
- [Departures](en-Departures) — Add your first stop
- [Journeys](en-Journeys) — Set up a journey query
