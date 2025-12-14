import type * as Hafas from 'hafas-client';
import type { DepartureState, JourneyState, StationState } from '../types/types';
/**
 * Gruppiert Remarks nach Typ und fasst deren Texte zusammen
 *
 * @param remarks Array von Remark Objekten
 */
function groupRemarksByType(remarks: readonly (Hafas.Hint | Hafas.Status | Hafas.Warning)[]): {
    hint: string | undefined;
    warning: string | undefined;
    status: string | undefined;
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
        hint: hints.length > 0 ? hints.join('\n') : undefined,
        warning: warnings.length > 0 ? warnings.join('\n') : undefined,
        status: statuses.length > 0 ? statuses.join('\n') : undefined,
    };
}

/**
 * Konvertiert HAFAS Departure zu reduzierten DepartureState
 *
 * @param departure HAFAS Departure Objekt
 */
export function mapDepartureToDepartureState(departure: Hafas.Alternative): DepartureState {
    return {
        when: departure.when ?? undefined,
        plannedWhen: departure.plannedWhen ?? undefined,
        delay: departure.delay ?? undefined,
        direction: departure.direction ?? undefined,
        platform: departure.platform ?? undefined,
        plannedPlatform: departure.plannedPlatform ?? undefined,
        line: {
            name: departure.line?.name ?? undefined,
            fahrtNr: departure.line?.fahrtNr ?? undefined,
            productName: departure.line?.productName ?? undefined,
            mode: departure.line?.mode ?? undefined,
            product: departure.line?.product ?? undefined,
            operator: departure.line?.operator?.name ?? undefined,
        },
        remarks: groupRemarksByType(departure.remarks ?? []),
        stopinfo: {
            name: departure.stop?.name ?? undefined,
            id: departure.stop?.id ?? undefined,
            type: departure.stop?.type ?? undefined,
            location: departure.stop?.location
                ? {
                      latitude: departure.stop.location.latitude ?? undefined,
                      longitude: departure.stop.location.longitude ?? undefined,
                  }
                : undefined,
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

export function mapStationToStationState(station: Hafas.Station): StationState {
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
        stops:
            station.type === 'station'
                ? (station.stops
                      ?.filter((stop): stop is Hafas.Stop => stop.type === 'stop')
                      .map(stop => ({
                          name: stop.name ?? undefined,
                          id: stop.id ?? undefined,
                          type: stop.type ?? undefined,
                          location: stop.location
                              ? {
                                    latitude: stop.location.latitude ?? undefined,
                                    longitude: stop.location.longitude ?? undefined,
                                }
                              : undefined,
                          products: stop.products
                              ? {
                                    suburban: stop.products.suburban ?? undefined,
                                    subway: stop.products.subway ?? undefined,
                                    tram: stop.products.tram ?? undefined,
                                    bus: stop.products.bus ?? undefined,
                                    ferry: stop.products.ferry ?? undefined,
                                    express: stop.products.express ?? undefined,
                                    regional: stop.products.regional ?? undefined,
                                    regionalexpress: stop.products.regionalExpress ?? undefined,
                                    national: stop.products.national ?? undefined,
                                    nationalexpress: stop.products.nationalExpress ?? undefined,
                                }
                              : undefined,
                      })) ?? undefined)
                : undefined,
    };
}

export function mapJourneyToJourneyState(journey: Hafas.Journey): JourneyState {
    return {
        section:
            journey.legs?.map(leg => ({
                tripId: leg.tripId ?? undefined,
                stationFrom: {
                    id: leg.origin?.id ?? undefined,
                    name: leg.origin?.name ?? undefined,
                    type: leg.origin?.type ?? undefined,
                    location:
                        leg.origin?.type === 'station' || leg.origin?.type === 'stop'
                            ? leg.origin.location
                                ? {
                                      latitude: leg.origin.location.latitude ?? undefined,
                                      longitude: leg.origin.location.longitude ?? undefined,
                                  }
                                : undefined
                            : undefined,
                    //products: leg.origin && 'products' in leg.origin ? leg.origin.products : undefined,
                },
                stationTo: {
                    id: leg.destination?.id ?? undefined,
                    name: leg.destination?.name ?? undefined,
                    type: leg.destination?.type ?? undefined,
                    location:
                        leg.destination?.type === 'station' || leg.destination?.type === 'stop'
                            ? leg.destination.location
                                ? {
                                      latitude: leg.destination.location.latitude ?? undefined,
                                      longitude: leg.destination.location.longitude ?? undefined,
                                  }
                                : undefined
                            : undefined,
                    //products: leg.destination && 'products' in leg.destination ? leg.destination.products : undefined,
                },
                departure: leg.departure ?? undefined,
                plannedDeparture: leg.plannedDeparture ?? undefined,
                departureDelay: leg.departureDelay ?? undefined,
                arrival: leg.arrival ?? undefined,
                plannedArrival: leg.plannedArrival ?? undefined,
                arrivalDelay: leg.arrivalDelay ?? undefined,
                //reachable: leg.reachable ?? undefined,
                line: leg.line
                    ? {
                          //type: leg.line.type ?? undefined,
                          id: leg.line.id ?? undefined,
                          name: leg.line.name ?? undefined,
                          fahrtNr: leg.line.fahrtNr ?? undefined,
                          productName: leg.line.productName ?? undefined,
                          mode: leg.line.mode ?? undefined,
                          product: leg.line.product ?? undefined,
                          operator: leg.line.operator?.name ?? undefined,
                      }
                    : undefined,
                direction: leg.direction ?? undefined,
                arrivalPlatform: leg.arrivalPlatform ?? undefined,
                plannedArrivalPlatform: leg.plannedArrivalPlatform ?? undefined,
                departurePlatform: leg.departurePlatform ?? undefined,
                plannedDeparturePlatform: leg.plannedDeparturePlatform ?? undefined,
                arrivalPrognosisType: leg.arrivalPrognosisType ?? undefined,
                departurePrognosisType: leg.departurePrognosisType ?? undefined,
                walking: leg.walking ?? undefined,
                distance: leg.distance ?? undefined,
                remarks: leg.remarks ? groupRemarksByType(leg.remarks) : undefined,
                /*cycle: leg.cycle
                    ? {
                          min: leg.cycle.min ?? undefined,
                          max: leg.cycle.max ?? undefined,
                          nr: leg.cycle.nr ?? undefined,
                      }
                    : undefined,*/
                alternatives: leg.alternatives?.map(alt => ({
                    tripId: alt.tripId ?? undefined,
                    line: alt.line
                        ? {
                              type: alt.line.type ?? undefined,
                              id: alt.line.id ?? undefined,
                              name: alt.line.name ?? undefined,
                              fahrtNr: alt.line.fahrtNr ?? undefined,
                              productName: alt.line.productName ?? undefined,
                              mode: alt.line.mode ?? undefined,
                              product: alt.line.product ?? undefined,
                              operator: alt.line.operator?.name ?? undefined,
                          }
                        : undefined,
                    direction: alt.direction ?? undefined,
                    when: alt.when ?? undefined,
                    plannedWhen: alt.plannedWhen ?? undefined,
                    delay: alt.delay ?? undefined,
                })),
            })) ?? undefined,
        //remarks: journey.remarks ? groupRemarksByType(journey.remarks) : undefined,
        //refreshToken: journey.refreshToken ?? undefined,
    };
}

/**
 * Konvertiert Array von Journeys zu Array von JourneyStates
 * Jede Journey bleibt als separate Einheit mit ihren Legs erhalten
 *
 * @param journeys Array von HAFAS Journey Objekten
 */
export function mapJourneysToJourneyStates(journeys: readonly Hafas.Journey[]): JourneyState[] {
    return journeys.map(mapJourneyToJourneyState);
}
