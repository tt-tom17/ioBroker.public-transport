# Verbindungen

Der Tab **„Verbindungen erstellen"** ermöglicht das Konfigurieren von Verbindungsabfragen zwischen zwei Stationen. Er besteht aus einer **Verbindungsübersicht** (links) und einem **Konfigurationsbereich** (rechts).

> 🖼️ **Bild fehlt:** Screenshot des Verbindungen-Tabs mit Verbindungsliste und Konfigurationsbereich
> Pfad: `Pictures/verbindungen/admin-tab-verbindungen.png`

![Verbindungen-Tab](Pictures/verbindungen/admin-tab-verbindungen.png)

---

## Verbindungsübersicht

Die linke Seite zeigt alle konfigurierten Verbindungen in einer Liste. Jeder Eintrag zeigt den Verbindungsnamen und ob die Verbindung aktiv ist.

### Verbindung hinzufügen

Über den Button **„Verbindung hinzufügen"** wird eine neue Verbindung mit leerem Namen und ohne Start-/Zielstation angelegt. Die Station muss im Konfigurationsbereich anschließend über die Suchbuttons ausgewählt werden.

### Verbindung löschen

Jede Verbindung hat einen Löschen-Button. Vor dem Löschen erscheint ein Bestätigungsdialog. **Beim Löschen werden auch alle zugehörigen ioBroker-Datenpunkte** unter `Journeys.{journeyId}` rekursiv gelöscht.

---

## Verbindungskonfiguration

Nach dem Klick auf eine Verbindung in der Übersicht wird der Konfigurationsbereich auf der rechten Seite aktiv. Alle Felder können nur bearbeitet werden, wenn der Adapter läuft (grüner Status).

### Felder

#### Verbindungsname

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld |
| Standard | leer |

Frei wählbarer Name zur Identifikation dieser Verbindung (z.B. `Home_to_Work`). Wird im Datenpfad nicht direkt verwendet — der Pfad basiert auf der internen Verbindungs-ID.

#### Von Station

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld (schreibgeschützt) + Suchbutton |
| Standard | leer |

Startstation der Verbindung. Das Textfeld zeigt den Stationsnamen an (schreibgeschützt), darunter wird die Stations-ID als Hinweistext eingeblendet.

Über den Button **„Startstation auswählen"** (bzw. **„Startstation ändern"** wenn bereits gesetzt) öffnet sich der Stationssuche-Dialog:
- Mindestzeichen: 2
- Suche verwendet den konfigurierten Transportdienst

#### Nach Station

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld (schreibgeschützt) + Suchbutton |
| Standard | leer |

Zielstation der Verbindung. Funktioniert analog zur Von-Station.

#### Aktiviert

| Eigenschaft | Wert |
|-------------|------|
| Typ | Toggle (Ein/Aus) |
| Standard | `ein` (aktiv) |

Schaltet die Abfrage dieser Verbindung ein oder aus. Deaktivierte Verbindungen werden beim nächsten Polling-Zyklus übersprungen. Die Datenpunkte bleiben erhalten.

> Wenn deaktiviert, ist auch der Produktselektor ausgegraut.

#### Channel für NSPanel (Adapter)

| Eigenschaft | Wert |
|-------------|------|
| Typ | Toggle (Ein/Aus) |
| Standard | `aus` |

Legt zusätzlich einen Channel vom Typ `timetable` mit allen für das NSPanel-Lovelace-UI benötigten Datenpunkten an. Erfordert den [NSPanel-Lovelace-UI-Adapter](NSPanel).

#### Anzahl Verbindungen

| Eigenschaft | Wert |
|-------------|------|
| Typ | Zahleneingabe |
| Standard | `5` |
| Minimum | `1` |
| Maximum | `20` |

Anzahl der Verbindungsoptionen (Routen), die vom Transportdienst abgerufen und als Datenpunkte gespeichert werden. Bestimmt die Anzahl der `Journey_00` bis `Journey_NN`-Objekte.

---

## Verkehrsmittelfilter (Produktselektor)

Unterhalb der Verbindungsfelder befindet sich der Produktselektor. Er zeigt alle für das gewählte Profil verfügbaren Verkehrsmittel als Checkboxen.

Für Verbindungen gilt: Wenn keine `availableProducts` für die Verbindung gespeichert sind, werden die Produkte des aktuell konfigurierten Profils als Verfügbare verwendet.

> Deaktivierte Produkte schließen entsprechende Verkehrsmittel aus der Verbindungssuche aus.

Die verfügbaren Verkehrsmittel und ihre Darstellung sind identisch mit denen auf der [Abfahrten](Abfahrten)-Seite.

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
- [Datenpunkte](Datenpunkte) — Alle Datenpunkte einer Verbindung im Detail
- [NSPanel-Integration](NSPanel) — NSPanel-Channel einrichten
