# Konfiguration

Der Tab **„Konfiguration"** ist in zwei Abschnitte unterteilt: **Client Konfiguration** (Dienst und Client-Name) und **Einstellungen** (Intervall, Logs, Verspätungsoffset).

> 🖼️ **Bild fehlt:** Screenshot des Konfiguration-Tabs in der Admin-Oberfläche
> Pfad: `Pictures/konfiguration/admin-tab-konfiguration.png`

![Konfiguration-Tab](Pictures/konfiguration/admin-tab-konfiguration.png)

---

## Abschnitt: Client Konfiguration

### Profil (Transportdienst + Profil)

| Eigenschaft | Wert |
|-------------|------|
| Typ | Dropdown (Einzelauswahl) |
| Standard | `HAFAS - VBB (Berlin/Brandenburg)` |

**Wichtig:** Service-Typ und Profil werden in einem einzigen Dropdown kombiniert gespeichert. Die Auswahl legt gleichzeitig fest, welche API verwendet wird und welche Verkehrsmittel verfügbar sind.

| Anzeigeoption | Interner Wert | Dienst | Profil |
|---------------|---------------|--------|--------|
| HAFAS - VBB (Berlin/Brandenburg) | `hafas:vbb` | HAFAS | vbb |
| HAFAS - ÖBB (Österreich) | `hafas:oebb` | HAFAS | oebb |
| HAFAS - VBN (Bremen/Niedersachsen) | `hafas:vbn` | HAFAS | vbn |
| Vendo - Deutsche Bahn | `vendo:db` | Vendo | db |
| MOTIS - Transitous (DE & Europa) | `motis:compat` | MOTIS | compat |

> Welche Verkehrsmittel je Profil verfügbar sind, ist in der Seite [Transportdienste](Dienste) beschrieben.

### Client Name

| Eigenschaft | Wert |
|-------------|------|
| Typ | Textfeld (optional) |
| Standard | leer (Adapter generiert automatisch einen Namen) |

Optionaler Name, der als User-Agent-Bezeichner für die API-Anfragen gesetzt wird (z.B. `mein-iobroker`). Wird das Feld leer gelassen, verwendet der Adapter einen automatisch generierten Namen (`iobroker-public-transport-{zufällig}`).

> Dieser Wert hat keinen Einfluss auf die abgerufenen Daten.

---

## Abschnitt: Einstellungen

### Abfrageintervall (Minuten)

| Eigenschaft | Wert |
|-------------|------|
| Typ | Zahleneingabe |
| Standard | `5` |
| Minimum | `5` |
| Maximum | `60` |
| Einheit | Minuten |

Legt fest, wie oft der Adapter die Abfahrten und Verbindungen bei den konfigurierten Stationen und Verbindungen aktualisiert. Ein kürzeres Intervall erhöht die Aktualität der Daten, belastet aber die API stärker.

> **Hinweis:** Das Intervall gilt global für alle Stationen und Verbindungen. Pro Abfragezyklus werden alle aktiven Konfigurationen nacheinander abgefragt.

### Erweiterte Info-Logs unterdrücken

| Eigenschaft | Wert |
|-------------|------|
| Typ | Checkbox |
| Standard | `false` (nicht unterdrückt) |

Wenn aktiviert, werden detaillierte Info-Logs (z.B. Meldungen über jede einzelne Abfragerunde) nicht ins ioBroker-Log geschrieben. Fehler- und Warnungs-Logs werden weiterhin ausgegeben.

> Nützlich bei produktivem Betrieb, um das Log übersichtlich zu halten.

### Verspätungsoffset (Minuten)

| Eigenschaft | Wert |
|-------------|------|
| Typ | Zahleneingabe |
| Standard | `2` |
| Minimum | `2` |
| Maximum | `60` |
| Einheit | Minuten |

Definiert die Toleranz für die Anzeige von Pünktlichkeit. Eine Abfahrt gilt noch als **pünktlich** (`DepartureOnTime = true`), wenn die Verspätung unterhalb des Offsets liegt.

**Beispiel:** Bei `delayOffset = 2` gilt eine Abfahrt mit 1 Minute Verspätung als pünktlich. Erst ab 2 Minuten wird `DepartureDelayed = true` gesetzt.

Die Datenpunkte `DepartureDelayed` und `DepartureOnTime` (bei Stationen) sowie die entsprechenden Felder bei Verbindungen werden auf Basis dieses Wertes berechnet.

---

## Native-only Felder (nicht im Admin-UI konfigurierbar)

Die folgenden Felder existieren in der Adapter-Konfiguration, sind aber nicht über den Admin-Tab erreichbar. Sie können bei Bedarf direkt in der Konfigurationsdatei (`io-package.json`) oder per ioBroker-Objekteditor gesetzt werden.

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|--------------|
| `logCompletelyJSON` | Boolean | `false` | Vollständige API-Antworten ins Log schreiben (Debug) |
| `logUnknownTokens` | Boolean | `false` | Unbekannte i18n-Übersetzungs-Tokens loggen |

> **Hinweis:** Diese Felder sind nur für Debugging und Entwicklung gedacht. Im Normalbetrieb müssen sie nicht gesetzt werden.

---

## Interaktionen zwischen Feldern

- **Profil ↔ Abfahrten/Verbindungen:** Nach einer Profiländerung müssen ggf. bestehende Stationen und Verbindungen neu konfiguriert werden, da sich die verfügbaren Verkehrsmittel ändern. Der Adapter löscht vorhandene Datenpunkte dabei nicht automatisch.
- **Abfrageintervall ↔ Polling:** Alle aktiven Stationen und Verbindungen werden im selben Zyklus abgefragt. Bei sehr vielen Konfigurationen und kurzem Intervall können API-Anfragen gehäuft auftreten.
