# @ticatec/dyna-js

[![npm version](https://badge.fury.io/js/@ticatec%2Fdyna-js.svg)](https://badge.fury.io/js/@ticatec%2Fdyna-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)

[中文文档](README_CN.md)

A TypeScript library for safe dynamic code execution using `new Function()` that works in both Node.js and browser environments.

## Features

✅ **Universal Compatibility** - Works in both Node.js and browser environments  
✅ **TypeScript Support** - Full type safety with comprehensive type definitions  
✅ **Singleton Pattern** - Initialize once, use anywhere  
✅ **Module Imports** - Pre-define classes and functions for dynamic code  
✅ **Configurable Security** - Fine-grained control over allowed APIs and operations  
✅ **Multiple Build Formats** - CommonJS and ESM support  
✅ **Performance Monitoring** - Built-in execution time tracking    

## Installation

```bash
npm install @ticatec/dyna-js
```

## Quick Start

### 1. Initialize Once (Application Startup)

```typescript
import { initializeDynaJs } from '@ticatec/dyna-js';

// Initialize with your classes and functions
initializeDynaJs({
  defaultImports: {
    FlexiForm: FlexiFormClass,
    FlexiCard: FlexiCardClass,
    Dialog: DialogClass,
    MessageBox: MessageBoxClass,
    FlexiContext: FlexiContextClass,
    ModuleLoader: ModuleLoaderClass
  },
  allowBrowserAPIs: false, // Secure by default
  validateCode: true
});
```

### 2. Use Anywhere

```typescript
import { getDynaJs } from '@ticatec/dyna-js';

// Get the initialized loader
const loader = getDynaJs();

// Create form classes
const MyFormClass = loader.executeSync(`
  class CustomForm extends FlexiForm {
    constructor() {
      super();
      this.dialog = Dialog;
    }

    show() {
      MessageBox.info('Form is ready!');
    }

    render() {
      return new FlexiCard({
        title: 'Dynamic Form',
        content: 'Created dynamically!'
      });
    }
  }
  return CustomForm;
`);

// Instantiate and use
const form = new MyFormClass();
form.show();
```

## API Reference

### Core Methods

#### `executeSync<T>(code: string, options?: ExecutionOptions): T`

Synchronously execute code and return the result directly.

```typescript
const form = loader.executeSync(`
  const form = new FlexiForm();
  form.setTitle('Dynamic Form');
  return form;
`);

console.log(form); // FlexiForm instance
// Execution time is logged to console automatically
```

#### `execute<T>(code: string, options?: ExecutionOptions): Promise<T>`

Asynchronously execute code with timeout support.

```typescript
const form = await loader.execute(`
  return new Promise(resolve => {
    const form = new FlexiForm();
    resolve(form);
  });
`, {
  timeout: 3000,
  context: { customVar: 'value' }
});

console.log(form); // FlexiForm instance
```

#### `executeWithImports<T>(code: string, imports: object, options?: ExecutionOptions): T`

Execute code with additional temporary imports.

```typescript
const component = loader.executeWithImports(`
  return new CustomComponent({
    message: 'Hello from dynamic code!'
  });
`, {
  CustomComponent: MyCustomComponent,
  utils: myUtilsLibrary
});
```

### Configuration Options

```typescript
interface DynaJsConfig {
  defaultTimeout?: number;           // Default: 5000ms
  defaultStrict?: boolean;           // Default: true
  allowedGlobals?: string[];         // Whitelist of allowed global variables
  blockedGlobals?: string[];         // Blacklist of blocked variables
  defaultImports?: object;           // Pre-imported classes/functions
  allowTimers?: boolean;             // Allow setTimeout/setInterval (Default: false)
  allowDynamicImports?: boolean;     // Allow import()/require() (Default: false)
  validateCode?: boolean;            // Enable code validation (Default: true)
  allowBrowserAPIs?: boolean;        // Allow window/document access (Default: false)
  allowNodeAPIs?: boolean;           // Allow process/require access (Default: false)
}
```

## Security Configurations

### 🔒 **Strict Mode (Recommended, Default)**

```typescript
initializeDynaJs({
  defaultImports: { FlexiForm, Dialog },
  allowBrowserAPIs: false,    // Block window, document, localStorage
  allowNodeAPIs: false,       // Block process, require
  allowTimers: false,         // Block setTimeout/setInterval
  validateCode: true          // Enable code pattern validation
});

// ❌ These will be blocked:
// window.location.href = 'malicious-site.com'
// localStorage.clear()
// setTimeout(maliciousFunction, 1000)
```

### 🟡 **Permissive Mode**

```typescript
initializeDynaJs({
  defaultImports: { FlexiForm, Dialog },
  allowBrowserAPIs: true,     // ✅ Allow browser APIs
  allowTimers: true,          // ✅ Allow timers
  allowDynamicImports: true,  // ✅ Allow dynamic imports
  validateCode: false         // Disable validation
});

// ✅ Now allowed:
// document.getElementById('myDiv')
// localStorage.getItem('data')
// setTimeout(() => {}, 1000)
```

### 🎯 **Balanced Mode (Recommended for Form Creation)**

```typescript
initializeDynaJs({
  defaultImports: {
    FlexiForm, Dialog, MessageBox,
    // Provide safe DOM access
    safeDOM: {
      getElementById: (id) => document.getElementById(id),
      createElement: (tag) => document.createElement(tag)
    }
  },
  allowBrowserAPIs: false,     // Still secure
  allowTimers: false,          // No timers needed for forms
  validateCode: true           // Keep validation
});
```

## Advanced Examples

### Creating Dynamic Form Components

```typescript
const DynamicFormBuilder = loader.executeSync(`
  class FormBuilder extends FlexiForm {
    constructor(config) {
      super();
      this.config = config;
      this.components = [];
    }

    addField(fieldConfig) {
      const field = new FlexiCard({
        title: fieldConfig.label,
        content: this.createInput(fieldConfig.type)
      });
      this.components.push(field);
      return this;
    }

    createInput(type) {
      switch(type) {
        case 'text':
          return '<input type="text" />';
        case 'number':
          return '<input type="number" />';
        default:
          return '<input type="text" />';
      }
    }

    build() {
      return this.components;
    }

    show() {
      const dialog = new Dialog({
        title: this.config.title,
        content: this.render()
      });
      dialog.show();
    }

    render() {
      return this.components.map(c => c.render()).join('');
    }
  }

  return FormBuilder;
`);

// Use the dynamically created form builder
const formBuilder = new DynamicFormBuilder({
  title: 'Dynamic Contact Form'
});

formBuilder
  .addField({ label: 'Name', type: 'text' })
  .addField({ label: 'Age', type: 'number' })
  .show();
```

### Function Creation

```typescript
const dynamicValidator = loader.createFunction(`
  return function validateForm(formData) {
    const errors = [];
    
    if (!formData.name) {
      errors.push('Name is required');
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };
`, []);

// Use the dynamic function
const validation = dynamicValidator({
  name: 'John',
  email: 'john@example.com'
});
```

## ModuleLoader - Dynamic Module Management

`ModuleLoader` is a singleton class for managing dynamic JavaScript modules with automatic caching and version control. It's perfect for loading remote code modules and managing their lifecycle.

### Key Features

- **Singleton Pattern** - Single instance manages all modules
- **Version Control** - Automatic digest-based freshness checking
- **Local Caching** - Stores modules in localStorage for offline access
- **Lazy Loading** - Modules are only instantiated when needed
- **Custom Hooks** - Override default behaviors with custom implementations

### Basic Usage

#### 1. Initialize the ModuleLoader

```typescript
import { ModuleLoader } from '@ticatec/dyna-js';

// Define how to load modules from your server
const loadModuleFromServer = async (moduleInfo) => {
  const response = await fetch(`/api/modules/${moduleInfo.code}`);
  return response.json(); // Should return { code, digest, scriptText }
};

// Initialize the singleton
const moduleLoader = ModuleLoader.initialize(loadModuleFromServer, {
  // All options are optional - defaults use localStorage
});
```

#### 2. Check and Update Modules

```typescript
// Check a list of modules and update if needed
await moduleLoader.checkFreshScripts([
  { code: 'user-form', digest: 'abc123...' },
  { code: 'data-grid', digest: 'def456...' },
  { code: 'chart-widget', digest: 'ghi789...' }
]);

// This will:
// 1. Check each module's digest against localStorage
// 2. Download and save modules that have changed
// 3. Clear the module instance cache
```

#### 3. Create and Use Modules

```typescript
// Import dependencies that the module needs
import React from 'react';
import ReactDOM from 'react-dom';

// Create the module instance
const UserForm = moduleLoader.createModule('user-form', {
  React,
  ReactDOM,
  // Add any other dependencies your module needs
});

// Use the module (it's now cached for subsequent calls)
const formInstance = new UserForm({
  title: 'User Registration',
  onSubmit: handleSubmit
});
```

### Advanced Configuration

#### Custom Module Check Function

```typescript
const moduleLoader = ModuleLoader.initialize(loadModuleFromServer, {
  // Custom logic to check if module needs updating
  moduleCheck: (moduleInfo) => {
    const localVersion = localStorage.getItem(`version:${moduleInfo.code}`);
    return localVersion === moduleInfo.version;
  }
});
```

#### Custom Storage Implementation

```typescript
// Use your own storage solution (IndexedDB, custom cache, etc.)
const moduleLoader = ModuleLoader.initialize(loadModuleFromServer, {
  // Custom save function
  saveModule: (moduleData) => {
    myCustomCache.set(moduleData.code, {
      digest: moduleData.digest,
      script: moduleData.scriptText,
      timestamp: Date.now()
    });
  },

  // Custom load function
  loadLocalModule: (moduleCode) => {
    const cached = myCustomCache.get(moduleCode);
    return cached ? cached.script : null;
  }
});
```

### Complete Example

```typescript
import { ModuleLoader, initializeDynaJs } from '@ticatec/dyna-js';
import React from 'react';
import ReactDOM from 'react-dom';

// 1. Initialize DynaJs with your base imports
initializeDynaJs({
  defaultImports: {
    Dialog: DialogClass,
    MessageBox: MessageBoxClass
  }
});

// 2. Setup module loader
const loadModule = async (moduleInfo) => {
  const response = await fetch(`/api/modules/${moduleInfo.code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ digest: moduleInfo.digest })
  });

  if (!response.ok) throw new Error('Failed to load module');
  return response.json();
};

const moduleLoader = ModuleLoader.initialize(loadModule, {});

// 3. On application startup, check for module updates
async function initializeApp() {
  try {
    // Get module manifest from server
    const manifest = await fetch('/api/modules/manifest').then(r => r.json());

    // Update all modules that have changed
    await moduleLoader.checkFreshScripts(manifest.modules);

    console.log('All modules are up to date!');
  } catch (error) {
    console.error('Failed to update modules:', error);
  }
}

// 4. Load and use modules on demand
function loadUserForm() {
  // This will use the cached version from localStorage
  const UserForm = moduleLoader.createModule('user-form', {
    React,
    ReactDOM,
    Dialog: DialogClass,
    MessageBox: MessageBoxClass
  });

  // Subsequent calls return the same cached instance
  const form = new UserForm();
  form.render();
}

// Initialize
initializeApp().then(() => {
  loadUserForm();
});
```

### Module Data Format

Your server should return module data in this format:

```typescript
interface ModuleData {
  code: string;        // Unique module identifier
  digest: string;      // Hash/version identifier (e.g., MD5, SHA-256)
  scriptText: string;  // The actual JavaScript code to execute
}
```

### Best Practices

1. **Version Control**: Use content-based hashing (MD5, SHA-256) for the digest field
2. **Graceful Degradation**: Handle network failures when loading modules
3. **Dependency Injection**: Pass all required dependencies in the imports object
4. **Cache Invalidation**: Call `checkFreshScripts()` on app startup and periodically
5. **Error Handling**: Wrap module creation in try-catch blocks

```typescript
try {
  const module = moduleLoader.createModule('my-module', imports);
  const instance = new module();
  instance.run();
} catch (error) {
  console.error('Module failed to load or execute:', error);
  // Fallback to default behavior
}
```

## Error Handling

```typescript
try {
  const result = loader.executeSync(`
    // Some dynamic code that might fail
    return new NonExistentClass();
  `);
} catch (error) {
  console.error('Execution failed:', error.message);
  // Error message includes execution time and detailed error information
}
```

## Browser Support

- Chrome 51+
- Firefox 40+
- Safari 10+
- Edge 14+
- Node.js 14+

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { 
  DynaJs,
  ExecutionOptions,
  ModuleImports 
} from '@ticatec/dyna-js';
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Security Considerations

⚠️ **Important Security Notes:**

1. **Code Validation**: Always keep `validateCode: true` in production
2. **API Restrictions**: Be careful when enabling `allowBrowserAPIs` or `allowNodeAPIs`
3. **Input Sanitization**: Validate all dynamic code input from external sources
4. **Timeout Settings**: Set appropriate timeouts to prevent infinite loops
5. **Principle of Least Privilege**: Only import the minimum required functions and classes

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/ticatec-auckland/common-web-library/issues) page.