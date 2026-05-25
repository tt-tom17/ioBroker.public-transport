# ioBroker Public-Transport Adapter

Der **public-transport** Adapter ermöglicht die Integration von Echtzeit-Fahrplaninformationen des öffentlichen Nahverkehrs in die ioBroker Smart-Home-Umgebung. Abfahrtszeiten und Verbindungen von Haltestellen verschiedener Verkehrsbetriebe in Deutschland, Österreich und weiteren Ländern können abgerufen und für Automationen genutzt werden.

> 🖼️ **Bild fehlt:** Adapter-Übersicht in der ioBroker Admin-Oberfläche (Kachel mit Logo und Versionsnummer)
> Pfad: `Pictures/home/adapter-overview.png`

![Adapter-Übersicht](Pictures/home/adapter-overview.png)

---

## Funktionen

- **Mehrere Transportdienste** — Unterstützung für HAFAS (VBB, ÖBB, VBN), DB Vendo und MOTIS (Transitous)
- **Beliebig viele Haltestellen** — Jede konfigurierbare Haltestelle wird unabhängig abgefragt
- **Echtzeit-Abfahrten** — Live-Abfahrtszeiten inkl. Verspätungsinformation
- **Verbindungsabfragen** — Mehrteilige Verbindungen zwischen Start- und Zielstation
- **Automatische Aktualisierung** — Frei konfigurierbares Abfrageintervall
- **Verkehrsmittelfilter** — Auswahl aus 18 Verkehrsmitteltypen (Bus, Bahn, Tram, U-Bahn, Fähre u.a.)
- **Zeitversatz** — Abfahrten erst ab einem zukünftigen Zeitpunkt anzeigen
- **Eigene Namen** — Individuelle Bezeichnung für Haltestellen und Verbindungen
- **NSPanel-Integration** — Optionaler Fahrplan-Kanal für NSPanel-Lovelace-UI

---

## Dokumentation

| Seite | Beschreibung |
|-------|--------------|
| [Installation](Installation) | Voraussetzungen und Installationsschritte |
| [Konfiguration](Konfiguration) | Allgemeine Einstellungen (Dienst, Intervall, Verspätungsoffset) |
| [Abfahrten](Abfahrten) | Haltestellen konfigurieren und Abfahrten abfragen |
| [Verbindungen](Verbindungen) | Verbindungen zwischen zwei Stationen konfigurieren |
| [Datenpunkte](Datenpunkte) | Vollständige Übersicht aller ioBroker-Datenpunkte |
| [Transportdienste](Dienste) | HAFAS, Vendo und MOTIS im Vergleich |
| [NSPanel-Integration](NSPanel) | Fahrplaninformationen auf dem NSPanel anzeigen |
| [Widgets](Widgets) | Vis/VIS2-Widgets für die Visualisierung |
| [FAQ](FAQ) | Häufige Fragen und Fehlerbehebung |

---

## Aktuelle Version

**v0.6.0** (2026-05-25)
- MOTIS-Dienst (Transitous) hinzugefügt
- NSPanel-Timetable-Klasse für NSPanel-Integration
- Verbindungs-Widget: Anzeige von Gehstrecken-Details korrigiert
- Verbindungs-Widget: Link-Styling für modale Bemerkungen

Ältere Versionen: siehe [Changelog](https://github.com/tt-tom17/ioBroker.public-transport/blob/main/README.md#changelog)

---

## Lizenz

MIT — © tt-tom17
