import { 
  ExecutionContext, 
  ExecutionOptions, 
  ExecutionResult, 
  DynaJsConfig,
  ModuleImports
} from './types';
import { createSafeContext, validateCode, isNode, isBrowser } from './utils';

export default class DynaJs {
  private config: Required<DynaJsConfig>;

  constructor(config: DynaJsConfig = {}) {
    this.config = {
      defaultTimeout: config.defaultTimeout ?? 5000,
      defaultStrict: config.defaultStrict ?? true,
      allowedGlobals: config.allowedGlobals ?? [],
      blockedGlobals: config.blockedGlobals ?? [],
      defaultImports: config.defaultImports ?? {},
      allowTimers: config.allowTimers ?? false,
      allowDynamicImports: config.allowDynamicImports ?? false,
      validateCode: config.validateCode ?? true,
      allowBrowserAPIs: config.allowBrowserAPIs ?? false,
      allowNodeAPIs: config.allowNodeAPIs ?? false
    };
  }

  async execute<T = any>(
    code: string, 
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    const startTime = performance.now();
    
    try {
      if (this.config.validateCode) {
        validateCode(code, {
          allowTimers: this.config.allowTimers,
          allowDynamicImports: this.config.allowDynamicImports
        });
      }
      
      const context = this.prepareContext(options.context, options.imports);
      const timeout = options.timeout ?? this.config.defaultTimeout;
      const strict = options.strict ?? this.config.defaultStrict;
      
      const result = await this.executeWithTimeout(code, context, timeout, strict);
      const executionTime = performance.now() - startTime;
      
      return {
        result: result as T,
        executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      throw new Error(`Script execution failed after ${executionTime.toFixed(2)}ms: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  executeSync<T = any>(
    code: string, 
    options: ExecutionOptions = {}
  ): ExecutionResult<T> {
    const startTime = performance.now();
    
    try {
      if (this.config.validateCode) {
        validateCode(code, {
          allowTimers: this.config.allowTimers,
          allowDynamicImports: this.config.allowDynamicImports
        });
      }
      
      const context = this.prepareContext(options.context, options.imports);
      const strict = options.strict ?? this.config.defaultStrict;
      
      const result = this.executeCode(code, context, strict);
      const executionTime = performance.now() - startTime;
      
      return {
        result: result as T,
        executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      throw new Error(`Script execution failed after ${executionTime.toFixed(2)}ms: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  private async executeWithTimeout<T>(
    code: string,
    context: ExecutionContext,
    timeout: number,
    strict: boolean
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Script execution timed out after ${timeout}ms`));
      }, timeout);

      try {
        const result = this.executeCode(code, context, strict);
        clearTimeout(timer);
        resolve(result);
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  private executeCode(code: string, context: ExecutionContext, strict: boolean): any {
    const contextKeys = Object.keys(context);
    const contextValues = Object.values(context);
    
    const strictMode = strict ? '"use strict";' : '';
    const wrappedCode = `${strictMode}\nreturn (function() {\n${code}\n})();`;
    
    try {
      const func = new Function(...contextKeys, wrappedCode);
      return func.apply(null, contextValues);
    } catch (error) {
      throw new Error(`Code execution error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  createFunction<T extends (...args: any[]) => any>(
    code: string,
    paramNames: string[] = [],
    options: ExecutionOptions = {}
  ): T {
    const context = this.prepareContext(options.context, options.imports);
    const strict = options.strict ?? this.config.defaultStrict;
    
    const strictMode = strict ? '"use strict";' : '';
    const wrappedCode = `${strictMode}\n${code}`;
    
    try {
      const contextKeys = Object.keys(context);
      const contextValues = Object.values(context);
      const allParams = [...contextKeys, ...paramNames];
      
      const func = new Function(...allParams, wrappedCode);
      
      return ((...args: any[]) => {
        const allArgs = [...contextValues, ...args];
        return func.apply(null, allArgs);
      }) as T;
    } catch (error) {
      throw new Error(`Function creation error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  executeWithImports<T = any>(
    code: string,
    imports: ModuleImports,
    options: ExecutionOptions = {}
  ): ExecutionResult<T> {
    return this.executeSync<T>(code, {
      ...options,
      imports: { ...this.config.defaultImports, ...imports }
    });
  }

  async executeWithImportsAsync<T = any>(
    code: string,
    imports: ModuleImports,
    options: ExecutionOptions = {}
  ): Promise<ExecutionResult<T>> {
    return this.execute<T>(code, {
      ...options,
      imports: { ...this.config.defaultImports, ...imports }
    });
  }

  static instance: DynaJs | null = null;

  static initialize(config: DynaJsConfig): DynaJs {
    if (DynaJs.instance == null) {
      DynaJs.instance = new DynaJs(config);
    }
    return DynaJs.instance;
  }

  static getInstance(): DynaJs {
    if (DynaJs.instance == null) {
      throw new Error("DynaJs hasn't been initialized. Call DynaJs.initialize() first.");
    }
    return DynaJs.instance;
  }

  static reset(): void {
    DynaJs.instance = null;
  }

  private prepareContext(
    userContext: ExecutionContext = {},
    imports: ModuleImports = {}
  ): ExecutionContext {
    let context = createSafeContext(userContext, {
      allowBrowserAPIs: this.config.allowBrowserAPIs,
      allowNodeAPIs: this.config.allowNodeAPIs,
      blockedKeys: this.config.blockedGlobals
    });
    
    context = { ...context, ...this.config.defaultImports, ...imports };
    
    if (this.config.allowedGlobals.length > 0) {
      const allowedContext: ExecutionContext = {};
      for (const key of this.config.allowedGlobals) {
        if (key in context) {
          allowedContext[key] = context[key];
        }
      }
      context = allowedContext;
    }
    
    return context;
  }
}