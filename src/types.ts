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
}

export interface DynaJsConfig {
  defaultTimeout?: number;
  defaultStrict?: boolean;
  allowedGlobals?: string[];
  blockedGlobals?: string[];
  defaultImports?: ModuleImports;
  allowTimers?: boolean;
  allowDynamicImports?: boolean;
  validateCode?: boolean;
  allowBrowserAPIs?: boolean;
  allowNodeAPIs?: boolean;
}