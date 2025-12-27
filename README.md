![Logo](admin/public-transport.png)
# ioBroker.public-transport

[![NPM version](https://img.shields.io/npm/v/iobroker.public-transport.svg)](https://www.npmjs.com/package/iobroker.public-transport)
[![Downloads](https://img.shields.io/npm/dm/iobroker.public-transport.svg)](https://www.npmjs.com/package/iobroker.public-transport)
![Number of Installations](https://iobroker.live/badges/public-transport-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/public-transport-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.public-transport.png?downloads=true)](https://nodei.co/npm/iobroker.public-transport/)

**Tests:** ![Test and Release](https://github.com/tt-tom17/ioBroker.public-transport/workflows/Test%20and%20Release/badge.svg)

## public-transport adapter for ioBroker

Der public-transport ermöglicht die Integration von Fahrplaninformationen des öffentlichen Nahverkehrs in ioBroker. Mit diesem Adapter können Sie Abfahrtszeiten von Haltestellen verschiedener Verkehrsbetriebe abrufen und in Ihrer Smart-Home-Umgebung nutzen.

### Hauptfunktionen

- **Mehrere Transport-Services**: Unterstützung für HAFAS und DB Vendo APIs
- **Flexible Station-Konfiguration**: Konfigurieren Sie mehrere Haltestellen gleichzeitig
- **Automatische Aktualisierung**: Regelmäßige Abfrage der Abfahrtszeiten im konfigurierbaren Intervall
- **Filteroptionen**: Filtern Sie nach Verkehrsmitteln (Bus, Bahn, Tram, etc.)
- **Zeitoffset**: Zeigen Sie Abfahrten ab einem bestimmten Zeitpunkt in der Zukunft an
- **Anpassbare Anzahl**: Bestimmen Sie, wie viele Abfahrten pro Station angezeigt werden sollen

### Unterstützte Verkehrsverbünde

#### HAFAS-Profile
Der Adapter unterstützt verschiedene Verkehrsverbünde über HAFAS, darunter:
- VBB (Verkehrsverbund Berlin-Brandenburg)
- ÖBB (Östereichische Bundesbahn)
- Und viele weitere Profile

#### DB Vendo
Unterstützung für Verkehrsbetriebe, die die DB Vendo API verwenden.

### Konfiguration

1. **Service-Typ**: Wählen Sie zwischen HAFAS und Vendo
2. **Profil**: Bei HAFAS - wählen Sie das entsprechende Verkehrsverbund-Profil
3. **Abfrageintervall**: Legen Sie fest, wie oft die Daten aktualisiert werden sollen (in Minuten)
4. **Stationen**: Fügen Sie Ihre gewünschten Haltestellen hinzu mit:
   - Station-ID
   - Benutzerdefinierter Name (optional)
   - Anzahl der abzurufenden Abfahrten
   - Zeitoffset für zukünftige Abfahrten
   - Zeitraum der Abfragen
   - Filterung nach Verkehrsmitteln

### Anwendungsbeispiele

- Anzeige der nächsten Busabfahrten auf einem Dashboard
- Benachrichtigungen, wenn die nächste Bahn bald abfährt
- Integration in Morgenroutinen zur Anzeige der Pendelverbindungen
- Planung von Ausfahrten basierend auf Fahrplänen
  
## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->

### **WORK IN PROGRESS**
* (tt-tom17)   optimization react pages

### 0.0.1 (2025-12-01)
* (tt-tom17) initial release

## License
MIT License

Copyright (c) 2025 tt-tom17 <tgb@kabelmail.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.