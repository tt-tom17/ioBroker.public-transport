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
var baseTransportService_exports = {};
__export(baseTransportService_exports, {
  BaseTransportService: () => BaseTransportService
});
module.exports = __toCommonJS(baseTransportService_exports);
const TRANSPORT_MAX_RETRIES = 2;
const TRANSPORT_RETRY_DELAY_MS = 500;
const TRANSPORT_REQUEST_TIMEOUT_MS = 3e4;
const TRANSIENT_NETWORK_ERROR_CODES = /* @__PURE__ */ new Set([
  "ECONNRESET",
  // Verbindung vom Gegenüber/Netzwerk abrupt geschlossen (auch TLS-Handshake-Abbruch)
  "ECONNREFUSED",
  // Server hat die Verbindung (gerade) abgelehnt
  "ECONNABORTED",
  // Verbindung lokal abgebrochen
  "ETIMEDOUT",
  // TCP-/Socket-Timeout beim Verbindungsaufbau
  "ESOCKETTIMEDOUT",
  // Socket-Inaktivitäts-Timeout
  "EPIPE",
  // Schreiben auf bereits geschlossene Verbindung
  "ENETUNREACH",
  // Netzwerk vorübergehend nicht erreichbar
  "EHOSTUNREACH",
  // Host vorübergehend nicht erreichbar
  "EAI_AGAIN",
  // temporärer DNS-Auflösungsfehler
  "UND_ERR_CONNECT_TIMEOUT",
  // undici: Timeout beim Verbindungsaufbau
  "UND_ERR_SOCKET"
  // undici: Socket vorzeitig geschlossen
]);
class BaseTransportService {
  client = null;
  adapter;
  clientName;
  /**
   * @param adapter Die Adapter-Instanz (liefert die ioBroker-Timer für Timeout/Backoff,
   *                die beim Shutdown automatisch aufgeräumt werden)
   * @param clientName Name/User-Agent, der an den Backend-Client übergeben wird
   */
  constructor(adapter, clientName) {
    this.adapter = adapter;
    this.clientName = clientName;
  }
  /**
   * Initialisiert den Backend-Client. Muss vor der Nutzung der Abfrage-Methoden
   * aufgerufen werden. Wirft bei einem Fehler – ein Rückgabewert wird nicht benötigt.
   */
  init() {
    try {
      this.client = this.createClient();
    } catch (error) {
      throw new Error(`The ${this.serviceName} client could not be initialized: ${error.message}`);
    }
  }
  /**
   * Gibt den initialisierten Client zurück oder wirft einen Fehler.
   */
  getClient() {
    if (!this.client) {
      throw new Error(`${this.serviceName}Service has not been initialized yet. Please call init() first.`);
    }
    return this.client;
  }
  /**
   * Führt einen Backend-Aufruf mit Timeout und automatischer Wiederholung aus.
   *
   * Ablauf: Der Aufruf wird gestartet und mit {@link TRANSPORT_REQUEST_TIMEOUT_MS}
   * zeitlich begrenzt. Schlägt er mit einem transienten Fehler fehl (siehe
   * {@link isRetryable}), wird nach einer wachsenden Pause erneut versucht – bis zu
   * {@link TRANSPORT_MAX_RETRIES}-mal. Nicht-transiente Fehler (z.B. ungültige Anfrage)
   * werden sofort weitergereicht.
   *
   * @param operation Die eigentliche Client-Operation
   * @returns Das Ergebnis des Aufrufs
   */
  async call(operation) {
    let lastError;
    for (let attempt = 0; attempt <= TRANSPORT_MAX_RETRIES; attempt++) {
      try {
        return await this.withTimeout(operation(this.getClient()));
      } catch (error) {
        lastError = error;
        if (!this.isRetryable(error) || attempt === TRANSPORT_MAX_RETRIES) {
          break;
        }
        await this.adapter.delay(TRANSPORT_RETRY_DELAY_MS * (attempt + 1));
      }
    }
    throw lastError;
  }
  /**
   * Entscheidet, ob ein Fehler vorübergehend (transient) und damit wiederholbar ist.
   * `hafas-client` markiert solche Fehler mit `shouldRetry`; Server-5xx zusätzlich mit
   * `isCausedByServer`. Eigene Timeout-Fehler werden ebenfalls als wiederholbar gewertet.
   * Zusätzlich werden reine Netzwerkfehler der fetch-/Node-Schicht (DNS/TCP/TLS) erkannt,
   * die `hafas-client` ohne diese Markierungen durchreicht (siehe
   * {@link TRANSIENT_NETWORK_ERROR_CODES}).
   *
   * @param error Der aufgetretene Fehler
   */
  isRetryable(error) {
    const e = error;
    if ((e == null ? void 0 : e.shouldRetry) === true || (e == null ? void 0 : e.isCausedByServer) === true || (e == null ? void 0 : e.isTimeout) === true) {
      return true;
    }
    const code = typeof (e == null ? void 0 : e.code) === "string" ? e.code : void 0;
    const causeCode = (e == null ? void 0 : e.cause) && typeof e.cause.code === "string" ? e.cause.code : void 0;
    return code !== void 0 && TRANSIENT_NETWORK_ERROR_CODES.has(code) || causeCode !== void 0 && TRANSIENT_NETWORK_ERROR_CODES.has(causeCode);
  }
  /**
   * Begrenzt eine Promise zeitlich. Läuft sie länger als {@link TRANSPORT_REQUEST_TIMEOUT_MS},
   * wird mit einem als wiederholbar markierten Timeout-Fehler abgelehnt. Der zugrunde
   * liegende Request kann im Hintergrund weiterlaufen, blockiert aber den Ablauf nicht mehr.
   *
   * @param promise Die zu begrenzende Promise
   */
  withTimeout(promise) {
    let timer;
    const timeout = new Promise((_resolve, reject) => {
      timer = this.adapter.setTimeout(() => {
        const err = new Error(
          `${this.serviceName} request timed out after ${TRANSPORT_REQUEST_TIMEOUT_MS} ms`
        );
        err.isTimeout = true;
        reject(err);
      }, TRANSPORT_REQUEST_TIMEOUT_MS);
    });
    return Promise.race([promise, timeout]).finally(() => this.adapter.clearTimeout(timer));
  }
  /**
   * Suche nach Orten/Stationen.
   *
   * @param query Suchbegriff für Orte/Stationen
   * @param options optionale Suchoptionen
   */
  async getLocations(query, options) {
    return this.call((client) => client.locations(query, options));
  }
  /**
   * Liefert Abfahrten für eine gegebene Stations-ID.
   *
   * @param stationId ID der Station
   * @param options optionale Abfrage-Optionen
   */
  async getDepartures(stationId, options) {
    return this.call((client) => client.departures(stationId, options));
  }
  /**
   * Liefert Routeninformationen zwischen zwei Stationen.
   *
   * @param fromId ID der Startstation
   * @param toId ID der Zielstation
   * @param options optionale Routen-Optionen
   */
  async getJourneys(fromId, toId, options) {
    return this.call((client) => client.journeys(fromId, toId, options));
  }
  /**
   * Holt Details zu einer Station/einem Haltpunkt.
   *
   * @param stationId ID der Station/des Haltpunkts
   * @param options optionale Abfrageoptionen
   */
  async getStop(stationId, options) {
    return this.call((client) => client.stop(stationId, options));
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BaseTransportService
});
//# sourceMappingURL=baseTransportService.js.map
