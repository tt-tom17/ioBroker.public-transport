import type * as Hafas from 'hafas-client';
import type { DepartureState, StationState } from '../types/types';
/**
 * Gruppiert Remarks nach Typ und fasst deren Texte zusammen
 *
 * @param remarks Array von Remark Objekten
 */
function groupRemarksByType(remarks: readonly (Hafas.Hint | Hafas.Status | Hafas.Warning)[]): {
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
export function mapDepartureToDepartureState(departure: Hafas.Alternative): DepartureState {
    return {
        when: departure.when ?? null,
        plannedWhen: departure.plannedWhen ?? null,
        delay: departure.delay ?? null,
        direction: departure.direction ?? null,
        platform: departure.platform ?? null,
        plannedPlatform: departure.plannedPlatform ?? null,
        line: {
            name: departure.line?.name ?? null,
            fahrtNr: departure.line?.fahrtNr ?? null,
            productName: departure.line?.productName ?? null,
            mode: departure.line?.mode ?? null,
            operator: departure.line?.operator?.name ?? null,
        },
        remarks: groupRemarksByType(departure.remarks ?? []),
        stopinfo: {
            name: departure.stop?.name ?? null,
            id: departure.stop?.id ?? null,
            type: departure.stop?.type ?? null,
            location: departure.stop?.location
                ? {
                      latitude: departure.stop.location.latitude ?? null,
                      longitude: departure.stop.location.longitude ?? null,
                  }
                : null,
        },
    };
}

/**
 * Konvertiert Array von Departures zu Array von DepartureStates
 *
 * @param departures Array von HAFAS Departure Objekten
 */
export function mapDeparturesToDepartureStates(departures: readonly Hafas.Alternative[]): DepartureState[] {
    return departures.map(mapDepartureToDepartureState);
}

/**
 * Konvertiert DeparturesResponse zu Array von DepartureStates
 *
 * @param response HAFAS DeparturesResponse Objekt
 */
export function mapDeparturesResponseToStates(response: Hafas.Departures): DepartureState[] {
    return mapDeparturesToDepartureStates(response.departures);
}

export function mapStationToStationState(station: Hafas.Station | Hafas.Stop): StationState {
    return {
        name: station.name,
        id: station.id,
        type: station.type,
        location: station.location
            ? {
                  latitude: station.location.latitude,
                  longitude: station.location.longitude,
              }
            : undefined,
    };
}
