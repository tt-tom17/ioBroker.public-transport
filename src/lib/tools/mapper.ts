import type { Departure, DepartureState, DeparturesResponse, Remark } from '../types/types';

/**
 * Gruppiert Remarks nach Typ und fasst deren Texte zusammen
 *
 * @param remarks Array von Remark Objekten
 */
function groupRemarksByType(remarks: Remark[]): {
    hint: string | null;
    warning: string | null;
    status: string | null;
} {
    const hints: string[] = [];
    const warnings: string[] = [];
    const statuses: string[] = [];

    for (const remark of remarks) {
        switch (remark.type) {
            case 'hint':
                hints.push(remark.text);
                break;
            case 'warning':
                warnings.push(remark.text);
                break;
            case 'status':
                statuses.push(remark.text);
                break;
        }
    }

    return {
        hint: hints.length > 0 ? hints.join('\n') : null,
        warning: warnings.length > 0 ? warnings.join('\n') : null,
        status: statuses.length > 0 ? statuses.join('\n') : null,
    };
}

/**
 * Konvertiert HAFAS Departure zu reduzierten DepartureState
 *
 * @param departure HAFAS Departure Objekt
 */
export function mapDepartureToDepartureState(departure: Departure): DepartureState {
    return {
        when: departure.when,
        plannedWhen: departure.plannedWhen,
        delay: departure.delay,
        direction: departure.direction,
        platform: departure.platform,
        plannedPlatform: departure.plannedPlatform,
        line: {
            name: departure.line.name,
            fahrtNr: departure.line.fahrtNr,
            productName: departure.line.productName,
            mode: departure.line.mode,
            operator: departure.line.operator.name,
        },
        remarks: groupRemarksByType(departure.remarks),
    };
}

/**
 * Konvertiert Array von Departures zu Array von DepartureStates
 *
 * @param departures Array von HAFAS Departure Objekten
 */
export function mapDeparturesToDepartureStates(departures: Departure[]): DepartureState[] {
    return departures.map(mapDepartureToDepartureState);
}

/**
 * Konvertiert DeparturesResponse zu Array von DepartureStates
 *
 * @param response HAFAS DeparturesResponse Objekt
 */
export function mapDeparturesResponseToStates(response: DeparturesResponse): DepartureState[] {
    return mapDeparturesToDepartureStates(response.departures);
}
