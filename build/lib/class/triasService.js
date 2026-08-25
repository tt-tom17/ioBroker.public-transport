"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var triasService_exports = {};
__export(triasService_exports, {
  TriasService: () => TriasService
});
module.exports = __toCommonJS(triasService_exports);
var import_fast_xml_parser = require("fast-xml-parser");
var import_triasMapper = require("../tools/triasMapper");
var import_baseTransportService = require("./baseTransportService");
const TRIAS_NETWORKS = {
  /** MobiData BW (NVBW) – deckt ganz Baden-Württemberg samt VVS, KVV, naldo und DING ab. */
  bw: "https://efa-bw.de/trias"
};
const TRIAS_VERSION = "1.2";
const NS_TRIAS = "http://www.vdv.de/trias";
const NS_SIRI = "http://www.siri.org.uk/siri";
const MAX_DEPARTURE_RESULTS = 50;
const DEFAULT_JOURNEY_RESULTS = 5;
class TriasService extends import_baseTransportService.BaseTransportService {
  /** Profilname des Netzes, z. B. `bw`. Bestimmt die Basis-URL, s. {@link TRIAS_NETWORKS}. */
  profile;
  /** Zugangsschlüssel des Anwenders. Wird nie protokolliert, s. {@link maskKey}. */
  requestorRef;
  /**
   * `removeNSPrefix` blendet die Namensraum-Präfixe aus (`siri:RequestorRef` →
   * `RequestorRef`), sonst müsste jeder Pfad im Mapper das Präfix mitschleppen.
   * `isArray` erzwingt Listen für die Elemente, die je nach Trefferzahl mal einzeln und mal
   * mehrfach kommen – ohne das müsste jede Auswertung `Array.isArray()` prüfen und würde
   * genau dann falsch liegen, wenn es nur einen Treffer gibt.
   */
  parser = new import_fast_xml_parser.XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    trimValues: true,
    isArray: (name) => [
      "LocationResult",
      "StopEventResult",
      "TripResult",
      "TripLeg",
      "Attribute",
      "SituationFullRef",
      "LegIntermediates",
      "ErrorMessage",
      "PreviousCall",
      "OnwardCall"
    ].includes(name)
  });
  /**
   * @param adapter Die Adapter-Instanz
   * @param clientName Name/User-Agent, der an den Server übergeben wird
   * @param profile Profilname des Netzes aus der Instanz-Konfiguration (z. B. `bw`)
   * @param requestorRef Der vom Anbieter zugeteilte Zugangsschlüssel des Anwenders
   */
  constructor(adapter, clientName, profile, requestorRef) {
    super(adapter, clientName);
    this.profile = profile.trim();
    this.requestorRef = (requestorRef != null ? requestorRef : "").trim();
  }
  get serviceName() {
    return "TRIAS";
  }
  /**
   * Löst den Profilnamen in die Basis-URL auf. Fail-fast wie bei HAFAS und EFA: ohne bzw. mit
   * unbekanntem Profil startet der Adapter bewusst NICHT mit einem stillen Default, weil
   * sonst Fahrplandaten einer völlig anderen Region ausgeliefert würden.
   */
  resolveEndpoint() {
    const available = Object.keys(TRIAS_NETWORKS).map((name) => `'${name}'`).join(", ");
    if (!this.profile) {
      throw new Error(
        `No TRIAS network configured. Please select a TRIAS network (${available}) in the adapter settings.`
      );
    }
    const endpoint = TRIAS_NETWORKS[this.profile];
    if (!endpoint) {
      throw new Error(`unknown TRIAS network: ${this.profile}. available networks: ${available}.`);
    }
    return endpoint.replace(/\/+$/, "");
  }
  /**
   * Baut den Shim. Ein echter Client wird nicht erzeugt; geprüft wird deshalb beim Start,
   * dass Netz **und** Zugangsschlüssel gesetzt sind – ohne Schlüssel antwortet der Server mit
   * HTTP 403, und das erst beim ersten Poll zu bemerken wäre unnötig spät.
   */
  createClient() {
    this.resolveEndpoint();
    if (!this.requestorRef) {
      throw new Error(
        "No TRIAS access key configured. TRIAS providers issue an individual key per user; please request one from the provider and enter it in the adapter settings."
      );
    }
    const client = {
      departures: (station, options) => this.requestStopEvents(station, options, false),
      arrivals: async (station, options) => ({
        arrivals: (await this.requestStopEvents(station, options, true)).departures
      }),
      journeys: (from, to, options) => this.requestJourneys(from, to, options),
      locations: (name, options) => this.requestLocations(name, options == null ? void 0 : options.results),
      stop: (id) => this.requestStop(this.toStation(id).id),
      nearby: () => Promise.reject(new Error("The TRIAS backend does not support nearby searches.")),
      // Pflichtmethode des Interfaces, die der Adapter nirgends aufruft. TRIAS kennt keine
      // Entsprechung, deshalb die eigene Uhrzeit statt einer erfundenen Serverangabe.
      serverInfo: () => Promise.resolve({ serverTime: (/* @__PURE__ */ new Date()).toISOString() })
    };
    return client;
  }
  /**
   * Maskiert den Zugangsschlüssel in einem Text.
   *
   * Der Schlüssel ist ein personengebundenes Geheimnis. Er darf auch dann nicht im Log
   * landen, wenn zur Fehlersuche der ganze Request protokolliert wird – Anwender hängen
   * Logauszüge an Fehlermeldungen an.
   *
   * @param text Der zu maskierende Text
   */
  maskKey(text) {
    return this.requestorRef ? text.split(this.requestorRef).join("***") : text;
  }
  /**
   * Maskiert XML-Sonderzeichen.
   *
   * Pflicht, weil die Requests aus Textbausteinen entstehen: Ein Haltestellenname mit `&`
   * („Bahnhof & Busbahnhof") würde sonst ein ungültiges Dokument erzeugen.
   *
   * @param value Der einzusetzende Wert
   */
  escapeXml(value) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  }
  /**
   * Formatiert einen Zeitpunkt als TRIAS-Zeitangabe.
   *
   * ⚠️ TRIAS erwartet und liefert **UTC/Zulu** – anders als EFA-JSON, das die Anfragezeit in
   * lokaler Zeit will. Die Millisekunden werden abgeschnitten, weil `xs:dateTime` sie zwar
   * erlaubt, manche Server sie aber nicht erwarten.
   *
   * @param when Der gewünschte Zeitpunkt (Standard: jetzt)
   */
  formatTime(when) {
    const date = when ? new Date(when) : /* @__PURE__ */ new Date();
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  /**
   * Verpackt eine Anfrage in den TRIAS-Rahmen.
   *
   * Aufbau nach `Trias_RequestSupport.xsd`: Zeitstempel, Kennung des Anfragenden, eine
   * Nachrichtenkennung, dann die eigentliche Anfrage.
   *
   * @param payload Der Inhalt des `RequestPayload`
   */
  envelope(payload) {
    return `<?xml version="1.0" encoding="UTF-8"?><Trias version="${TRIAS_VERSION}" xmlns="${NS_TRIAS}" xmlns:siri="${NS_SIRI}"><ServiceRequest><siri:RequestTimestamp>${this.formatTime()}</siri:RequestTimestamp><siri:RequestorRef>${this.escapeXml(this.requestorRef)}</siri:RequestorRef><siri:MessageIdentifier>${this.escapeXml(this.clientName)}</siri:MessageIdentifier><RequestPayload>${payload}</RequestPayload></ServiceRequest></Trias>`;
  }
  /**
   * Setzt eine TRIAS-Anfrage ab und gibt die geparste Antwort zurück.
   *
   * @param name Sprechender Name der Anfrage fürs Log
   * @param payload Der Inhalt des `RequestPayload`
   */
  async request(name, payload) {
    const url = this.resolveEndpoint();
    const body = this.envelope(payload);
    this.adapter.log.debug(`[TRIAS] POST ${url} (${name}): ${this.maskKey(body)}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        Accept: "text/xml",
        "User-Agent": this.clientName
      },
      body
    });
    if (!response.ok) {
      const error = new Error(`TRIAS request failed: ${response.status} ${response.statusText}`);
      error.isCausedByServer = response.status >= 500;
      throw error;
    }
    return this.parser.parse(await response.text());
  }
  /**
   * Wertet die Fehlermeldung einer Antwort aus.
   *
   * ⚠️ **Die zentrale TRIAS-Falle:** In derselben Antwort steht `Code` auch unter
   * `Service/Attribute` – dort bezeichnet es Service-Merkmale wie Fahrradmitnahme, gemessen
   * wurden Werte wie `FK`, aber auch `"1"` und `"28"`. Wer Fehler am Feldnamen oder daran
   * erkennt, ob der Wert numerisch ist, meldet Dutzende Fehler, die keine sind. Deshalb wird
   * ausschließlich der Pfad `…Response/ErrorMessage` ausgewertet.
   *
   * Ein Fehler mit vorhandenen Daten wird nur protokolliert: TRIAS meldet z. B. `-4006`
   * („nur Fußweg gefunden") zusammen mit einem verwertbaren Ergebnis.
   *
   * Ebenso wenig ist ein leeres Ergebnis ein Fehler: TRIAS antwortet auf „keine Abfahrten im
   * Zeitfenster" mit `-4030` statt mit einer leeren Liste (s. {@link isEmptyResult}). Diese
   * Codes landen im Debug-Log, der Aufrufer bekommt sein leeres Ergebnis.
   *
   * @param messages Die Fehlermeldungen aus dem passenden Response-Element
   * @param hasResults true, wenn die Antwort trotzdem verwertbare Daten enthält
   */
  checkError(messages, hasResults) {
    const text = (0, import_triasMapper.readError)(messages);
    if (!text) {
      return;
    }
    if (hasResults) {
      this.adapter.log.debug(`[TRIAS] Server message: ${text}`);
      return;
    }
    if ((0, import_triasMapper.isEmptyResult)(messages)) {
      this.adapter.log.debug(`[TRIAS] empty result: ${text}`);
      return;
    }
    throw new Error(`TRIAS server reported: ${text}`);
  }
  /**
   * Baut eine Ortsreferenz.
   *
   * ⚠️ Laut Schema ist `LocationName` in `LocationRef` ein **Pflichtelement**. Die EFA-BW
   * verzichtet darauf (gemessen 24.08.2026: Anfrage ohne Namen liefert HTTP 200 mit Daten),
   * ein strenger TRIAS-Server könnte das anders sehen. Der Name wird deshalb mitgeschickt,
   * sobald er bekannt ist.
   *
   * @param id Die Haltestellen-ID (DHID/IFOPT, z. B. `de:08111:6115`)
   * @param name Der Haltestellenname, falls bekannt
   */
  locationRef(id, name) {
    const nameElement = name ? `<LocationName><Text>${this.escapeXml(name)}</Text></LocationName>` : "";
    return `<LocationRef><StopPointRef>${this.escapeXml(id)}</StopPointRef>${nameElement}</LocationRef>`;
  }
  /**
   * Baut den serverseitigen Produktfilter.
   *
   * ⚠️ **`<Exclude>false</Exclude>` ist zwingend.** Der Schema-Default ist `true`, der Filter
   * wirkt dann als **Ausschlussliste** – gemessen am 24.08.2026: Eine Anfrage mit
   * `<PtMode>bus</PtMode>` ohne `Exclude` lieferte ausschließlich Züge. Ein vergessenes
   * Element kehrt den Filter also lautlos um.
   *
   * @param products Der Produktfilter aus den Abfrage-Optionen
   */
  ptModeFilter(products) {
    const modes = (0, import_triasMapper.ptModesForProducts)(products);
    if (!modes || modes.length === 0) {
      return "";
    }
    const list = modes.map((mode) => `<PtMode>${mode}</PtMode>`).join("");
    return `<PtModeFilter><Exclude>false</Exclude>${list}</PtModeFilter>`;
  }
  /**
   * Löst die von hafas-client erlaubten Stations-Angaben (String oder Objekt) zu ID und Namen auf.
   *
   * @param station Die Station als ID oder Objekt
   */
  toStation(station) {
    if (typeof station === "string") {
      return { id: station };
    }
    const id = station.id;
    if (!id) {
      throw new Error("TRIAS requests need a station id.");
    }
    return { id, name: "name" in station ? station.name : void 0 };
  }
  /**
   * Abfahrtsmonitor (`StopEventRequest`).
   *
   * Produktfilter und Zeitfenster gehen **serverseitig** mit (`PtModeFilter`, `TimeWindow`) –
   * das spart Bandbreite gegenüber dem EFA-Backend, wo beides erst nach dem Mapping greifen
   * kann. Beide Grenzen sind aber weich: Der Produktfilter kennt nur die groben PtModes, und
   * das Zeitfenster lieferte im Test eine etwas größere Spanne als angefordert. Deshalb wird
   * nach dem Mapping trotzdem nachgefiltert.
   *
   * Reihenfolge der Parameter nach `Trias_StopEvents.xsd`: PtModeFilter, LineFilter,
   * OperatorFilter, NumberOfResults, TimeWindow, StopEventType, Include*-Schalter.
   *
   * @param station Die Station (ID oder Objekt)
   * @param options Abfrage-Optionen
   * @param arrival true = Ankünfte statt Abfahrten
   */
  async requestStopEvents(station, options, arrival) {
    var _a, _b, _c, _d, _e;
    const { id, name } = this.toStation(station);
    const requested = (_a = options == null ? void 0 : options.results) != null ? _a : 10;
    const productFilter = options == null ? void 0 : options.products;
    const limit = Math.min(
      MAX_DEPARTURE_RESULTS,
      productFilter && Object.keys(productFilter).length > 0 ? requested * 3 : requested
    );
    const duration = options == null ? void 0 : options.duration;
    const timeWindow = duration && duration > 0 ? `<TimeWindow>PT${Math.round(duration)}M</TimeWindow>` : "";
    const response = await this.request(
      arrival ? "arrivals" : "departures",
      `<StopEventRequest><Location>${this.locationRef(id, name)}<DepArrTime>${this.formatTime(options == null ? void 0 : options.when)}</DepArrTime></Location><Params>${this.ptModeFilter(productFilter)}<NumberOfResults>${limit}</NumberOfResults>${timeWindow}<StopEventType>${arrival ? "arrival" : "departure"}</StopEventType><IncludeRealtimeData>true</IncludeRealtimeData></Params></StopEventRequest>`
    );
    const payload = (_d = (_c = (_b = response.Trias) == null ? void 0 : _b.ServiceDelivery) == null ? void 0 : _c.DeliveryPayload) == null ? void 0 : _d.StopEventResponse;
    const results = (_e = payload == null ? void 0 : payload.StopEventResult) != null ? _e : [];
    this.checkError(payload == null ? void 0 : payload.ErrorMessage, results.length > 0);
    let departures = results.map((result) => (0, import_triasMapper.mapStopEvent)(result, arrival));
    departures = this.filterByProducts(departures, productFilter);
    departures = this.filterByDuration(departures, options == null ? void 0 : options.when, duration);
    departures = this.sortByEffectiveTime(departures);
    return { departures: departures.slice(0, requested), realtimeDataUpdatedAt: void 0 };
  }
  /**
   * Verbindungsauskunft (`TripRequest`).
   *
   * ⚠️ `InterchangeLimit` ist im Schema `xs:positiveInteger` – der Wert `0` für „nur
   * Direktverbindungen" ist damit formal unzulässig. Die EFA-BW akzeptiert ihn (gemessen:
   * antwortet mit `-4000`, wenn keine direkte Verbindung existiert), ein strenger Server
   * könnte den Request ablehnen. Der Wert wird deshalb nur durchgereicht, wenn der Anwender
   * ihn ausdrücklich gesetzt hat.
   *
   * Reihenfolge nach `Trias_Trips.xsd`: Origin, Destination, [Via/NotVia/NoChangeAt], Params
   * mit PtModeFilter, InterchangeLimit, Include*-Schaltern.
   *
   * @param fromId ID der Startstation
   * @param toId ID der Zielstation
   * @param options Abfrage-Optionen
   */
  async requestJourneys(fromId, toId, options) {
    var _a, _b, _c, _d, _e;
    const from = this.toStation(fromId);
    const to = this.toStation(toId);
    const requested = (_a = options == null ? void 0 : options.results) != null ? _a : DEFAULT_JOURNEY_RESULTS;
    const transfers = options == null ? void 0 : options.transfers;
    const interchangeLimit = typeof transfers === "number" && transfers >= 0 ? `<InterchangeLimit>${transfers}</InterchangeLimit>` : "";
    const response = await this.request(
      "journeys",
      `<TripRequest><Origin>${this.locationRef(from.id, from.name)}<DepArrTime>${this.formatTime(options == null ? void 0 : options.departure)}</DepArrTime></Origin><Destination>${this.locationRef(to.id, to.name)}</Destination><Params>${this.ptModeFilter(options == null ? void 0 : options.products)}${interchangeLimit}<IncludeIntermediateStops>${(options == null ? void 0 : options.stopovers) ? "true" : "false"}</IncludeIntermediateStops><IncludeRealtimeData>true</IncludeRealtimeData><NumberOfResults>${requested}</NumberOfResults></Params></TripRequest>`
    );
    const payload = (_d = (_c = (_b = response.Trias) == null ? void 0 : _b.ServiceDelivery) == null ? void 0 : _c.DeliveryPayload) == null ? void 0 : _d.TripResponse;
    const results = (_e = payload == null ? void 0 : payload.TripResult) != null ? _e : [];
    this.checkError(payload == null ? void 0 : payload.ErrorMessage, results.length > 0);
    const abZeit = new Date(this.formatTime(options == null ? void 0 : options.departure)).getTime();
    const kommende = results.filter((result) => {
      var _a2;
      return ((_a2 = (0, import_triasMapper.tripStartTime)(result)) != null ? _a2 : abZeit) >= abZeit;
    });
    return { journeys: kommende.slice(0, requested).map(import_triasMapper.mapJourney) };
  }
  /**
   * Ortssuche (`LocationInformationRequest`).
   *
   * Reihenfolge nach `Trias_Locations.xsd`: InitialInput, dann Restrictions mit Type,
   * NumberOfResults.
   *
   * @param query Der Suchbegriff
   * @param results Gewünschte Trefferzahl
   */
  async requestLocations(query, results = 10) {
    var _a, _b, _c, _d;
    const response = await this.request(
      "locations",
      `<LocationInformationRequest><InitialInput><LocationName>${this.escapeXml(query)}</LocationName></InitialInput><Restrictions><Type>stop</Type><NumberOfResults>${results}</NumberOfResults></Restrictions></LocationInformationRequest>`
    );
    const payload = (_c = (_b = (_a = response.Trias) == null ? void 0 : _a.ServiceDelivery) == null ? void 0 : _b.DeliveryPayload) == null ? void 0 : _c.LocationInformationResponse;
    const found = (_d = payload == null ? void 0 : payload.LocationResult) != null ? _d : [];
    this.checkError(payload == null ? void 0 : payload.ErrorMessage, found.length > 0);
    return found.slice(0, results).map(import_triasMapper.mapLocation);
  }
  /**
   * Details zu einer Haltestelle.
   *
   * TRIAS hat keinen eigenen Request dafür; die Ortssuche nimmt aber auch eine `LocationRef`
   * entgegen (`xs:choice` zwischen `InitialInput` und `LocationRef`), womit sich eine ID
   * auflösen lässt.
   *
   * @param id Die Haltestellen-ID
   */
  async requestStop(id) {
    var _a, _b, _c, _d;
    const response = await this.request(
      "stop",
      `<LocationInformationRequest>${this.locationRef(id)}<Restrictions><Type>stop</Type><NumberOfResults>1</NumberOfResults></Restrictions></LocationInformationRequest>`
    );
    const payload = (_c = (_b = (_a = response.Trias) == null ? void 0 : _a.ServiceDelivery) == null ? void 0 : _b.DeliveryPayload) == null ? void 0 : _c.LocationInformationResponse;
    const found = (_d = payload == null ? void 0 : payload.LocationResult) != null ? _d : [];
    this.checkError(payload == null ? void 0 : payload.ErrorMessage, found.length > 0);
    if (found.length === 0) {
      throw new Error(`TRIAS: no stop found for id ${id}`);
    }
    return (0, import_triasMapper.mapLocation)(found[0]);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TriasService
});
//# sourceMappingURL=triasService.js.map
