import { M as loadSharedConfigFiles } from "./SignatureV4MultiRegion-B05s6TWe.js";
import { ap as fromEnv, aq as ENV_ACCOUNT_ID, ar as ENV_CREDENTIAL_SCOPE, as as ENV_EXPIRATION, at as ENV_KEY, au as ENV_SECRET, av as ENV_SESSION } from "./index-DgMOBvXs.js";
const mergeConfigFiles = (...files) => {
  const merged = {};
  for (const file of files) {
    for (const [key, values] of Object.entries(file)) {
      if (merged[key] !== void 0) {
        Object.assign(merged[key], values);
      } else {
        merged[key] = values;
      }
    }
  }
  return merged;
};
const parseKnownFiles = async (init) => {
  const parsedFiles = await loadSharedConfigFiles(init);
  return mergeConfigFiles(parsedFiles.configFile, parsedFiles.credentialsFile);
};
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ENV_ACCOUNT_ID,
  ENV_CREDENTIAL_SCOPE,
  ENV_EXPIRATION,
  ENV_KEY,
  ENV_SECRET,
  ENV_SESSION,
  fromEnv
}, Symbol.toStringTag, { value: "Module" }));
export {
  index as i,
  parseKnownFiles as p
};
