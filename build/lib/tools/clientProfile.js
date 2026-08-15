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
var clientProfile_exports = {};
__export(clientProfile_exports, {
  validateClientProfile: () => validateClientProfile
});
module.exports = __toCommonJS(clientProfile_exports);
function validateClientProfile(configuredServiceType, configuredProfile, client_profile) {
  if (!client_profile) {
    return;
  }
  const parts = client_profile.split(":");
  const expectedServiceType = parts[0];
  const expectedProfile = parts[1] || "";
  const currentServiceType = configuredServiceType || "hafas";
  if (currentServiceType !== expectedServiceType) {
    throw new Error(
      `Wrong client type: Expected '${expectedServiceType}', but '${currentServiceType}' is initialized (client_profile: ${client_profile})`
    );
  }
  const profileSelectsRegion = expectedServiceType === "hafas" || expectedServiceType === "efa";
  if (profileSelectsRegion && expectedProfile) {
    const currentProfile = configuredProfile || "";
    if (currentProfile !== expectedProfile) {
      throw new Error(
        `Wrong profile: Expected '${expectedProfile}', but '${currentProfile}' is configured (client_profile: ${client_profile})`
      );
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  validateClientProfile
});
//# sourceMappingURL=clientProfile.js.map
