# Transportdienste

Der Adapter unterstützt drei verschiedene Transportdienste (Backends), die über das Profil-Dropdown in der [Konfiguration](Konfiguration) ausgewählt werden. Alle drei Dienste implementieren dieselbe interne Schnittstelle und liefern die gleichen Datenpunkte.

---

## Übersicht

| Dienst | Profil-Auswahl | npm-Paket | Region |
|--------|---------------|-----------|--------|
| HAFAS – VBB | `hafas:vbb` | `hafas-client` | Berlin/Brandenburg |
| HAFAS – ÖBB | `hafas:oebb` | `hafas-client` | Österreich |
| HAFAS – VBN | `hafas:vbn` | `hafas-client` | Bremen/Niedersachsen |
| Deutsche Bahn (Vendo) | `vendo:db` | `db-vendo-client` | Deutschland |
| MOTIS/Transitous | `motis:compat` | `@motis-project/motis-fptf-client` | International |

---

## HAFAS (`hafas:vbb`, `hafas:oebb`, `hafas:vbn`)

[HAFAS](https://www.hacon.de/en/portfolio/hafas/) ist das weit verbreitete Fahrplanauskunftssystem vieler europäischer Verkehrsverbünde. Der Adapter nutzt das Open-Source-Paket [`hafas-client`](https://github.com/public-transport/hafas-client), das HAFAS-Profile für zahlreiche Betreiber bereitstellt.

Der Adapter enthält drei vorkonfigurierte Profile:

### VBB – Verkehrsverbund Berlin-Brandenburg (`hafas:vbb`)

Deckt den öffentlichen Nahverkehr in Berlin und Brandenburg ab (S-Bahn, U-Bahn, Straßenbahn, Bus, Fähre, Regionalbahn/express).

**Verfügbare Verkehrsmittel:** suburban, subway, tram, bus, ferry, express, regional

### ÖBB – Österreichische Bundesbahnen (`hafas:oebb`)

Deckt den öffentlichen Verkehr in Österreich ab (ICE/Railjet, IC/EC, Interregio, Regionalzüge, S-Bahn, Bus, Fähre, U-Bahn, Straßenbahn, Rufbus).

**Verfügbare Verkehrsmittel:** nationalExpress, national, interregional, regional, suburban, bus, ferry, subway, tram, onCall

### VBN – Verkehrsverbund Bremen/Niedersachsen (`hafas:vbn`)

Deckt den öffentlichen Nahverkehr in Bremen und Niedersachsen ab.

**Verfügbare Verkehrsmittel:** expressTrain, nationalTrain, localTrain, suburban, bus, watercraft, subway, tram, dialARide

### Throttling

Alle HAFAS-Clients werden mit aktiviertem Throttling (`withThrottling`) initialisiert, um die Rate der API-Anfragen zu begrenzen und eine Sperrung durch den Dienst zu vermeiden.

### Client-Name

Der Client-Name wird im HTTP-User-Agent der API-Anfragen verwendet. Er setzt sich zusammen aus:
```
{clientName}-{zufällige Zahl 0–1000}
```
Der `clientName` kann optional in den [Einstellungen](Konfiguration#einstellungen) konfiguriert werden. Standard: `iobroker-public-transport`.

---

## Deutsche Bahn – Vendo (`vendo:db`)

Für den Fernverkehr der Deutschen Bahn nutzt der Adapter das Paket [`db-vendo-client`](https://github.com/public-transport/db-vendo-client). Dieses kommuniziert mit dem DB Vendo-System (offizielle DB-API) und deckt das gesamte Streckennetz der Deutschen Bahn ab.

**Profil:** `db` (aus `db-vendo-client/p/db`)

**Verfügbare Verkehrsmittel:** nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram, taxi

> **Hinweis:** Das `vendo:db`-Profil ist speziell für das DB-Netz optimiert und liefert häufig detailliertere Gleisangaben als HAFAS.

### Throttling

Auch dieser Client wird mit aktiviertem Throttling initialisiert.

---

## MOTIS / Transitous (`motis:compat`)

[Transitous](https://transitous.org/) ist ein community-betriebenes, Open-Source-Projekt für internationale Fahrplaninformationen basierend auf dem [MOTIS](https://motis-project.de/)-Server. Der Adapter nutzt das Paket [`@motis-project/motis-fptf-client`](https://github.com/motis-project/motis-fptf-client) mit dem `compat`-Profil.

**Besonderheit:** `enrichStations` ist deaktiviert, um das automatische Nachladen der DB-Haltestellendatenbank zu vermeiden.

**Verfügbare Verkehrsmittel:** nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram

> **Hinweis:** Transitous ist ein community-Dienst. Verfügbarkeit und Datenqualität können je nach Region variieren. Für Deutschland und Österreich liefern die dedizierten HAFAS- oder Vendo-Profile in der Regel zuverlässigere Ergebnisse.

---

## Auswahl des richtigen Dienstes

| Anwendungsfall | Empfehlung |
|---------------|------------|
| Berlin/Brandenburg (inkl. S-Bahn/U-Bahn/Tram) | `hafas:vbb` |
| Österreich (ÖBB, Wiener Linien, etc.) | `hafas:oebb` |
| Bremen und Niedersachsen | `hafas:vbn` |
| Deutschlandweiter Fernverkehr (ICE/IC/RE/RB) | `vendo:db` |
| Internationaler Verkehr / andere Länder | `motis:compat` |

---

## Weiterführende Seiten

- [Konfiguration](Konfiguration) — Dienst und Profil auswählen
- [Abfahrten](Abfahrten) — Verfügbare Verkehrsmittel je Profil
- [Datenpunkte](Datenpunkte) — Welche Daten der Adapter speichert
