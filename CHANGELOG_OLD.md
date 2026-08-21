# Older changes
## 0.9.0 (2026-07-02)
* (tt-tom17) (widget) flexible height with vertical scroll
* (tt-tom17) (widget) flexible width: font scales with widget width down to a minimum, horizontal scroll below

## 0.8.3 (2026-06-28)
* (tt-tom17) fixed HAFAS "Premature close" errors (vbb/oebb) by requesting uncompressed responses (Accept-Encoding: identity)
* (tt-tom17) updated @iobroker/adapter-core to ^3.4.1

## 0.8.2 (2026-06-23)
* (tt-tom17) added HAFAS profile VMT (Verkehrsverbund Mittelthüringen)
* (tt-tom17) (nspanel journey) DIRECTION = Direction And Line
* (tt-tom17) (widget) add depature line

## 0.8.1 (2026-06-16)
* (tt-tom17) added HAFAS Profil RMV (Rhein-Main-Verkehrsverbund)
* (tt-tom17) moved per-station polling logs (entry/fetching/updated) to suppressible info level (suppressInfoLogs)
* (tt-tom17) fixed "unknown product" errors by dropping profile-unsupported products before requests

## 0.8.0 (2026-06-15)
* (tt-tom17) added configurable objectsWarnLimit to the admin UI
* (tt-tom17) improved reliability of backend requests (retry/timeout handling)
* (tt-tom17) retry transient network errors (e.g. TLS/socket disconnects, ECONNRESET) instead of failing immediately
* (tt-tom17) fixed transfer count, NaN duration and crashes on empty results
* (tt-tom17) connections widget: popup header now stays fixed while scrolling

## 0.7.0 (2026-06-01)
* (tt-tom17) fixed issues detected by repository checker
* (tt-tom17) updated documentation
* (dependabot) bump @motis-project/motis-fptf-client from 6.4.0 to 6.5.0
* (dependabot) bump db-vendo-client from 6.10.10 to 6.10.11

## 0.6.0 (2026-05-25)
* (tt-tom17) add Motis service support
* (tt-tom17) add nsPanelTimetable class for 'NSPanel-Lovelace-UI Next Level' integration
* (tt-tom17) connections widget: fix walking detail info display
* (tt-tom17) connections widget: add link styling for modal remarks

## 0.5.0 (2026-05-17)
* (tt-tom17) added productName to states
* (tt-tom17) connections widget: show remarks icons (warning/hint/status) per leg in journey detail popup
* (tt-tom17) connections widget: show remarks icons in main table (new Info column)
* (tt-tom17) connections widget: highlight delayed journeys/legs with red left border

## 0.4.0 (2026-05-06)
* (tt-tom17) fix select Products
* (tt-tom17) add Profil VBN (Bremen/Niedersachsen)

## 0.3.0 (2026-05-02)
* (tt-tom17) fix issues for latest Repo
* (tt-tom17) fix deaktivieren von Verbindungen
* (tt-tom17) Adapter requires node.js >= 22 now

## 0.2.2 (2026-04-25)
* (tt-tom17) fix countEntries for journeys

## 0.2.1 (2026-04-24)
* (tt-tom17) fix Vendo forbidden -> change dbnav to db

## 0.2.0 (2026-04-21)  
* (tt-tom17) Widget departures: add popup for hints and warnings

## 0.1.1 (2026-04-19)   
* (tt-tom17) fix App.tsx
* (tt-tom17) Fix [Bug]: Abfahrten-JSON bleibt leer oder alle gleich [#28](https://github.com/tt-tom17/ioBroker.public-transport/issues/28)

## 0.1.0 (2026-04-01)  
* (tt-tom17) begin beta-test

## 0.0.6 (2026-03-12)
* (tt-tom17) Widget for Journey
* (tt-tom17) Refactor admin UI: convert class components to functional components
* (tt-tom17) Add confirmation dialog for station and journey deletion
* (tt-tom17) Auto-save and delete ioBroker object tree on station/journey removal
* (tt-tom17) Upgrade admin dependencies

## 0.0.5 (2026-03-03)  
* (tt-tom17) Upgrade dependency

## 0.0.4 (2026-02-16)
* (tt-tom17)   optimization react pages
