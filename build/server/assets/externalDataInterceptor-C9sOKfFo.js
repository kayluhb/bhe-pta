import { t as tokenIntercept } from "./getSSOTokenFromFile-BB6pa-Ja.js";
import { f as fileIntercept } from "./SignatureV4MultiRegion-B05s6TWe.js";
const externalDataInterceptor = {
  getFileRecord() {
    return fileIntercept;
  },
  interceptFile(path, contents) {
    fileIntercept[path] = Promise.resolve(contents);
  },
  getTokenRecord() {
    return tokenIntercept;
  },
  interceptToken(id, contents) {
    tokenIntercept[id] = contents;
  }
};
export {
  externalDataInterceptor as e
};
