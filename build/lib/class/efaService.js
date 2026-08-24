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
var efaService_exports = {};
__export(efaService_exports, {
  EfaService: () => EfaService
});
module.exports = __toCommonJS(efaService_exports);
var import_efaMapper = require("../tools/efaMapper");
var import_baseTransportService = require("./baseTransportService");
const EFA_INTERFACE_VERSION = "10.4.18.18";
const EFA_HARMLESS_MESSAGE_CODE = -8011;
const EFA_REQUEST_TIMEZONE = "Europe/Berlin";
const EFA_MAX_DEPARTURE_RESULTS = 50;
const EFA_NETWORKS = {
  /** Verkehrsverbund Rhein-Ruhr – Open Service API, registrierungsfrei nutzbar. */
  vrr: "https://openservice.vrr.de/openservice"
};
class EfaService extends import_baseTransportService.BaseTransportService {
  /** Profilname des Verbunds, z. B. `vrr`. Bestimmt die Basis-URL, s. {@link EFA_NETWORKS}. */
  profile;
  /**
   * @param adapter Die Adapter-Instanz
   * @param clientName Name/User-Agent, der an den Server übergeben wird
   * @param profile Profilname des Verbunds aus der Instanz-Konfiguration (z. B. `vrr`)
   */
  constructor(adapter, clientName, profile) {
    super(adapter, clientName);
    this.profile = profile.trim();
  }
  /**
   * Löst einen Profilnamen in die Basis-URL des Verbunds auf. Fail-fast wie bei HAFAS: ohne
   * bzw. mit unbekanntem Profil startet der Adapter bewusst NICHT mit einem stillen Default,
   * weil sonst Fahrplandaten einer völlig anderen Region ausgeliefert würden.
   *
   * @returns die Basis-URL ohne abschließenden Schrägstrich
   */
  resolveEndpoint() {
    const available = Object.keys(EFA_NETWORKS).map((name) => `'${name}'`).join(", ");
    if (!this.profile) {
      throw new Error(
        `No EFA network configured. Please select an EFA network (${available}) in the adapter settings.`
      );
    }
    const endpoint = EFA_NETWORKS[this.profile];
    if (!endpoint) {
      throw new Error(`unknown EFA network: ${this.profile}. available networks: ${available}.`);
    }
    return endpoint.replace(/\/+$/, "");
  }
  get serviceName() {
    return "EFA";
  }
  /**
   * Baut den Shim. Ein echter Client wird nicht erzeugt – die Prüfung beschränkt sich
   * deshalb darauf, dass das konfigurierte Profil einem bekannten Verbund entspricht
   * (fail-fast beim Start statt erst beim ersten Poll).
   */
  createClient() {
    this.resolveEndpoint();
    const client = {
      departures: (station, options) => this.requestDepartures(station, options, false),
      arrivals: async (station, options) => ({
        arrivals: (await this.requestDepartures(station, options, true)).departures
      }),
      journeys: (from, to, options) => this.requestJourneys(from, to, options),
      locations: (name, options) => this.requestLocations(name, options == null ? void 0 : options.results),
      stop: (id, _options) => this.requestStop(id),
      nearby: () => Promise.reject(new Error("The EFA backend does not support nearby searches.")),
      // Pflichtmethode des Interfaces, die der Adapter nirgends aufruft. EFA kennt keine
      // Entsprechung, deshalb nur die eigene Uhrzeit statt einer erfundenen Serverangabe.
      serverInfo: () => Promise.resolve({ serverTime: (/* @__PURE__ */ new Date()).toISOString() })
    };
    return client;
  }
  /**
   * Setzt eine EFA-Anfrage ab und gibt die geparste Antwort zurück.
   *
   * @param path Request-Pfad, z. B. `XML_DM_REQUEST`
   * @param params Die zusätzlichen Anfrage-Parameter
   */
  async request(path, params) {
    const query = new URLSearchParams({
      outputFormat: "rapidJSON",
      coordOutputFormat: "WGS84[dd.ddddd]",
      version: EFA_INTERFACE_VERSION,
      ...params
    });
    const url = `${this.resolveEndpoint()}/${path}?${query.toString()}`;
    this.adapter.log.debug(`[EFA] GET ${url}`);
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": this.clientName }
    });
    if (!response.ok) {
      const error = new Error(`EFA request failed: ${response.status} ${response.statusText}`);
      error.isCausedByServer = response.status >= 500;
      throw error;
    }
    return await response.json();
  }
  /**
   * Wertet die `systemMessages` der Antwort aus. Der Broker-Hinweis `-8011` wird
   * übersprungen; alles andere mit Text wird protokolliert und – wenn kein Ergebnis
   * geliefert wurde – als Fehler geworfen.
   *
   * @param messages Die Systemmeldungen der Antwort
   * @param hasResults true, wenn die Antwort trotzdem verwertbare Daten enthält
   */
  checkSystemMessages(messages, hasResults) {
    const relevant = (messages != null ? messages : []).filter(
      (message) => {
        var _a;
        return message.code !== EFA_HARMLESS_MESSAGE_CODE && ((_a = message.text) != null ? _a : "").trim().length > 0;
      }
    );
    if (relevant.length === 0) {
      return;
    }
    const text = relevant.map((message) => {
      var _a;
      return `${(_a = message.code) != null ? _a : "?"}: ${message.text}`;
    }).join(" | ");
    if (hasResults) {
      this.adapter.log.debug(`[EFA] Server message: ${text}`);
      return;
    }
    throw new Error(`EFA server reported: ${text}`);
  }
  /**
   * Formatiert einen Zeitpunkt als EFA-Anfrageparameter. EFA erwartet die **lokale**
   * Serverzeit, nicht UTC – die Antwortzeiten kommen umgekehrt in UTC zurück.
   *
   * @param when Der gewünschte Zeitpunkt (Standard: jetzt)
   */
  formatRequestTime(when) {
    const date = when ? new Date(when) : /* @__PURE__ */ new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: EFA_REQUEST_TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(date);
    const get = (type) => {
      var _a, _b;
      return (_b = (_a = parts.find((part) => part.type === type)) == null ? void 0 : _a.value) != null ? _b : "";
    };
    return {
      itdDate: `${get("year")}${get("month")}${get("day")}`,
      itdTime: `${get("hour")}${get("minute")}`
    };
  }
  /**
   * Löst die von hafas-client erlaubten Stations-Angaben (String oder Objekt) zu einer ID auf.
   *
   * @param station Die Station als ID oder Objekt
   */
  toStationId(station) {
    const id = typeof station === "string" ? station : station.id;
    if (!id) {
      throw new Error("EFA requests need a station id.");
    }
    return id;
  }
  /**
   * Abfahrtsmonitor (`XML_DM_REQUEST`).
   *
   * Zwei Filter werden bewusst NACH dem Mapping angewendet, weil EFA sie nicht in der
   * Anfrage kennt bzw. serverabhängig umsetzt: das Zeitfenster (`duration`) und der
   * Produktfilter. Damit trotzdem genug Abfahrten übrig bleiben, wird bei aktivem
   * Produktfilter großzügiger angefragt.
   *
   * @param station Die Station (ID oder Objekt)
   * @param options Abfrage-Optionen
   * @param arrival true = Ankünfte statt Abfahrten
   */
  async requestDepartures(station, options, arrival) {
    var _a, _b, _c;
    const requested = (_a = options == null ? void 0 : options.results) != null ? _a : 10;
    const productFilter = options == null ? void 0 : options.products;
    const limit = Math.min(
      EFA_MAX_DEPARTURE_RESULTS,
      productFilter && Object.keys(productFilter).length > 0 ? requested * 3 : requested
    );
    const time = this.formatRequestTime(options == null ? void 0 : options.when);
    const response = await this.request("XML_DM_REQUEST", {
      type_dm: "any",
      name_dm: this.toStationId(station),
      mode: "direct",
      useProxFootSearch: "0",
      useRealtime: "1",
      limit: String(limit),
      itdDateTimeDepArr: arrival ? "arr" : "dep",
      ...time
    });
    this.checkSystemMessages(response.systemMessages, ((_b = response.stopEvents) != null ? _b : []).length > 0);
    let departures = ((_c = response.stopEvents) != null ? _c : []).map((event) => (0, import_efaMapper.mapStopEvent)(event, arrival));
    departures = this.filterByProducts(departures, productFilter);
    departures = this.filterByDuration(departures, options == null ? void 0 : options.when, options == null ? void 0 : options.duration);
    departures = this.sortByEffectiveTime(departures);
    return { departures: departures.slice(0, requested) };
  }
  /**
   * Wirft Abfahrten heraus, deren Produkt in der Stations-Konfiguration abgewählt ist.
   * Ohne Filter oder bei unbekanntem Produkt bleibt die Abfahrt erhalten – ein unbekanntes
   * Produkt darf nichts verschlucken.
   *
   * @param departures Die gemappten Abfahrten
   * @param products Der Produktfilter aus der Konfiguration
   */
  filterByProducts(departures, products) {
    const active = Object.entries(products != null ? products : {});
    if (active.length === 0) {
      return departures;
    }
    const allowed = new Set(active.filter(([, enabled]) => enabled).map(([id]) => id));
    if (allowed.size === 0) {
      return departures;
    }
    return departures.filter((departure) => {
      var _a;
      const product = (_a = departure.line) == null ? void 0 : _a.product;
      return !product || allowed.has(product);
    });
  }
  /**
   * Begrenzt die Abfahrten auf das konfigurierte Zeitfenster (in Minuten ab dem
   * Abfragezeitpunkt). EFA kennt keinen entsprechenden Anfrageparameter.
   *
   * Maßgeblich ist die **tatsächliche** Abfahrtszeit (`when`), nicht die Sollzeit: Sonst
   * bliebe eine Fahrt im Fenster, die real erst Stunden später fährt.
   *
   * @param departures Die gemappten Abfahrten
   * @param when Startzeitpunkt der Abfrage
   * @param duration Zeitfenster in Minuten
   */
  filterByDuration(departures, when, duration) {
    if (!duration || duration <= 0) {
      return departures;
    }
    const start = when ? new Date(when).getTime() : Date.now();
    const end = start + duration * 6e4;
    return departures.filter((departure) => {
      var _a, _b;
      const time = Date.parse((_b = (_a = departure.when) != null ? _a : departure.plannedWhen) != null ? _b : "");
      return !Number.isFinite(time) || time <= end;
    });
  }
  /**
   * Sortiert nach der tatsächlichen Abfahrtszeit.
   *
   * EFA liefert die Liste in der Reihenfolge der **Sollzeiten**. Das genügt nicht: Der VRR
   * meldet z.B. für Nacht-Express-Fahrten die Sollzeit 00:00 mit einer Ist-Zeit mehrere
   * Stunden später (beobachtet am 15.08.2026: NE7 Soll 00:00, Ist 07:05). Solche Einträge
   * stünden sonst am Anfang der Abfahrtstafel, obwohl sie zuletzt fahren.
   *
   * @param departures Die gemappten Abfahrten
   */
  sortByEffectiveTime(departures) {
    return [...departures].sort((a, b) => {
      var _a, _b, _c, _d;
      const timeA = Date.parse((_b = (_a = a.when) != null ? _a : a.plannedWhen) != null ? _b : "");
      const timeB = Date.parse((_d = (_c = b.when) != null ? _c : b.plannedWhen) != null ? _d : "");
      if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) {
        return 0;
      }
      return timeA - timeB;
    });
  }
  /**
   * Verbindungsauskunft (`XML_TRIP_REQUEST2`).
   *
   * @param from Startstation
   * @param to Zielstation
   * @param options Abfrage-Optionen
   */
  async requestJourneys(from, to, options) {
    var _a, _b, _c;
    const arriveBy = (options == null ? void 0 : options.arrival) !== void 0 && options.arrival !== null;
    const time = this.formatRequestTime(arriveBy ? options == null ? void 0 : options.arrival : options == null ? void 0 : options.departure);
    const params = {
      type_origin: "any",
      name_origin: this.toStationId(from),
      type_destination: "any",
      name_destination: this.toStationId(to),
      calcNumberOfTrips: String((_a = options == null ? void 0 : options.results) != null ? _a : 5),
      useRealtime: "1",
      itdTripDateTimeDepArr: arriveBy ? "arr" : "dep",
      ...time
    };
    if (typeof (options == null ? void 0 : options.transfers) === "number" && options.transfers >= 0) {
      params.ptOptionsActive = "1";
      params.maxChanges = String(options.transfers);
    }
    if (typeof (options == null ? void 0 : options.via) === "string" && options.via.length > 0) {
      params.type_via = "any";
      params.name_via = options.via;
    }
    const response = await this.request("XML_TRIP_REQUEST2", params);
    this.checkSystemMessages(response.systemMessages, ((_b = response.journeys) != null ? _b : []).length > 0);
    return { journeys: ((_c = response.journeys) != null ? _c : []).map((journey) => (0, import_efaMapper.mapJourney)(journey)) };
  }
  /**
   * Ortssuche (`XML_STOPFINDER_REQUEST`), sortiert nach Trefferqualität.
   *
   * @param query Suchbegriff oder ID
   * @param results Maximale Trefferzahl
   */
  async requestLocations(query, results) {
    var _a, _b;
    const response = await this.request("XML_STOPFINDER_REQUEST", {
      type_sf: "any",
      name_sf: query,
      anyMaxSizeHitList: String(results != null ? results : 10)
    });
    this.checkSystemMessages(response.systemMessages, ((_a = response.locations) != null ? _a : []).length > 0);
    const locations = [...(_b = response.locations) != null ? _b : []].sort(
      (a, b) => {
        var _a2, _b2, _c, _d;
        return Number((_a2 = b.isBest) != null ? _a2 : false) - Number((_b2 = a.isBest) != null ? _b2 : false) || ((_c = b.matchQuality) != null ? _c : 0) - ((_d = a.matchQuality) != null ? _d : 0);
      }
    );
    return locations.slice(0, results != null ? results : 10).map((location) => (0, import_efaMapper.mapLocation)(location));
  }
  /**
   * Details zu einer Station. EFA hat dafür keinen eigenen Request – die Ortssuche mit der
   * ID liefert denselben Datensatz.
   *
   * @param id Die Stations-ID (oder ein Stop-Objekt)
   */
  async requestStop(id) {
    var _a, _b, _c;
    const stationId = this.toStationId(id);
    const response = await this.request("XML_STOPFINDER_REQUEST", {
      type_sf: "any",
      name_sf: stationId,
      anyMaxSizeHitList: "5"
    });
    const locations = (_a = response.locations) != null ? _a : [];
    this.checkSystemMessages(response.systemMessages, locations.length > 0);
    const match = (_c = (_b = locations.find((location) => location.id === stationId)) != null ? _b : locations.find((location) => location.isBest)) != null ? _c : locations[0];
    if (!match) {
      throw new Error(`EFA did not return any location for id '${stationId}'.`);
    }
    return (0, import_efaMapper.mapLocation)(match);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EfaService
});
//# sourceMappingURL=efaService.js.map
