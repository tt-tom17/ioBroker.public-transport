import type * as Hafas from 'hafas-client';
import type { PublicTransport } from '../../main';
import { BaseClass } from '../tools/library';
import type { DepartureState } from '../types/types';

export class NsPanelTimetable extends BaseClass {
    constructor(adapter: PublicTransport) {
        super(adapter);
        this.log.setLogPrefix('nsPanelTimetable');
    }

    /**
     * Schreibt den nspanel-Channel für eine Abfahrt.
     *
     * @param prefix     Vollständiger Pfad zur Abfahrt (z.B. `adapter.namespace.Stations.id.Departures_00`)
     * @param departure  Die Abfahrts-State-Daten
     * @param index      Index der Abfahrt (0, 1, 2, ...)
     */
    async writeDepartureNsPanel(prefix: string, departure: DepartureState, index: number): Promise<void> {
        // Channel
        await this.library.writedp(`${prefix}.nspanelDep${index}`, undefined, {
            _id: 'nicht_definieren',
            type: 'channel',
            common: {
                name: `nspanelDep${index}`,
                role: 'timeTable',
            },
            native: {},
        });
        // ACTUAL – Ist-Abfahrtszeit
        await this.library.writedp(`${prefix}.nspanelDep${index}.ACTUAL`, departure.when ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Ist-Abfahrtszeit', en: 'Actual departure time' },
                type: 'string',
                role: 'date',
                read: true,
                write: false,
            },
            native: {},
        });
        // VEHICLE – Fahrzeugtyp (line.mode)
        await this.library.writedp(`${prefix}.nspanelDep${index}.VEHICLE`, departure.line?.mode ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Fahrzeugtyp', en: 'Vehicle type' },
                type: 'string',
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
        // DEPARTURE – Geplante Abfahrtszeit
        await this.library.writedp(`${prefix}.nspanelDep${index}.DEPARTURE`, departure.plannedWhen ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Geplante Abfahrt', en: 'Planned departure' },
                type: 'string',
                role: 'date',
                read: true,
                write: false,
            },
            native: {},
        });
        // DELAY – Verspätung in Sekunden
        await this.library.writedp(`${prefix}.nspanelDep${index}.DELAY`, departure.delay ?? 0, {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Verspätung', en: 'Delay' },
                type: 'number',
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
        // DIRECTION – Richtung/Ziel
        await this.library.writedp(`${prefix}.nspanelDep${index}.DIRECTION`, departure.direction ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Richtung', en: 'Direction' },
                type: 'string',
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
    }

    /**
     * Schreibt den nspanel-Channel für eine Verbindung (Journey).
     *
     * @param prefix   Vollständiger Pfad zur Journey (z.B. `adapter.namespace.Journeys.id.Journey_00`)
     * @param journey  Die Verbindungsdaten (erstes Leg = Abfahrt, letztes Leg = Ziel)
     * @param index    Index der Journey (0, 1, 2, ...)
     */
    async writeJourneyNsPanel(prefix: string, journey: Hafas.Journey, index: number): Promise<void> {
        const firstLeg = journey.legs[0];
        const firstNonWalkingLeg = journey.legs.find(leg => leg.walking !== true);
        //const lastLeg = journey.legs[journey.legs.length - 1];

        // Channel
        await this.library.writedp(`${prefix}.nspanelJourney${index}`, undefined, {
            _id: 'nicht_definieren',
            type: 'channel',
            common: {
                name: `nspanelJourney${index}`,
                role: 'timeTable',
            },
            native: {},
        });
        // ACTUAL – Ist-Abfahrtszeit des ersten Legs
        await this.library.writedp(`${prefix}.nspanelJourney${index}.ACTUAL`, firstLeg.departure ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Ist-Abfahrtszeit', en: 'Actual departure time' },
                type: 'string',
                role: 'date',
                read: true,
                write: false,
            },
            native: {},
        });
        // VEHICLE – Fahrzeugtyp des ersten Fahrzeug-Legs (line.mode)
        await this.library.writedp(`${prefix}.nspanelJourney${index}.VEHICLE`, firstNonWalkingLeg?.line?.mode ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Fahrzeugtyp', en: 'Vehicle type' },
                type: 'string',
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
        // DEPARTURE – Geplante Abfahrtszeit des ersten Legs
        await this.library.writedp(`${prefix}.nspanelJourney${index}.DEPARTURE`, firstLeg.plannedDeparture ?? '', {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Geplante Abfahrt', en: 'Planned departure' },
                type: 'string',
                role: 'date',
                read: true,
                write: false,
            },
            native: {},
        });
        // DELAY – Verspätung in Sekunden des ersten Legs
        await this.library.writedp(`${prefix}.nspanelJourney${index}.DELAY`, firstLeg.departureDelay ?? 0, {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Verspätung', en: 'Delay' },
                type: 'number',
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
        // DIRECTION – Name der Zielstation (letztes Leg)
        const dirAndLine =
            firstLeg.direction && firstLeg.line?.name
                ? `(${firstLeg.line?.name}) ${firstLeg.direction}`
                : (firstLeg.direction ?? firstLeg.line?.name ?? '');
        await this.library.writedp(`${prefix}.nspanelJourney${index}.DIRECTION`, dirAndLine, {
            _id: 'nicht_definieren',
            type: 'state',
            common: {
                name: { de: 'Richtung', en: 'Direction' },
                type: 'string',
                role: 'state',
                read: true,
                write: false,
            },
            native: {},
        });
    }
}
