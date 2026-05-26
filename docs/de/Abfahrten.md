# Abfahrten

Der Tab **„Abfahrten erstellen"** ermöglicht das Verwalten von Haltestellen, für die Abfahrtsdaten abgerufen werden sollen. Er besteht aus einer **Stationsübersicht** (links) und einem **Konfigurationsbereich** (rechts).

> 🖼️ **Bild fehlt:** Screenshot des Abfahrten-Tabs mit Stationsliste und Konfigurationsbereich
> Pfad: `Pictures/abfahrten/admin-tab-abfahrten.png`

![Abfahrten-Tab](Pictures/abfahrten/admin-tab-abfahrten.png)

---

## Stationsübersicht

Die linke Seite zeigt alle konfigurierten Stationen in einer Liste. Jeder Eintrag zeigt den Namen der Station (bzw. den eigenen Namen) und ob die Station aktiv ist.

### Station hinzufügen

Über den Button **„Station hinzufügen"** öffnet sich der Stationssuche-Dialog:

- **Mindestzeichen:** 2 Zeichen müssen eingegeben werden, bevor die Suche startet
- Die Suche verwendet den aktuell konfigurierten Transportdienst
- Suchergebnisse zeigen Name und ID der gefundenen Haltestellen
- Per Klick auf eine Station wird sie übernommen und der Dialog geschlossen

> 🖼️ **Bild fehlt:** Screenshot des Stationssuche-Dialogs mit Suchergebnissen
> Pfad: `Pictures/abfahrten/stationssuche-dialog.png`

![Stationssuche-Dialog](Pictures/abfahrten/stationssuche-dialog.png)

> **Hinweis:** Wird eine Station ausgewählt, die bereits in der Liste vorhanden ist, wird sie nicht erneut hinzugefügt.

### Station löschen

Jede Station hat einen Löschen-Button. Vor dem Löschen erscheint ein Bestätigungsdialog. **Beim Löschen werden auch alle zugehörigen ioBroker-Datenpunkte** unter `Stations.{stationId}` rekursiv gelöscht.

---

## Stationskonfiguration

Nach dem Klick auf eine Station in der Übersicht wird der Konfigurationsbereich auf der rechten Seite aktiv. Alle Felder können nur bearbeitet werden, wenn der Adapter läuft (grüner Status).

### Felder

#### Stations-ID

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld (schreibgeschützt) |
| Quelle | automatisch aus der Stationssuche |

Eindeutige ID der Haltestelle im jeweiligen Transportdienst (z.B. `900350163`). Wird automatisch befüllt und kann nicht geändert werden.

#### Stationsname

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld (schreibgeschützt) |
| Quelle | API-Antwort bei der Stationssuche |

Offizieller Name der Haltestelle laut API (z.B. `Berlin Hbf`). Wird automatisch befüllt.

#### Eigener Name

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld |
| Standard | entspricht dem Stationsnamen |

Optionaler Anzeigename für die Station in ioBroker. Wird beim Anlegen der Station automatisch mit dem Stationsnamen vorbelegt. Eignet sich zur besseren Identifikation (z.B. `Bushaltestelle_Arbeit`).

> Dieser Name wird **nicht** als Datenpfad verwendet — der Datenpfad basiert immer auf der Stations-ID.

#### Aktiviert

| Eigenschaft | Wert |
|-------------|------|
| Typ | Toggle (Ein/Aus) |
| Standard | `ein` (aktiv) |

Schaltet die Abfrage dieser Station ein oder aus. Deaktivierte Stationen werden beim nächsten Polling-Zyklus übersprungen. Die Datenpunkte bleiben erhalten.

> Wenn deaktiviert, ist auch der Produktselektor ausgegraut.

#### Channel für NSPanel (Adapter)

| Eigenschaft | Wert |
|-------------|------|
| Typ | Toggle (Ein/Aus) |
| Standard | `aus` |

Legt zusätzlich einen Channel vom Typ `timetable` mit allen für das NSPanel-Lovelace-UI benötigten Datenpunkten an. Erfordert den [NSPanel-Lovelace-UI-Adapter](NSPanel).

#### Anzahl Abfahrten

| Eigenschaft | Wert |
|-------------|------|
| Typ | Zahleneingabe |
| Standard | `10` (beim Anlegen), Anzeige: `3` wenn nicht gesetzt |
| Minimum | `1` |
| Maximum | `50` |

Anzahl der Abfahrten, die vom Transportdienst abgerufen und als Datenpunkte gespeichert werden. Bestimmt die Anzahl der `Departures_00` bis `Departures_NN`-Objekte.

> Je mehr Abfahrten konfiguriert sind, desto mehr Datenpunkte werden angelegt und bei jedem Polling-Zyklus aktualisiert.

#### Zeitversatz (Minuten)

| Eigenschaft | Wert |
|-------------|------|
| Typ | Zahleneingabe |
| Standard | `0` |
| Minimum | `0` |
| Einheit | Minuten |

Gibt an, ab welchem zukünftigen Zeitpunkt Abfahrten abgerufen werden sollen. Bei `0` werden Abfahrten ab sofort angezeigt. Bei `5` werden nur Abfahrten gezeigt, die in mindestens 5 Minuten abfahren.

**Anwendungsfall:** Wenn die Haltestelle 4 Minuten Fußweg entfernt ist, verhindert ein Offset von 4, dass Abfahrten angezeigt werden, die nicht mehr erreichbar sind.

---

## Verkehrsmittelfilter (Produktselektor)

Unterhalb der Stationsfelder befindet sich der Produktselektor. Er zeigt alle für das gewählte Profil verfügbaren Verkehrsmittel als Checkboxen.

> **Wichtig:** Welche Produkte angezeigt werden, hängt vom konfigurierten Profil ab. Pro Profil stehen nur die für diesen Dienst relevanten Verkehrsmittel zur Verfügung.

**Unterstrichen dargestellte Produkte** wurden von der API für diese Station zurückgemeldet. Sie sind ein Hinweis, welche Verkehrsmittel tatsächlich an dieser Haltestelle halten.

Alle Produkte die deaktiviert sind, werden bei der Abfrage herausgefiltert und nicht als Datenpunkte gespeichert.

### Verfügbare Verkehrsmittel

| Schlüssel | Anzeigename | Icon | Farbe |
|-----------|-------------|------|-------|
| `express` | ICE/IC/EC | Bahn | Rot (#EC0016) |
| `nationalExpress` | ICE | Bahn | Orange (#FF6F00) |
| `national` | IC/EC | Bahn | Hellorange (#FF8F00) |
| `regionalExpress` | RE | Bahn | Hellblau (#709EBF) |
| `regional` | RE/RB | Bahn | Blau (#1455C0) |
| `suburban` | S-Bahn | Bahn | Grün (#008D4F) |
| `subway` | U-Bahn | U-Bahn-Icon | Dunkelblau (#0065AE) |
| `tram` | Straßenbahn | Tram-Icon | Rot (#D5001C) |
| `bus` | Bus | Bus-Icon | Lila (#A5027D) |
| `ferry` | Fähre | Schiff-Icon | Hellblau (#0080C8) |
| `expressTrain` | ICE | Bahn | Rot (#EC0016) |
| `nationalTrain` | IC/EC/CNL/IR | Bahn | Orange (#FF6F00) |
| `localTrain` | Nahverkehr | Bahn | Blau (#1455C0) |
| `watercraft` | Schiff/Fähre | Schiff-Icon | Hellblau (#0080C8) |
| `dialARide` | Anruf-/Bedarfsverkehr | Auto-Icon | Lila (#A5027D) |
| `interregional` | IR | Bahn | Hellorange (#FF8F00) |
| `onCall` | Anruf-/Bedarfsverkehr | Auto-Icon | Braun (#6D4C41) |
| `taxi` | Taxi | Taxi-Icon | Gelb (#F9A825) |

> Nicht alle 18 Verkehrsmittel sind bei jedem Profil sichtbar. Der Selektor blendet Verkehrsmittel aus, die vom gewählten Profil nicht unterstützt werden.

### Verfügbare Produkte je Profil

| Profil | Verfügbare Produkte |
|--------|---------------------|
| VBB (hafas:vbb) | suburban, subway, tram, bus, ferry, express, regional |
| VBN (hafas:vbn) | expressTrain, nationalTrain, localTrain, suburban, bus, watercraft, subway, tram, dialARide |
| ÖBB (hafas:oebb) | nationalExpress, national, interregional, regional, suburban, bus, ferry, subway, tram, onCall |
| Deutsche Bahn (vendo:db) | nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram, taxi |
| MOTIS/Transitous (motis:compat) | nationalExpress, national, regionalExpress, regional, suburban, bus, ferry, subway, tram |

---

## Weiterführende Seiten

- [Konfiguration](Konfiguration) — Profil und Abfrageintervall festlegen
- [Datenpunkte](Datenpunkte) — Alle Datenpunkte einer Station im Detail
- [NSPanel-Integration](NSPanel) — NSPanel-Channel einrichten
