import {ExecutionContext, ExecutionOptions, DynaJsConfig, ModuleImports} from './types';
import {createSafeContext, validateCode, isNode, isBrowser} from './utils';

/**
 * DynaJs - A safe dynamic code execution library
 *
 * Provides secure execution of dynamic JavaScript code using new Function()
 * with configurable security policies and sandboxing capabilities.
 *
 * @example
 * ```typescript
 * const loader = new DynaJs({
 *   defaultImports: { MyClass },
 *   validateCode: true,
 *   allowBrowserAPIs: false
 * });
 *
 * const result = loader.executeSync(`return new MyClass()`);
 * ```
 */
export default class DynaJs {
    private config: Required<DynaJsConfig>;

    /**
     * Creates a new DynaJs instance
     *
     * @param config - Configuration options for the DynaJs instance
     * @param config.defaultTimeout - Default timeout for async execution in milliseconds (default: 5000)
     * @param config.defaultStrict - Whether to use strict mode by default (default: true)
     * @param config.allowedGlobals - Whitelist of allowed global variables (empty = allow all defaultImports)
     * @param config.blockedGlobals - Blacklist of blocked global variables
     * @param config.defaultImports - Pre-imported classes/functions available to dynamic code
     * @param config.allowTimers - Allow setTimeout/setInterval in dynamic code (default: false)
     * @param config.allowDynamicImports - Allow import()/require() in dynamic code (default: false)
     * @param config.validateCode - Enable code validation before execution (default: true)
     * @param config.allowBrowserAPIs - Allow access to browser APIs like window/document (default: false)
     * @param config.allowNodeAPIs - Allow access to Node.js APIs like process/require (default: false)
     */
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

    /**
     * Asynchronously execute dynamic code with timeout support
     *
     * @template T - The expected return type of the executed code
     * @param code - The JavaScript code to execute
     * @param options - Execution options
     * @param options.context - Additional context variables for the code
     * @param options.timeout - Execution timeout in milliseconds (overrides defaultTimeout)
     * @param options.strict - Whether to use strict mode (overrides defaultStrict)
     * @param options.imports - Additional imports for this execution only
     * @returns Promise resolving to the execution result
     */
    async execute<T = any>(code: string, options: ExecutionOptions = {}): Promise<T> {
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
            console.info(`Build dyna code in ${performance.now() - startTime}ms`);
            return result as T
        } catch (error) {
            const executionTime = performance.now() - startTime;
            throw new Error(`Script execution failed after ${executionTime.toFixed(2)}ms: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Synchronously execute dynamic code and return result directly
     *
     * @template T - The expected return type of the executed code
     * @param code - The JavaScript code to execute
     * @param options - Execution options
     * @param options.context - Additional context variables for the code
     * @param options.strict - Whether to use strict mode (overrides defaultStrict)
     * @param options.imports - Additional imports for this execution only
     * @returns The direct result of code execution
     */
    executeSync<T = any>(code: string, options: ExecutionOptions = {}): T {
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
            console.info(`Build dyna code in ${performance.now() - startTime}ms`);
            return result as T
        } catch (error) {
            const executionTime = performance.now() - startTime;
            throw new Error(`Script execution failed after ${executionTime.toFixed(2)}ms: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    /**
     * Execute code with a timeout constraint
     *
     * @private
     * @template T - The expected return type
     * @param code - The JavaScript code to execute
     * @param context - Execution context with available variables
     * @param timeout - Maximum execution time in milliseconds
     * @param strict - Whether to use strict mode
     * @returns Promise resolving to the execution result
     * @throws {Error} If execution exceeds timeout or runtime error occurs
     */
    private async executeWithTimeout<T>(code: string, context: ExecutionContext, timeout: number, strict: boolean): Promise<T> {
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

    /**
     * Core code execution engine using new Function()
     *
     * @private
     * @param code - The JavaScript code to execute
     * @param context - Execution context with available variables
     * @param strict - Whether to use strict mode
     * @returns The execution result
     * @throws {Error} If code execution fails
     */
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

    /**
     * Create a reusable function from dynamic code
     *
     * @template T - The function signature type
     * @param code - The JavaScript code for the function body
     * @param paramNames - Array of parameter names for the function
     * @param options - Execution options
     * @param options.context - Additional context variables
     * @param options.strict - Whether to use strict mode
     * @param options.imports - Additional imports
     * @returns A function that can be called multiple times
     * @throws {Error} If function creation fails
     *
     * @example
     * ```typescript
     * const validator = loader.createFunction<(data: any) => boolean>(`
     *   return function(data) {
     *     return data.name && data.email;
     *   };
     * `);
     * const isValid = validator({ name: 'John', email: 'john@example.com' });
     * ```
     */
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

    /**
     * Synchronously execute code with additional temporary imports
     *
     * @template T - The expected return type
     * @param code - The JavaScript code to execute
     * @param imports - Additional imports to merge with defaultImports
     * @param options - Additional execution options
     * @returns The direct result of code execution
     * @throws {Error} If code validation fails or runtime error occurs
     *
     * @example
     * ```typescript
     * const result = loader.executeWithImports(`
     *   return new CustomComponent();
     * `, {
     *   CustomComponent: MyCustomComponent
     * });
     * ```
     */
    executeWithImports<T = any>(code: string, imports: ModuleImports, options: ExecutionOptions = {}): T {
        return this.executeSync<T>(code, {
            ...options,
            imports: {...this.config.defaultImports, ...imports}
        });
    }

    /**
     * Asynchronously execute code with additional temporary imports
     *
     * @template T - The expected return type
     * @param code - The JavaScript code to execute
     * @param imports - Additional imports to merge with defaultImports
     * @param options - Additional execution options (including timeout)
     * @returns Promise resolving to the execution result
     * @throws {Error} If code validation fails, execution times out, or runtime error occurs
     *
     * @example
     * ```typescript
     * const result = await loader.executeWithImportsAsync(`
     *   return await fetchData();
     * `, {
     *   fetchData: myFetchFunction
     * }, { timeout: 5000 });
     * ```
     */
    async executeWithImportsAsync<T = any>(code: string, imports: ModuleImports, options: ExecutionOptions = {}): Promise<T> {
        return this.execute<T>(code, {
            ...options,
            imports: {...this.config.defaultImports, ...imports}
        });
    }

    /**
     * Singleton instance of DynaJs
     * @private
     */
    static instance: DynaJs | null = null;

    /**
     * Initialize the singleton instance of DynaJs
     *
     * @param config - Configuration options for the singleton instance
     * @returns The initialized singleton instance
     *
     * @example
     * ```typescript
     * DynaJs.initialize({
     *   defaultImports: { MyClass, MyFunction },
     *   validateCode: true
     * });
     * ```
     */
    static initialize(config: DynaJsConfig): DynaJs {
        if (DynaJs.instance == null) {
            DynaJs.instance = new DynaJs(config);
        }
        return DynaJs.instance;
    }

    /**
     * Get the singleton instance of DynaJs
     *
     * @returns The singleton instance
     * @throws {Error} If DynaJs hasn't been initialized
     *
     * @example
     * ```typescript
     * const loader = DynaJs.getInstance();
     * const result = loader.executeSync(`return 1 + 1`);
     * ```
     */
    static getInstance(): DynaJs {
        if (DynaJs.instance == null) {
            throw new Error("DynaJs hasn't been initialized. Call DynaJs.initialize() first.");
        }
        return DynaJs.instance;
    }

    /**
     * Reset the singleton instance (useful for testing)
     *
     * @example
     * ```typescript
     * DynaJs.reset();
     * DynaJs.initialize(newConfig);
     * ```
     */
    static reset(): void {
        DynaJs.instance = null;
    }

    /**
     * Prepare the execution context by merging user context, imports, and applying security filters
     *
     * Execution flow:
     * 1. Create safe context (filtering browser/node APIs based on config)
     * 2. Merge with defaultImports and additional imports
     * 3. Apply allowedGlobals whitelist filter if configured
     *
     * @private
     * @param userContext - User-provided context variables
     * @param imports - Additional imports for this execution
     * @returns The final execution context
     *
     * @remarks
     * If allowedGlobals is set and not empty, only variables in the whitelist will be available.
     * This happens AFTER merging defaultImports, so make sure to include all needed imports
     * in the allowedGlobals array if you use this feature.
     */
    private prepareContext(
        userContext: ExecutionContext = {},
        imports: ModuleImports = {}
    ): ExecutionContext {
        let context = createSafeContext(userContext, {
            allowBrowserAPIs: this.config.allowBrowserAPIs,
            allowNodeAPIs: this.config.allowNodeAPIs,
            blockedKeys: this.config.blockedGlobals
        });

        context = {...context, ...this.config.defaultImports, ...imports};

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