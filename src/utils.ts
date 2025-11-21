export function isNode(): boolean {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined';
}

export function createSafeContext(
  context: Record<string, any> = {},
  options: {
    allowBrowserAPIs?: boolean;
    allowNodeAPIs?: boolean;
    blockedKeys?: string[];
  } = {}
): Record<string, any> {
  const safeContext = { ...context };
  
  if (isBrowser() && !options.allowBrowserAPIs) {
    safeContext.window = undefined;
    safeContext.document = undefined;
    safeContext.localStorage = undefined;
    safeContext.sessionStorage = undefined;
    safeContext.fetch = undefined;
    safeContext.XMLHttpRequest = undefined;
  }
  
  if (isNode() && !options.allowNodeAPIs) {
    safeContext.process = undefined;
    safeContext.require = undefined;
    safeContext.global = undefined;
    safeContext.__dirname = undefined;
    safeContext.__filename = undefined;
  }
  
  // 始终阻止这些危险函数
  safeContext.eval = undefined;
  safeContext.Function = undefined;
  
  // 阻止自定义的键
  if (options.blockedKeys) {
    for (const key of options.blockedKeys) {
      safeContext[key] = undefined;
    }
  }
  
  return safeContext;
}

export function validateCode(
  code: string, 
  options: {
    allowTimers?: boolean;
    allowDynamicImports?: boolean;
  } = {}
): void {
  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }
  
  if (code.trim().length === 0) {
    throw new Error('Code cannot be empty');
  }
  
  const dangerousPatterns = [
    /eval\s*\(/,
    /Function\s*\(/,
    /new\s+Function\s*\(/
  ];

  if (!options.allowTimers) {
    dangerousPatterns.push(
      /setTimeout\s*\(/,
      /setInterval\s*\(/
    );
  }

  if (!options.allowDynamicImports) {
    dangerousPatterns.push(
      /import\s*\(/,
      /require\s*\(/
    );
  }
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Potentially dangerous code pattern detected: ${pattern.source}`);
    }
  }
}