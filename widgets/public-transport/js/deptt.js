/*
    ioBroker.vis public-transport Widget-Set - Abfahrtstafel

    Copyright 2026 tt-tom17 tgb@kabelmail.de
*/
'use strict';

// Übersetzungen für den Edit-Modus
$.extend(true, systemDictionary, {
    headerText: { en: 'Headline', de: 'Überschrift' },
    oidDepartures: { en: 'Departures Object ID', de: 'Abfahrten Objekt ID' },
    maxDepartures: { en: 'Max. Departures', de: 'Max. Abfahrten' },
    showClock: { en: 'Show Clock', de: 'Uhr anzeigen' },
    remarkHint: { en: 'Show hints', de: 'Hinweise anzeigen' },
    remarkWarning: { en: 'Show warnings', de: 'Warnungen anzeigen' },
    remarkStatus: { en: 'Show status messages', de: 'Statusmeldungen anzeigen' },
    useFilter: { en: 'Use filter from config', de: 'Filter aus Config verwenden' },
});

// Widget Binding
vis.binds['public-transportDepTt'] = {
    version: '0.0.6',

    showVersion: function () {
        if (vis.binds['public-transportDepTt'].version) {
            console.log('Version public-transportDepTt: ' + vis.binds['public-transportDepTt'].version);
            vis.binds['public-transportDepTt'].version = null;
        }
    },

    /**
     * Erstellt das Abfahrtstafel-Widget
     *
     * @param    widgetID - Die ID des Widgets
     * @param    view - Die aktuelle Ansicht
     * @param    data - Die Konfigurationsdaten des Widgets
     * @param    style - Die Stil-Daten des Widgets
     */
    createDepTt: function (widgetID, view, data, style) {
        const $div = $('#' + widgetID);

        // Falls Element nicht gefunden => warten
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds['public-transportDepTt'].createDepTt(widgetID, view, data, style);
            }, 100);
        }

        // Standard-Werte setzen
        const headerText = data.headerText || 'Abfahrten';
        const maxDepartures = data.maxDepartures || 10;
        const showClock = data.showClock === true;
        const showRemarkHint = data.remarkHint === true;
        const showRemarkWarning = data.remarkWarning === true;
        const showRemarkStatus = data.remarkStatus === true;
        const useFilter = data.useFilter === true;

        const hasRemarks = showRemarkHint || showRemarkWarning || showRemarkStatus;

        // SVG-Icons für Remark-Typen
        const SVG_WARNING = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" class="pub-trans-deptt-remark-icon"><circle cx="12" cy="12" r="11" fill="#cc0000"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial,sans-serif">!</text></svg>';
        const SVG_HINT    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 26" width="22" height="20" class="pub-trans-deptt-remark-icon"><polygon points="14,1 27,25 1,25" fill="#ffcc00"/><text x="14" y="22" text-anchor="middle" fill="#000000" font-size="13" font-weight="bold" font-family="Arial,sans-serif">!</text></svg>';
        const SVG_STATUS  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" class="pub-trans-deptt-remark-icon"><circle cx="12" cy="12" r="11" fill="#0066b3"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-style="italic" font-weight="bold" font-family="Arial,sans-serif">i</text></svg>';

        // HTML-Struktur erstellen
        let html = '';
        html += '<div class="pub-trans-deptt-container ' + data.class + '">';

        // Header
        html += '<div class="pub-trans-deptt-header">';
        html += headerText;
        if (showClock) {
            html += '<div class="pub-trans-deptt-clock" id="clock-' + widgetID + '">--:--</div>';
        }
        html += '</div>';

        // Gemeinsamer Scroll-Container: Spaltenkopf (sticky) + Zeilen scrollen horizontal deckungsgleich
        html += '<div class="pub-trans-deptt-scroll">';

        // Spaltenüberschriften

        if (hasRemarks) {
            console.log('[DepTt] Mindestens eine Remark aktiviert - zeige Info-Spalte');
            html += '<div class="pub-trans-deptt-column-header remarks">';
        } else {
            console.log('[DepTt] Keine Remark aktiviert - zeige keine Info-Spalte');
            html += '<div class="pub-trans-deptt-column-header no-remarks">';
        }
        html += '<div class="col-time">Zeit</div>';
        html += '<div class="col-line">Linie  / Ziel</div>';
        html += '<div class="col-delay">Verspätung</div>';
        html += '<div class="col-platform">Gleis</div>';
        if (hasRemarks) {
            console.log('[DepTt] Remark aktiviert - zeige Info-Überschrift');
            html += '<div class="col-info">Info</div>';
        } else {
            console.log('[DepTt] Keine Remark aktiviert - zeige keine Info-Überschrift');
        }
        html += '</div>';

        // Content-Bereich für Abfahrten
        html += '<div class="pub-trans-deptt-content" id="content-' + widgetID + '">';
        html += '<div class="pub-trans-deptt-loading">Lade Daten</div>';
        html += '</div>';

        html += '</div>'; // Ende .pub-trans-deptt-scroll

        // Modal für Remark-Details (Pattern wie connections.js)
        html += '<div class="pub-trans-deptt-modal" id="modal-deptt-' + widgetID + '">';
        html += '<div class="pub-trans-deptt-modal-content">';
        html += '<div class="pub-trans-deptt-modal-header">';
        html += '<span class="pub-trans-deptt-modal-close" id="close-modal-deptt-' + widgetID + '">&times;</span>';
        html += 'Hinweise';
        html += '</div>';
        html += '<div id="modal-body-deptt-' + widgetID + '"></div>';
        html += '</div>';
        html += '</div>';

        html += '</div>';

        $div.html(html);

        // Schrift skaliert mit der Widget-Breite (Variante 4): 2% der Breite, gedeckelt auf 10–14px.
        // Umsetzung per ResizeObserver statt CSS Container Queries, da letztere in vis 1.x nicht greifen.
        const scaleContainer = $div.find('.pub-trans-deptt-container').get(0);
        if (scaleContainer && typeof ResizeObserver !== 'undefined') {
            const prevObserver = $div.data('ptResizeObserver');
            if (prevObserver) {
                prevObserver.disconnect();
            }
            const applyFontScale = function () {
                const width = scaleContainer.clientWidth;
                if (!width) return;
                const size = Math.max(10, Math.min(14, width * 0.02));
                scaleContainer.style.fontSize = size + 'px';
            };
            const observer = new ResizeObserver(applyFontScale);
            observer.observe(scaleContainer);
            $div.data('ptResizeObserver', observer);
            applyFontScale();
        }

        // Modal-Close Handler (wie connections.js)
        $('#close-modal-deptt-' + widgetID).on('click', function() {
            $('#modal-deptt-' + widgetID).removeClass('active');
        });
        $('#modal-deptt-' + widgetID).on('click', function(e) {
            if (e.target.id === 'modal-deptt-' + widgetID) {
                $('#modal-deptt-' + widgetID).removeClass('active');
            }
        });

        // Funktionen zum Aktualisieren der Anzeige
        function updateClock() {
            if (!showClock) return;

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            $('#clock-' + widgetID).text(hours + ':' + minutes);
        }

        function groupRemarksByType(remarks) {
            const hints = [];
            const warnings = [];
            const statuses = [];
        
            for (const remark of remarks) {
                switch (remark.type) {
                    case 'hint':
                        hints.push(remark.text ?? '');
                        break;
                    case 'warning':
                        warnings.push(remark.text ?? '');
                        break;
                    case 'status':
                        statuses.push(remark.text ?? '');
                        break;
                }
            }
        
            return {
                hint: hints.length > 0 ? hints.join('<br>') : undefined,
                warning: warnings.length > 0 ? warnings.join('<br>') : undefined,
                status: statuses.length > 0 ? statuses.join('<br>') : undefined,
            };
        }

        function getProductClass(productName) {
            if (!productName) return 'train';

            const product = productName.toLowerCase();
            if (product.includes('bus')) return 'bus';
            if (product.includes('tram') || product.includes('straßenbahn')) return 'tram';
            if (product.includes('u-bahn') || product.includes('ubahn') || product.includes('subway')) return 'subway';
            if (product.includes('s-bahn') || product.includes('sbahn') || product.includes('suburban')) return 'sbahn';
            return 'train';
        }

        function formatDelay(delay) {
            if (!delay || delay === 0) {
                return '<span class="pub-trans-deptt-delay ontime">pünktlich</span>';
            } else if (delay > 0) {
                return '<span class="pub-trans-deptt-delay delayed">+' + delay/60 + ' min</span>';
            } else {
                return '<span class="pub-trans-deptt-delay ontime">' + delay/60 + ' min</span>';
            }
        }

        function showPopup(remarkData) {
            let modalHtml = '';
            if (remarkData.warning) {
                modalHtml += '<div class="pub-trans-deptt-modal-section warning">';
                modalHtml += SVG_WARNING;
                modalHtml += '<span class="pub-trans-deptt-modal-text">' + remarkData.warning + '</span>';
                modalHtml += '</div>';
            }
            if (remarkData.hint) {
                modalHtml += '<div class="pub-trans-deptt-modal-section hint">';
                modalHtml += SVG_HINT;
                modalHtml += '<span class="pub-trans-deptt-modal-text">' + remarkData.hint + '</span>';
                modalHtml += '</div>';
            }
            if (remarkData.status) {
                modalHtml += '<div class="pub-trans-deptt-modal-section status">';
                modalHtml += SVG_STATUS;
                modalHtml += '<span class="pub-trans-deptt-modal-text">' + remarkData.status + '</span>';
                modalHtml += '</div>';
            }
            if (!modalHtml) return;
            $('#modal-body-deptt-' + widgetID).html(modalHtml);
            $('#modal-deptt-' + widgetID).addClass('active');
        }

        function renderDepartures(departuresToRender) {
            const $content = $('#content-' + widgetID);

            // Begrenze auf maxDepartures und filtere alte Abfahrten
            const displayDepartures = departuresToRender.filter(dep => {
                const time = dep.when || dep.time || dep.scheduledWhen || null;
                return time && new Date(time).getTime() >= Date.now() - 60 * 1000;
            }).slice(0, maxDepartures);

            console.log('[DepTt Render] Anzahl Abfahrten zu rendern:', displayDepartures.length);

            const remarkDataList = [];
            let html = '';
            displayDepartures.forEach(function (dep, depIdx) {

                const time = dep.when || dep.time || dep.scheduledWhen || '--:--';
                const line = dep.line.name || dep.lineName || dep.number || '?';
                const direction = dep.direction || dep.destination || '';
                const delay = dep.delay || 0;
                const platform = dep.platform || dep.track || '--';
                const plannedPlatform = dep.plannedPlatform || dep.plannedTrack || null;
                const changedPlatform = plannedPlatform && plannedPlatform !== platform;
                const cancelled = dep.cancelled || false;
                const product = dep.line.product || dep.productName || 'train';
                const remarks = dep.remarks && dep.remarks.length > 0 ? groupRemarksByType(dep.remarks) : {};

                const hasRemark = showRemarkHint || showRemarkWarning || showRemarkStatus;

                // Icons für die Info-Spalte
                let iconsHtml = '';
                if (showRemarkWarning && remarks.warning) {
                    iconsHtml += SVG_WARNING;
                }
                if (showRemarkHint && remarks.hint) {
                    iconsHtml += SVG_HINT;
                }
                if (showRemarkStatus && remarks.status) {
                    iconsHtml += SVG_STATUS;
                }
                remarkDataList.push({
                    warning: showRemarkWarning ? remarks.warning : undefined,
                    hint: showRemarkHint ? remarks.hint : undefined,
                    status: showRemarkStatus ? remarks.status : undefined,
                });

                // Zeit formatieren
                let displayTime = time;
                if (time !== '--:--' && typeof time === 'string') {
                    const timeObj = new Date(time);
                    if (!isNaN(timeObj.getTime())) {
                        displayTime =
                            String(timeObj.getHours()).padStart(2, '0') +
                            ':' +
                            String(timeObj.getMinutes()).padStart(2, '0');
                    }
                }

                if (hasRemark) {
                    console.log('[DepTt - Zeilen] Remark aktiviert - zeige Info-Spalte');
                    html += '<div class="pub-trans-deptt-row remarks">';
                } else {
                    console.log('[DepTt - Zeilen] Keine Remark aktiviert - zeige keine Info-Spalte');
                    html += '<div class="pub-trans-deptt-row no-remarks">';
                }
                html += '<div class="pub-trans-deptt-time">' + displayTime + '</div>';

                html += '<div class="pub-trans-deptt-line">';
                html += '<span class="pub-trans-deptt-line-icon ' + getProductClass(product) + '">' + line + '</span>';
                html += '<span class="pub-trans-deptt-direction">' + direction + '</span>';
                html += '</div>';

                html +=
                    '<div>' +
                    (cancelled ? '<span class="pub-trans-deptt-delay cancelled">Ausfall</span>' : formatDelay(delay)) +
                    '</div>';
                html += '<div class="pub-trans-deptt-platform' + (changedPlatform ? ' changed' : '') + '">' + platform + '</div>';
                if (hasRemark) {
                    console.log('[DepTt - Zeilen] Remark aktiviert - zeige Info-Spalte');
                    html += '<div class="pub-trans-deptt-info-cell" data-remark-idx="' + depIdx + '">' + (cancelled ? '<span class="pub-trans-deptt-delay cancelled">Fällt aus</span>' : iconsHtml) + '</div>';
                } else {
                    console.log('[DepTt - Zeilen] Keine Remark aktiviert - zeige keine Info-Spalte');
                }
                html += '</div>';
            });

            $content.html(html);

            // Click-Handler direkt auf Info-Zellen binden (wie connections.js)
            $content.find('.pub-trans-deptt-info-cell').on('click', function() {
                const idx = parseInt($(this).attr('data-remark-idx'), 10);
                if (!isNaN(idx) && remarkDataList[idx]) {
                    showPopup(remarkDataList[idx]);
                }
            });
        }

        function updateDepartures(e, newVal, oldVal) {
            let departures = [];

            try {
                if (typeof newVal === 'string') {
                    departures = JSON.parse(newVal);
                } else if (Array.isArray(newVal)) {
                    departures = newVal;
                } else if (newVal && typeof newVal === 'object') {
                    departures = [newVal];
                }
            } catch (err) {
                console.error('[DepTt] Error parsing departures data:', err);
                $('#content-' + widgetID).html(
                    '<div class="pub-trans-deptt-no-data">Fehler beim Laden der Daten</div>',
                );
                return;
            }

            const $content = $('#content-' + widgetID);

            if (!departures || departures.length === 0) {
                console.log('[DepTt] Keine Abfahrten verfügbar');
                $content.html('<div class="pub-trans-deptt-no-data">Keine Abfahrten verfügbar</div>');
                return;
            }

            console.log('[DepTt] Geladene Abfahrten (roh):', departures.length);

            if (useFilter && data.oidDepartures) {
                console.log('[DepTt Filter] Filter ist aktiviert (useFilter=true)');
                
                // Instanz aus der OID ableiten: "public-transport.0.xxx" → "0"
                const match = data.oidDepartures.match(/^public-transport\.(\d+)\./);
                const instance = match ? match[1] : '0';
                console.log('[DepTt Filter] Instanz:', instance, 'OID:', data.oidDepartures);

                vis.conn.getObject('system.adapter.public-transport.' + instance, function (err, obj) {
                    if (err) {
                        console.error('[DepTt Filter] Fehler beim Laden der Adapter-Config:', err);
                        renderDepartures(departures);
                        return;
                    }
                    
                    console.log('[DepTt Filter] Adapter-Objekt geladen:', obj ? 'OK' : 'NULL');
                    
                    if (obj && obj.native && obj.native.stationConfig) {
                        const allStations = obj.native.stationConfig || [];
                        console.log('[DepTt Filter] Anzahl Stationen in Config:', allStations.length);
                        console.log('[DepTt Filter] Alle Stationen:', allStations.map(s => s.id + ' (' + s.name + ')'));
                        
                        // StationID anhand der OID finden und Filter anwenden
                        const stationMatch = data.oidDepartures.match(/\.Stations\.([^.]+)\./);
                        const stationID = stationMatch ? stationMatch[1] : null;
                        console.log('[DepTt Filter] Extrahierte StationID:', stationID);
                        
                        if (stationID) {
                            const stationConfig = allStations.find(station => station.id === stationID);
                            console.log('[DepTt Filter] Gefundene Station-Config:', stationConfig);
                            
                            if (stationConfig && stationConfig.products) {
                                console.log('[DepTt Filter] Products-Config:', stationConfig.products);
                                console.log('[DepTt Filter] Type of products:', typeof stationConfig.products);
                                console.log('[DepTt Filter] Is Array?', Array.isArray(stationConfig.products));
                                
                                // WICHTIG: products ist ein Objekt {bus: true, tram: false, ...}, KEIN Array!
                                const beforeFilterCount = departures.length;
                                
                                departures = departures.filter(dep => {
                                    const productFromLine = dep.line && dep.line.product ? dep.line.product : null;
                                    const productFromProductName = dep.line && dep.line.productName ? dep.line.productName : null;
                                    const product = (productFromLine || productFromProductName || '').toLowerCase();
                                    
                                    // Prüfe ob das Produkt in der Config aktiviert ist
                                    const isEnabled = stationConfig.products[product] === true;
                                    
                                    console.log('[DepTt Filter] Abfahrt:', dep.line?.name, 
                                                '| Product:', product, 
                                                '| Enabled:', isEnabled,
                                                '| Config-Wert:', stationConfig.products[product]);
                                    
                                    return isEnabled;
                                });
                                
                                console.log('[DepTt Filter] Gefiltert:', beforeFilterCount, '→', departures.length, 'Abfahrten');
                            } else {
                                console.log('[DepTt Filter] Keine products-Config gefunden oder stationConfig ist null');
                            }
                        } else {
                            console.log('[DepTt Filter] Konnte StationID nicht aus OID extrahieren');
                        }
                        
                        // Rendern NACH dem Filtern
                        renderDepartures(departures);
                    } else {
                        console.log('[DepTt Filter] Keine stationConfig in native gefunden');
                        renderDepartures(departures);
                    }
                });
            } else {
                console.log('[DepTt Filter] Filter nicht aktiv - useFilter:', useFilter, 'oidDepartures:', data.oidDepartures);
                // Ohne Filter direkt rendern
                renderDepartures(departures);
            }
        }

        // State-Binding einrichten
        if (data.oidDepartures) {
            vis.states.bind(data.oidDepartures + '.val', updateDepartures);
            $div.data('bound', [data.oidDepartures + '.val']);
            $div.data('bindHandler', updateDepartures);

            // Initiale Aktualisierung
            if (vis.states[data.oidDepartures + '.val']) {
                updateDepartures(null, vis.states[data.oidDepartures + '.val'], null);
            }
        }

        // Funktion zur Berechnung der Millisekunden bis zur nächsten vollen Minute
        function getMillisecondsUntilNextMinute() {
            const now = new Date();
            const seconds = now.getSeconds();
            const milliseconds = now.getMilliseconds();
            return (60 - seconds) * 1000 - milliseconds;
        }

        // Aktualisierung zur vollen Minute
        function scheduleMinuteUpdate() {
            // Sofortige Aktualisierung
            if (showClock) {
                updateClock();
            }
            if (data.oidDepartures && vis.states[data.oidDepartures + '.val']) {
                updateDepartures(null, vis.states[data.oidDepartures + '.val'], null);
            }

            // Erste Aktualisierung zur nächsten vollen Minute
            const msUntilNextMinute = getMillisecondsUntilNextMinute();
            setTimeout(function () {
                if (showClock) {
                    updateClock();
                }
                if (data.oidDepartures && vis.states[data.oidDepartures + '.val']) {
                    updateDepartures(null, vis.states[data.oidDepartures + '.val'], null);
                }

                // Danach jede volle Minute aktualisieren (60 Sekunden)
                setInterval(function () {
                    if (showClock) {
                        updateClock();
                    }
                    if (data.oidDepartures && vis.states[data.oidDepartures + '.val']) {
                        updateDepartures(null, vis.states[data.oidDepartures + '.val'], null);
                    }
                }, 60 * 1000);
            }, msUntilNextMinute);
        }

        // Aktualisierung zur vollen Minute starten
        scheduleMinuteUpdate();
        
    },
};

vis.binds['public-transportDepTt'].showVersion();
