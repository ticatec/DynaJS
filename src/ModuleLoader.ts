import {getDynaJs} from "./index";

const getDigestKey = (key: string) => {
    return `${ModuleLoader.prefix}:md:${key}`;
}

const getScriptKey = (key: string) => {
    return `${ModuleLoader.prefix}:script:${key}`
}

const getLayoutKey = (key: string) => {
    return `${ModuleLoader.prefix}:layout:${key}`
}

/**
 * Function type for checking if a module needs to be updated
 * @param data - Module data containing code and digest information
 * @returns true if the module is up-to-date, false if it needs to be reloaded
 */
export type ModuleCheck = (data: any) => boolean;

/**
 * Function type for loading a module from remote source
 * @param data - Module data containing information needed to load the module
 * @returns Promise that resolves to the loaded module data
 */
export type LoadModule = (data: any) => Promise<any>;

/**
 * Function type for saving a module to local storage
 * @param data - Module data to be saved
 */
export type SaveModuleToLocalStorage = (data: any) => void;

/**
 * Function type for loading a module from local storage
 * @param data - Module identifier or data
 * @returns The module script text
 */
export type LoadLocalModule = (data: any) => any;

/**
 * Default module check function that compares message digest
 * @param data - Module data containing code and digest
 * @returns true if the local digest matches the remote digest
 */
const checkMessageDigest = (data: any) => {
    let localDigest = window.localStorage.getItem(getDigestKey(data.code));
    return localDigest == data.digest;
}

/**
 * Default function to save module to localStorage
 * Saves both the module digest and script text
 * @param data - Module data containing code, digest, and scriptText
 */
const saveModule = (data: any): void => {
    const key = data[ModuleLoader.keyField];
    window.localStorage.setItem(getDigestKey(key), data.digest);
    window.localStorage.setItem(getScriptKey(key), data.scriptText ?? '');
    if (data.uiLayout) {
        window.localStorage.setItem(getLayoutKey(key), data.uiLayout);
    }
}

/**
 * Default function to load module script from localStorage
 * @param key - Module key/code
 * @returns The module script text
 */
const loadLocalModule = (key: string): any => {
    return {
        scriptText: window.localStorage.getItem(getScriptKey(key)) as string
    };
}

/**
 * Configuration options for ModuleLoader
 */
export interface ModuleLoaderOptions {
    /** Optional custom module check function */
    moduleCheck?: ModuleCheck,
    /** Optional custom save module function */
    saveModule?: SaveModuleToLocalStorage,
    /** Optional custom load local module function */
    loadLocalModule?: LoadLocalModule,
    keyField?: string;
    prefix?: string;
}

/**
 * ModuleLoader is a singleton class for managing dynamic module loading with caching
 * It supports checking for module updates, loading from remote sources, and caching in localStorage
 */
export default class ModuleLoader {

    private static instance: ModuleLoader;
    private readonly loadModule: LoadModule;
    private readonly moduleCheck: ModuleCheck;
    private readonly saveModule: SaveModuleToLocalStorage;
    private readonly loadLocalModule: LoadLocalModule;
    private modulesMap: Map<string, any>;
    static keyField: string;
    static prefix: string;

    /**
     * Private constructor for singleton pattern
     * @param loadModule - Function to load module from remote
     * @param moduleCheck - Function to check module freshness
     * @param saveModule - Function to save module locally
     * @param loadLocalModule - Function to load module from local storage
     */
    private constructor(loadModule: LoadModule, moduleCheck: ModuleCheck, saveModule: SaveModuleToLocalStorage, loadLocalModule: LoadLocalModule) {
        this.loadModule = loadModule;
        this.moduleCheck = moduleCheck;
        this.saveModule = saveModule;
        this.loadLocalModule = loadLocalModule;
        this.modulesMap = new Map();
    }

    /**
     * Initialize the ModuleLoader singleton instance
     * @param loadModule - Function to load module from remote source
     * @param options - Configuration options with optional custom implementations
     * @returns The singleton ModuleLoader instance
     */
    static initialize(loadModule: LoadModule, options: ModuleLoaderOptions): ModuleLoader {
        if (ModuleLoader.instance == null) {
            ModuleLoader.instance = new ModuleLoader(loadModule, options.moduleCheck ?? checkMessageDigest,
                options.saveModule ?? saveModule, options.loadLocalModule ?? loadLocalModule);
            ModuleLoader.keyField = options.keyField ?? 'code';
            ModuleLoader.prefix = options.prefix ?? "DynaJS"
        }
        return ModuleLoader.instance;
    }

    static getInstance(): ModuleLoader {
        return ModuleLoader.instance;
    }

    /**
     * Check and update modules that are not fresh
     * Iterates through the list, checks each module, and reloads if needed
     * Clears the module cache after checking all modules
     *
     * @param list - Array of module data objects to check
     * @returns Promise that resolves when all modules are checked and updated
     * ```
     */
    async checkFreshScripts(list: Array<any>) {
        for (let item of list) {
            if (!this.moduleCheck(item)) {
                this.modulesMap.delete(ModuleLoader.keyField);
                let data = await this.loadModule(item);
                this.saveModule(data);
            }
        }
        this.modulesMap.clear();
    }

    /**
     * Create or retrieve a cached module instance
     * Loads the module script from local storage and executes it with provided imports
     * Caches the result for subsequent calls
     *
     * @param key - The module key/code to load
     * @param imports - Object containing dependencies to inject into the module
     * @returns The instantiated module
     */
    createModule(key: string, imports: any): any {
        let module = this.modulesMap.get(key);
        if (module == null) {
            let dynaCode = this.loadLocalModule(key);
            module = getDynaJs().executeSync(dynaCode.scriptText, {imports});
            this.modulesMap.set(key, module);
        }
        return module;
    }

    getLayout(key: string): any {
        let text = window.localStorage.getItem(getLayoutKey(key));
        try {
            return text == null ? null : JSON.parse(text);
        } catch (ex) {
            console.warn('Cannot parse layout', text);
            return null;
        }
    }

}