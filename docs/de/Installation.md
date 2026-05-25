# Installation

## Voraussetzungen

| Anforderung | Details |
|-------------|---------|
| **Node.js** | ≥ 22 (seit v0.3.0) |
| **ioBroker** | js-controller ≥ 7.0.6, Admin ≥ 7.7.20 |
| **Internetverbindung** | Erforderlich — der Adapter ruft Daten aus Cloud-APIs ab |

> **Hinweis:** Der Adapter läuft als Daemon (dauerhafter Prozess) und fragt die API im konfigurierten Intervall ab. Er benötigt eine kontinuierliche Internetverbindung.

---

## Installation über die ioBroker Admin-Oberfläche

1. ioBroker Admin öffnen
2. Reiter **„Adapter"** wählen
3. Suchfeld: `public-transport` eingeben
4. Auf **„Installieren"** klicken
5. Nach der Installation wird automatisch eine Instanz (`public-transport.0`) angelegt

> 🖼️ **Bild fehlt:** Admin-Oberfläche mit Suchergebnis für „public-transport" und Installieren-Button
> Pfad: `Pictures/installation/admin-install.png`

![Installation über Admin](Pictures/installation/admin-install.png)

---

## Installation via CLI

```bash
cd /opt/iobroker
iobroker add public-transport
```

---

## Erster Start

Nach der Installation startet der Adapter automatisch und zeigt den Status **„gelb"** (keine gültige Konfiguration) oder **„grün"** (läuft).

**Was beim ersten Start passiert:**
1. Adapter prüft die Konfiguration
2. Verbindung zum gewählten Transportdienst (HAFAS / Vendo / MOTIS) wird hergestellt
3. Erste Abfrage der konfigurierten Haltestellen und Verbindungen
4. Datenpunkte werden in `public-transport.0` angelegt

> **Hinweis:** Ohne konfigurierte Haltestellen oder Verbindungen werden keine Datenpunkte erstellt. Die Konfiguration erfolgt im Admin-Tab des Adapters.

---

## Nächste Schritte

- [Konfiguration](Konfiguration) — Dienst auswählen, Abfrageintervall festlegen
- [Abfahrten](Abfahrten) — Erste Haltestelle hinzufügen
- [Verbindungen](Verbindungen) — Verbindungsabfrage einrichten
