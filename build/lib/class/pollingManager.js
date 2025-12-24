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
var pollingManager_exports = {};
__export(pollingManager_exports, {
  PollingManager: () => PollingManager
});
module.exports = __toCommonJS(pollingManager_exports);
class PollingManager {
  adapter;
  pollInterval;
  constructor(adapter) {
    this.adapter = adapter;
  }
  /**
   * Gibt die aktivierten Konfigurationen zurück.
   *
   * @param configs Die Konfigurationen
   * @param noConfigMsg Der Übersetzungsschlüssel wenn keine Konfigurationen vorhanden sind
   * @param noEnabledMsg Der Übersetzungsschlüssel wenn keine aktivierten Konfigurationen vorhanden sind
   * @returns Die aktivierten Konfigurationen oder undefined
   */
  getEnabledConfigs(configs, noConfigMsg, noEnabledMsg) {
    if (!configs || configs.length === 0) {
      this.adapter.log.debug(this.adapter.library.translate(noConfigMsg));
      return void 0;
    }
    const enabledConfigs = configs.filter((config) => config.enabled);
    if (enabledConfigs.length === 0) {
      this.adapter.log.debug(this.adapter.library.translate(noEnabledMsg));
      return void 0;
    }
    return enabledConfigs;
  }
  /**
   * Loggt die gefundenen Konfigurationen.
   *
   * @param configs Die Konfigurationen
   * @param countMsg Der Übersetzungsschlüssel für die Anzahl
   * @param entryMsg Der Übersetzungsschlüssel für jeden Eintrag
   */
  logConfigs(configs, countMsg, entryMsg) {
    var _a;
    this.adapter.log.info(this.adapter.library.translate(countMsg, configs.length));
    for (const config of configs) {
      this.adapter.log.info(
        this.adapter.library.translate(entryMsg, config.customName || config.name || "", (_a = config.id) != null ? _a : "")
      );
    }
  }
  /**
   * Führt Abfragen für alle Konfigurationen durch.
   *
   * @param configs Die Konfigurationen
   * @param service Der Transport-Service
   * @param fetchingMsg Der Übersetzungsschlüssel für "Abrufen"
   * @param updatedMsg Der Übersetzungsschlüssel für "Aktualisiert"
   * @param failedMsg Der Übersetzungsschlüssel für "Fehlgeschlagen"
   * @returns Objekt mit successCount und errorCount
   */
  async queryConfigs(configs, service, fetchingMsg, updatedMsg, failedMsg) {
    let successCount = 0;
    let errorCount = 0;
    for (const config of configs) {
      if (!config.id) {
        this.adapter.log.warn(
          this.adapter.library.translate("msg_stationNoValidId", config.customName || config.name || "")
        );
        continue;
      }
      this.adapter.log.info(
        this.adapter.library.translate(fetchingMsg, config.customName || config.name || "", config.id)
      );
      const success = await this.queryConfig(config, service);
      if (success) {
        successCount++;
        this.adapter.log.info(
          this.adapter.library.translate(updatedMsg, config.customName || config.name || "", config.id)
        );
      } else {
        errorCount++;
        this.adapter.log.warn(
          this.adapter.library.translate(failedMsg, config.customName || config.name || "", config.id)
        );
      }
    }
    return { successCount, errorCount };
  }
  /**
   * Startet das Polling.
   *
   * @param configs Die Konfigurationen
   * @param pollIntervalMinutes Das Polling-Intervall in Minuten
   * @param messages Die Übersetzungsschlüssel für verschiedene Meldungen
   * @param messages.noConfig keine Konfigurationen vorhanden
   * @param messages.noEnabled keine aktivierten Konfigurationen vorhanden
   * @param messages.count Anzahl der aktiven Konfigurationen
   * @param messages.entry Eintrag für jede Konfiguration
   * @param messages.fetching Abrufen der Daten
   * @param messages.updated Daten aktualisiert
   * @param messages.failed Datenaktualisierung fehlgeschlagen
   * @param messages.firstCompleted erste Abfrage abgeschlossen
   * @param messages.queryCompleted Abfrage abgeschlossen
   * @param messages.waiting Warten auf die nächste Abfrage
   */
  async start(configs, pollIntervalMinutes, messages) {
    const service = this.adapter.getActiveService();
    const enabledConfigs = this.getEnabledConfigs(configs, messages.noConfig, messages.noEnabled);
    if (!enabledConfigs) {
      return;
    }
    this.logConfigs(enabledConfigs, messages.count, messages.entry);
    const pollInterval = pollIntervalMinutes * 60 * 1e3;
    const { successCount, errorCount } = await this.queryConfigs(
      enabledConfigs,
      service,
      messages.fetching,
      messages.updated,
      messages.failed
    );
    this.adapter.log.info(this.adapter.library.translate(messages.firstCompleted, successCount, errorCount));
    this.adapter.log.info(this.adapter.library.translate(messages.waiting, pollIntervalMinutes));
    this.pollInterval = this.adapter.setInterval(async () => {
      const { successCount: successCount2, errorCount: errorCount2 } = await this.queryConfigs(
        enabledConfigs,
        service,
        messages.fetching,
        messages.updated,
        messages.failed
      );
      this.adapter.log.info(this.adapter.library.translate(messages.queryCompleted, successCount2, errorCount2));
      this.adapter.log.info(this.adapter.library.translate(messages.waiting, pollIntervalMinutes));
    }, pollInterval);
  }
  /**
   * Stoppt das Polling.
   */
  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = void 0;
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PollingManager
});
//# sourceMappingURL=pollingManager.js.map
