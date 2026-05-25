# ioBroker Public-Transport Adapter

The **public-transport** adapter enables seamless integration of real-time public transportation schedule information into your ioBroker smart home environment. Retrieve departure times and connections from stops of various transport operators in Germany, Austria, and other countries, and use them for automations.

> 🖼️ **Image missing:** Adapter overview in the ioBroker admin interface (tile with logo and version number)
> Path: `Pictures/home/adapter-overview.png`

![Adapter overview](Pictures/home/adapter-overview.png)

---

## Features

- **Multiple transport services** — Support for HAFAS (VBB, ÖBB, VBN), DB Vendo and MOTIS (Transitous)
- **Unlimited stops** — Each configured stop is queried independently
- **Real-time departures** — Live departure times including delay information
- **Journey queries** — Multi-leg connections between origin and destination
- **Automatic updates** — Freely configurable polling interval
- **Transport mode filter** — Choose from 18 transport types (bus, train, tram, subway, ferry, etc.)
- **Time offset** — Show only departures from a future point in time
- **Custom names** — Individual labels for stops and journeys
- **NSPanel integration** — Optional timetable channel for NSPanel Lovelace UI

---

## Documentation

| Page | Description |
|------|-------------|
| [Installation](en-Installation) | Requirements and installation steps |
| [Configuration](en-Configuration) | General settings (service, interval, delay offset) |
| [Departures](en-Departures) | Configure stops and query departures |
| [Journeys](en-Journeys) | Configure connections between two stations |
| [Datapoints](en-Datapoints) | Full reference of all ioBroker datapoints |
| [Transport Services](en-Services) | HAFAS, Vendo and MOTIS compared |
| [NSPanel Integration](en-NSPanel) | Show timetable information on NSPanel |
| [Widgets](en-Widgets) | Vis/VIS2 widgets for visualization |
| [FAQ](en-FAQ) | Frequently asked questions and troubleshooting |

---

## Current Version

**v0.6.0** (2026-05-25)
- Added MOTIS service (Transitous)
- Added NSPanel timetable class for NSPanel integration
- Connections widget: fixed walking detail info display
- Connections widget: added link styling for modal remarks

Older versions: see [Changelog](https://github.com/tt-tom17/ioBroker.public-transport/blob/main/README.md#changelog)

---

## License

MIT — © tt-tom17
