import DynaJs  from './DynaJs';
import ModuleLoader from "./ModuleLoader";
export * from './types';
export * from './utils';

export function createDynaJs(config?: import('./types').DynaJsConfig) {
  return new DynaJs(config);
}

export function initializeDynaJs(config: import('./types').DynaJsConfig) {
  return DynaJs.initialize(config);
}

export function getDynaJs() {
  return DynaJs.getInstance();
}

export { DynaJs, ModuleLoader };
export default DynaJs;