/*
    ioBroker.vis public-transport Widget-Set - Verbindungstabelle

    Copyright 2026 tt-tom17 tgb@kabelmail.de
*/
'use strict';

// Übersetzungen für den Edit-Modus
$.extend(true, systemDictionary, {
    headerTextConn: { en: 'Headline', de: 'Überschrift' },
    oidConnections: { en: 'Connections Object ID', de: 'Verbindungen Objekt ID' },
    maxConnections: { en: 'Max. Connections', de: 'Max. Verbindungen' },
    showClockConn: { en: 'Show Clock', de: 'Uhr anzeigen' },
});

// Widget Binding
vis.binds['public-transportConnections'] = {
    version: '0.0.6',

    showVersion: function () {
        if (vis.binds['public-transportConnections'].version) {
            console.log('Version public-transportConnections: ' + vis.binds['public-transportConnections'].version);
            vis.binds['public-transportConnections'].version = null;
        }
    },

    /**
     * Erstellt das Verbindungstabellen-Widget
     *
     * @param    widgetID - Die ID des Widgets
     * @param    view - Die aktuelle Ansicht
     * @param    data - Die Konfigurationsdaten des Widgets
     * @param    style - Die Stil-Daten des Widgets
     */
    createConnections: function (widgetID, view, data, style) {
        const $div = $('#' + widgetID);

        // Falls Element nicht gefunden => warten
        if (!$div.length) {
            return setTimeout(function () {
                vis.binds['public-transportConnections'].createConnections(widgetID, view, data, style);
            }, 100);
        }

        // Standard-Werte setzen
        const headerText = data.headerTextConn || 'Verbindungen';
        const maxConnections = data.maxConnections || 10;
        const showClock = data.showClockConn === true;

        // HTML-Struktur erstellen
        let html = '';
        html += '<div class="pub-trans-conn-container ' + data.class + '">';

        // Header
        html += '<div class="pub-trans-conn-header">';
        html += headerText;
        if (showClock) {
            html += '<div class="pub-trans-conn-clock" id="clock-conn-' + widgetID + '">--:--</div>';
        }
        html += '</div>';

        // Spaltenüberschriften
        html += '<div class="pub-trans-conn-column-header">';
        html += '<div class="col-dep-time">Abfahrt</div>';
        html += '<div class="col-dep-delay">Line</div>';
        html += '<div class="col-dep-delay">Verspätung</div>';
        html += '<div class="col-dep-platform">Gleis Ab</div>';
        html += '<div class="col-arr-time">Ankunft</div>';
        //html += '<div class="col-arr-delay">Verspätung</div>';
        //html += '<div class="col-arr-platform">Gleis An</div>';
        html += '<div class="col-transfers">Umstiege</div>';
        html += '<div class="col-info">Info</div>';
        html += '</div>';

        // Content-Bereich für Verbindungen
        html += '<div class="pub-trans-conn-content" id="content-conn-' + widgetID + '">';
        html += '<div class="pub-trans-conn-loading">Lade Daten</div>';
        html += '</div>';

        html += '</div>';

        // Modal für Details
        html += '<div class="pub-trans-conn-modal" id="modal-conn-' + widgetID + '">';
        html += '<div class="pub-trans-conn-modal-content">';
        html += '<div class="pub-trans-conn-modal-header">';
        html += '<span class="pub-trans-conn-modal-close" id="close-modal-' + widgetID + '">&times;</span>';
        html += 'Verbindungsdetails';
        html += '</div>';
        html += '<div id="modal-body-' + widgetID + '"></div>';
        html += '</div>';
        html += '</div>';

        $div.html(html);

        // Modal-Close Event
        $('#close-modal-' + widgetID).on('click', function () {
            $('#modal-conn-' + widgetID).removeClass('active');
        });

        // Klick außerhalb des Modals schließt es
        $('#modal-conn-' + widgetID).on('click', function (e) {
            if (e.target.id === 'modal-conn-' + widgetID) {
                $('#modal-conn-' + widgetID).removeClass('active');
            }
        });

        // Funktionen zum Aktualisieren der Anzeige
        function updateClock() {
            if (!showClock) return;

            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            $('#clock-conn-' + widgetID).text(hours + ':' + minutes);
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

        function formatTime(timeString) {
            if (!timeString) return '--:--';
            const timeObj = new Date(timeString);
            if (isNaN(timeObj.getTime())) return '--:--';
            return (
                String(timeObj.getHours()).padStart(2, '0') + ':' + String(timeObj.getMinutes()).padStart(2, '0')
            );
        }

        function formatDelay(delay) {
            if (!delay || delay === 0) {
                return '<span class="pub-trans-conn-delay ontime">0</span>';
            } else if (delay > 0) {
                const minutes = Math.round(delay / 60);
                return '<span class="pub-trans-conn-delay delayed">+' + minutes + '</span>';
            } else {
                const minutes = Math.round(delay / 60);
                return '<span class="pub-trans-conn-delay ontime">' + minutes + '</span>';
            }
        }

        function getTransferCount(journey) {
            if (!journey || !journey.legs) return 0;
            // Zähle nur nicht-Fußwege als Transfer
            let transfers = 0;
            for (let i = 0; i < journey.legs.length; i++) {
                const leg = journey.legs[i];
                if (!leg.walking && leg.line) {
                    transfers++;
                }
            }
            return Math.max(0, transfers - 1); // -1 weil erste Fahrt kein Transfer ist
        }

        // SVG-Icons für Remark-Typen
        const SVG_WARNING = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" class="pub-trans-conn-remark-icon"><circle cx="12" cy="12" r="11" fill="#cc0000"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="16" font-weight="bold" font-family="Arial,sans-serif">!</text></svg>';
        const SVG_HINT    = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 26" width="18" height="16" class="pub-trans-conn-remark-icon"><polygon points="14,1 27,25 1,25" fill="#ffcc00"/><text x="14" y="22" text-anchor="middle" fill="#000000" font-size="13" font-weight="bold" font-family="Arial,sans-serif">!</text></svg>';
        const SVG_STATUS  = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" class="pub-trans-conn-remark-icon"><circle cx="12" cy="12" r="11" fill="#0066b3"/><text x="12" y="17" text-anchor="middle" fill="white" font-size="14" font-style="italic" font-weight="bold" font-family="Arial,sans-serif">i</text></svg>';

        function groupRemarksByType(remarks) {
            const hints = [];
            const warnings = [];
            const statuses = [];

            for (const remark of remarks) {
                switch (remark.type) {
                    case 'hint':
                        hints.push(remark.text || '');
                        break;
                    case 'warning':
                        warnings.push(remark.text || '');
                        break;
                    case 'status':
                        statuses.push(remark.text || '');
                        break;
                }
            }

            return {
                hint: hints.length > 0 ? hints.join('<br>') : undefined,
                warning: warnings.length > 0 ? warnings.join('<br>') : undefined,
                status: statuses.length > 0 ? statuses.join('<br>') : undefined,
            };
        }

        function showJourneyDetails(journey) {
            const $modalBody = $('#modal-body-' + widgetID);
            let html = '';

            if (!journey || !journey.legs) {
                html = '<div class="pub-trans-conn-no-data">Keine Details verfügbar</div>';
                $modalBody.html(html);
                $('#modal-conn-' + widgetID).addClass('active');
                return;
            }

            journey.legs.forEach(function (leg, index) {
                const isWalking = leg.walking === true;
                const product = leg.line && leg.line.product ? leg.line.product : 'walking';
                const lineName = leg.line && leg.line.name ? leg.line.name : 'Fußweg';
                const direction = leg.direction || '';
                const legDepDelay = leg.departureDelay || 0;
                const legArrDelay = leg.arrivalDelay || 0;
                const legHasDelay = !isWalking && (legDepDelay > 0 || legArrDelay > 0);

                html += '<div class="pub-trans-conn-leg' + (isWalking ? ' walking' : '') + (legHasDelay ? ' delayed' : '') + '">';

                // Header
                html += '<div class="pub-trans-conn-leg-header">';
                html +=
                    '<span class="pub-trans-conn-leg-icon ' +
                    (isWalking ? 'walking' : getProductClass(product)) +
                    '">' +
                    lineName +
                    '</span>';
                html += '<span class="pub-trans-conn-leg-direction">' + (isWalking ? 'Fußweg' : direction) + '</span>';
                html += '</div>';

                // Details
                html += '<div class="pub-trans-conn-leg-details">';

                // Abfahrt
                if (!isWalking) {
                    const depTime = formatTime(leg.departure);
                    const depDelay = leg.departureDelay || 0;
                    const depPlatform = leg.departurePlatform || '--';
                    const depPlannedPlatform = leg.plannedDeparturePlatform || null;
                    const depPlatformChanged = depPlannedPlatform && depPlannedPlatform !== depPlatform;

                    html += '<div class="pub-trans-conn-leg-detail-item">';
                    html += '<span class="pub-trans-conn-leg-detail-label">Abfahrt:</span>';
                    html += '<span class="pub-trans-conn-leg-detail-value">' + depTime;
                    if (depDelay !== 0) {
                        html +=
                            ' <span class="pub-trans-conn-delay ' +
                            (depDelay > 0 ? 'delayed' : 'ontime') +
                            '">(+' +
                            Math.round(depDelay / 60) +
                            ' min)</span>';
                    }
                    html += '</span>';
                    html += '</div>';

                    html += '<div class="pub-trans-conn-leg-detail-item">';
                    html += '<span class="pub-trans-conn-leg-detail-label">Gleis Ab:</span>';
                    html +=
                        '<span class="pub-trans-conn-leg-detail-value' +
                        (depPlatformChanged ? ' changed' : '') +
                        '">' +
                        depPlatform +
                        '</span>';
                    html += '</div>';
                }

                // Ankunft
                const arrTime = formatTime(leg.arrival);
                const arrDelay = leg.arrivalDelay || 0;
                const arrPlatform = leg.arrivalPlatform || '--';
                const arrPlannedPlatform = leg.plannedArrivalPlatform || null;
                const arrPlatformChanged = arrPlannedPlatform && arrPlannedPlatform !== arrPlatform;

                html += '<div class="pub-trans-conn-leg-detail-item">';
                html += '<span class="pub-trans-conn-leg-detail-label">Ankunft:</span>';
                html += '<span class="pub-trans-conn-leg-detail-value">' + arrTime;
                if (arrDelay !== 0 && !isWalking) {
                    html +=
                        ' <span class="pub-trans-conn-delay ' +
                        (arrDelay > 0 ? 'delayed' : 'ontime') +
                        '">(+' +
                        Math.round(arrDelay / 60) +
                        ' min)</span>';
                }
                html += '</span>';
                html += '</div>';

                if (!isWalking) {
                    html += '<div class="pub-trans-conn-leg-detail-item">';
                    html += '<span class="pub-trans-conn-leg-detail-label">Gleis An:</span>';
                    html +=
                        '<span class="pub-trans-conn-leg-detail-value' +
                        (arrPlatformChanged ? ' changed' : '') +
                        '">' +
                        arrPlatform +
                        '</span>';
                    html += '</div>';
                }

                // Fußweg-Distanz
                if (isWalking) {
                    html += '<div class="pub-trans-conn-leg-detail-item">';
                    html += '<span class="pub-trans-conn-leg-detail-label">Distanz:</span>';
                    html += '<span class="pub-trans-conn-leg-detail-value">' + (leg.distance ? leg.distance + ' m' : ' --') + '</span>';
                    html += '</div>';
                }

                // Origin und Destination
                if (leg.origin && leg.origin.name) {
                    html += '<div class="pub-trans-conn-leg-detail-item">';
                    html += '<span class="pub-trans-conn-leg-detail-label">Von:</span>';
                    html += '<span class="pub-trans-conn-leg-detail-value">' + leg.origin.name + '</span>';
                    html += '</div>';
                }

                if (leg.destination && leg.destination.name) {
                    html += '<div class="pub-trans-conn-leg-detail-item">';
                    html += '<span class="pub-trans-conn-leg-detail-label">Nach:</span>';
                    html += '<span class="pub-trans-conn-leg-detail-value">' + leg.destination.name + '</span>';
                    html += '</div>';
                }

                html += '</div>'; // leg-details

                // Remarks der Teilstrecke
                if (leg.remarks && leg.remarks.length > 0) {
                    const legRemarks = groupRemarksByType(leg.remarks);
                    if (legRemarks.warning || legRemarks.hint || legRemarks.status) {
                        html += '<div class="pub-trans-conn-leg-remarks">';
                        if (legRemarks.warning) {
                            html += '<div class="pub-trans-conn-leg-remark-section warning">';
                            html += SVG_WARNING;
                            html += '<span class="pub-trans-conn-leg-remark-text">' + legRemarks.warning + '</span>';
                            html += '</div>';
                        }
                        if (legRemarks.hint) {
                            html += '<div class="pub-trans-conn-leg-remark-section hint">';
                            html += SVG_HINT;
                            html += '<span class="pub-trans-conn-leg-remark-text">' + legRemarks.hint + '</span>';
                            html += '</div>';
                        }
                        if (legRemarks.status) {
                            html += '<div class="pub-trans-conn-leg-remark-section status">';
                            html += SVG_STATUS;
                            html += '<span class="pub-trans-conn-leg-remark-text">' + legRemarks.status + '</span>';
                            html += '</div>';
                        }
                        html += '</div>'; // leg-remarks
                    }
                }

                html += '</div>'; // leg
            });

            // Preis anzeigen wenn vorhanden
            if (journey.price && journey.price.amount) {
                html += '<div class="pub-trans-conn-leg" style="background-color: #2c2c2c;">';
                html += '<div class="pub-trans-conn-leg-detail-item">';
                html += '<span class="pub-trans-conn-leg-detail-label">Preis:</span>';
                html +=
                    '<span class="pub-trans-conn-leg-detail-value">' +
                    journey.price.amount.toFixed(2) +
                    ' ' +
                    journey.price.currency +
                    '</span>';
                html += '</div>';
                html += '</div>';
            }

            $modalBody.html(html);
            $('#modal-conn-' + widgetID).addClass('active');
        }

        function renderConnections(journeys) {
            const $content = $('#content-conn-' + widgetID);

            // Begrenze auf maxConnections
            const displayJourneys = journeys.slice(0, maxConnections);

            console.log('[Connections Render] Anzahl Verbindungen zu rendern:', displayJourneys.length);

            let html = '';
            displayJourneys.forEach(function (journey, index) {
                if (!journey.legs || journey.legs.length === 0) {
                    return;
                }

                // Erste und letzte Leg für Abfahrt/Ankunft
                const firstLeg = journey.legs.find((leg) => !leg.walking && leg.line) || journey.legs[0];
                const lastLeg = journey.legs[journey.legs.length - 1];

                const depTime = formatTime(firstLeg.departure || firstLeg.plannedDeparture);
                const depDelay = firstLeg.departureDelay || 0;
                const depPlatform = firstLeg.departurePlatform || '--';
                const depPlannedPlatform = firstLeg.plannedDeparturePlatform || null;
                const depPlatformChanged = depPlannedPlatform && depPlannedPlatform !== depPlatform;
                const depLine = firstLeg.line && firstLeg.line.name ? firstLeg.line.name : ' --';

                const arrTime = formatTime(lastLeg.arrival || lastLeg.plannedArrival);
                const arrDelay = lastLeg.arrivalDelay || 0;
                const arrPlatform = lastLeg.arrivalPlatform || '--';
                const arrPlannedPlatform = lastLeg.plannedArrivalPlatform || null;
                const arrPlatformChanged = arrPlannedPlatform && arrPlannedPlatform !== arrPlatform;

                const transfers = getTransferCount(journey);
                const journeyHasDelay = depDelay > 0 || arrDelay > 0;

                // Remarks aus allen Legs sammeln
                const journeyRemarks = { warning: undefined, hint: undefined, status: undefined };
                journey.legs.forEach(function (leg) {
                    if (leg.remarks && leg.remarks.length > 0) {
                        const lr = groupRemarksByType(leg.remarks);
                        if (lr.warning) journeyRemarks.warning = lr.warning;
                        if (lr.hint) journeyRemarks.hint = lr.hint;
                        if (lr.status) journeyRemarks.status = lr.status;
                    }
                });

                let iconsHtml = '';
                if (journeyRemarks.warning) iconsHtml += SVG_WARNING;
                if (journeyRemarks.hint) iconsHtml += SVG_HINT;
                if (journeyRemarks.status) iconsHtml += SVG_STATUS;

                html += '<div class="pub-trans-conn-row' + (journeyHasDelay ? ' delayed' : '') + '" data-journey-index="' + index + '">';
                html += '<div class="pub-trans-conn-time">' + depTime + '</div>';
                html += '<div>' + depLine + '</div>';
                html += '<div>' + formatDelay(depDelay) + '</div>';
                html +=
                    '<div class="pub-trans-conn-platform' +
                    (depPlatformChanged ? ' changed' : '') +
                    '">' +
                    depPlatform +
                    '</div>';
                html += '<div class="pub-trans-conn-time">' + arrTime + '</div>';
                //html += '<div>' + formatDelay(arrDelay) + '</div>';
                /*html +=
                    '<div class="pub-trans-conn-platform' +
                    (arrPlatformChanged ? ' changed' : '') +
                    '">' +
                    arrPlatform +
                    '</div>'; */
                html += '<div class="pub-trans-conn-transfers">' + transfers + '</div>';
                html += '<div class="pub-trans-conn-info-cell">' + iconsHtml + '</div>';
                html += '</div>';
            });

            $content.html(html);

            // Click-Handler für die Zeilen (nur innerhalb dieses Widgets)
            $content.find('.pub-trans-conn-row').on('click', function () {
                const journeyIndex = $(this).data('journey-index');
                showJourneyDetails(journeys[journeyIndex]);
            });
        }

        function updateConnections(e, newVal, oldVal) {
            let data = null;

            try {
                if (typeof newVal === 'string') {
                    data = JSON.parse(newVal);
                } else if (typeof newVal === 'object') {
                    data = newVal;
                }
            } catch (err) {
                console.error('[Connections] Error parsing connections data:', err);
                $('#content-conn-' + widgetID).html(
                    '<div class="pub-trans-conn-no-data">Fehler beim Laden der Daten</div>',
                );
                return;
            }

            const $content = $('#content-conn-' + widgetID);

            if (!data || !data.journeys || data.journeys.length === 0) {
                console.log('[Connections] Keine Verbindungen verfügbar');
                $content.html('<div class="pub-trans-conn-no-data">Keine Verbindungen verfügbar</div>');
                return;
            }

            console.log('[Connections] Geladene Verbindungen:', data.journeys.length);
            renderConnections(data.journeys);
        }

        // State-Binding einrichten
        if (data.oidConnections) {
            vis.states.bind(data.oidConnections + '.val', updateConnections);
            $div.data('bound', [data.oidConnections + '.val']);
            $div.data('bindHandler', updateConnections);

            // Initiale Aktualisierung
            if (vis.states[data.oidConnections + '.val']) {
                updateConnections(null, vis.states[data.oidConnections + '.val'], null);
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
            if (data.oidConnections && vis.states[data.oidConnections + '.val']) {
                updateConnections(null, vis.states[data.oidConnections + '.val'], null);
            }

            // Erste Aktualisierung zur nächsten vollen Minute
            const msUntilNextMinute = getMillisecondsUntilNextMinute();
            setTimeout(function () {
                // Aktualisierung durchführen
                if (showClock) {
                    updateClock();
                }
                if (data.oidConnections && vis.states[data.oidConnections + '.val']) {
                    updateConnections(null, vis.states[data.oidConnections + '.val'], null);
                }

                // Danach jede volle Minute wiederholen
                setInterval(function () {
                    if (showClock) {
                        updateClock();
                    }
                    if (data.oidConnections && vis.states[data.oidConnections + '.val']) {
                        updateConnections(null, vis.states[data.oidConnections + '.val'], null);
                    }
                }, 60000);
            }, msUntilNextMinute);
        }

        // Starte die Minuten-Aktualisierung
        scheduleMinuteUpdate();
    },
};

// Bei Initialisierung das Widget anmelden
vis.binds['public-transportConnections'].showVersion();
