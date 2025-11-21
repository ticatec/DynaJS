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
✅ **Proxy-based Sandbox** - Safe variable access control with proxy mechanism  
✅ **Configurable Security** - Fine-grained control over allowed APIs and operations  
✅ **Form Class Creation** - Special method for creating dynamic form classes  
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
  defaultInjectedKeys: ['Dialog', 'MessageBox', 'Indicator', 'Toast'],
  useProxyByDefault: true,
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
const MyFormClass = loader.createFormClass(`
  class CustomForm extends FlexiForm {
    constructor() {
      super();
      this.dialog = Dialog; // Auto-injected
    }
    
    show() {
      MessageBox.info('Form is ready!'); // Auto-injected
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

#### `createFormClass<T>(code: string, context?: object, injectedKeys?: string[]): T`

Creates a form class with proxy-based sandbox execution.

```typescript
const FormClass = loader.createFormClass(`
  class MyForm extends FlexiForm {
    constructor() {
      super();
      this.setupDialog();
    }
    
    setupDialog() {
      this.dialog = new Dialog({
        title: 'Dynamic Dialog'
      });
    }
  }
  return MyForm;
`, {
  customData: 'additional context'
}, ['extraKey']);
```

#### `executeSync<T>(code: string, options?: ExecutionOptions): ExecutionResult<T>`

Synchronously execute code with result and timing information.

```typescript
const result = loader.executeSync(`
  const form = new FlexiForm();
  form.setTitle('Dynamic Form');
  return form;
`);

console.log(result.result); // FlexiForm instance
console.log(result.executionTime); // Execution time in milliseconds
```

#### `execute<T>(code: string, options?: ExecutionOptions): Promise<ExecutionResult<T>>`

Asynchronously execute code with timeout support.

```typescript
const result = await loader.execute(`
  return new Promise(resolve => {
    const form = new FlexiForm();
    resolve(form);
  });
`, {
  timeout: 3000,
  context: { customVar: 'value' }
});
```

#### `executeWithImports<T>(code: string, imports: object, options?: ExecutionOptions): ExecutionResult<T>`

Execute code with additional temporary imports.

```typescript
const result = loader.executeWithImports(`
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
  defaultInjectedKeys?: string[];    // Auto-injected variable names
  useProxyByDefault?: boolean;       // Default: true
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
  validateCode: true,          // Keep validation
  defaultInjectedKeys: ['window'] // Only inject window reference
});
```

## Advanced Examples

### Creating Dynamic Form Components

```typescript
const DynamicFormBuilder = loader.createFormClass(`
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

## Error Handling

```typescript
try {
  const result = loader.executeSync(`
    // Some dynamic code that might fail
    return new NonExistentClass();
  `);
} catch (error) {
  console.error('Execution failed:', error.message);
  // Error includes execution time and detailed error information
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
  ExecutionResult,
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