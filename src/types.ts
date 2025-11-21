export interface ExecutionContext {
  [key: string]: any;
}

export interface ModuleImports {
  [key: string]: any;
}

export interface ExecutionOptions {
  context?: ExecutionContext;
  timeout?: number;
  strict?: boolean;
  imports?: ModuleImports;
  injectedKeys?: string[];
  useProxy?: boolean;
}

export interface ExecutionResult<T = any> {
  result: T;
  executionTime: number;
}

export interface DynaJsConfig {
  defaultTimeout?: number;
  defaultStrict?: boolean;
  allowedGlobals?: string[];
  blockedGlobals?: string[];
  defaultImports?: ModuleImports;
  defaultInjectedKeys?: string[];
  useProxyByDefault?: boolean;
  allowTimers?: boolean;
  allowDynamicImports?: boolean;
  validateCode?: boolean;
  allowBrowserAPIs?: boolean;
  allowNodeAPIs?: boolean;
}