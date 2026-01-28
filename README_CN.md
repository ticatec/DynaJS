# @ticatec/dyna-js

[![npm version](https://badge.fury.io/js/@ticatec%2Fdyna-js.svg)](https://badge.fury.io/js/@ticatec%2Fdyna-js)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org())
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green.svg)](https://nodejs.org/)

[English Documentation](README.md)

一个使用 `new Function()` 进行安全动态代码执行的 TypeScript 库，同时支持 Node.js 和浏览器环境。

## 功能特性

✅ **通用兼容性** - 同时支持 Node.js 和浏览器环境  
✅ **TypeScript 支持** - 完整的类型安全和类型定义  
✅ **单例模式** - 一次初始化，全局使用  
✅ **模块导入** - 为动态代码预定义类和函数  
✅ **可配置安全性** - 对允许的 API 和操作进行细粒度控制  
✅ **多种构建格式** - 支持 CommonJS 和 ESM  
✅ **性能监控** - 内置执行时间跟踪  

## 安装

```bash
npm install @ticatec/dyna-js
```

## 快速开始

### 1. 一次性初始化（应用启动时）

```typescript
import { initializeDynaJs } from '@ticatec/dyna-js';

// 使用您的类和函数进行初始化
initializeDynaJs({
  defaultImports: {
    FlexiForm: FlexiFormClass,
    FlexiCard: FlexiCardClass,
    Dialog: DialogClass,
    MessageBox: MessageBoxClass,
    FlexiContext: FlexiContextClass,
    ModuleLoader: ModuleLoaderClass
  },
  allowBrowserAPIs: false, // 默认安全
  validateCode: true
});
```

### 2. 在任意位置使用

```typescript
import { getDynaJs } from '@ticatec/dyna-js';

// 获取已初始化的加载器
const loader = getDynaJs();

// 创建表单类
const MyFormClass = loader.executeSync(`
  class CustomForm extends FlexiForm {
    constructor() {
      super();
      this.dialog = Dialog;
    }

    show() {
      MessageBox.info('表单已就绪！');
    }

    render() {
      return new FlexiCard({
        title: '动态表单',
        content: '动态创建的内容！'
      });
    }
  }
  return CustomForm;
`);

// 实例化并使用
const form = new MyFormClass();
form.show();
```

## API 参考

### 核心方法

#### `executeSync<T>(code: string, options?: ExecutionOptions): T`

同步执行代码并直接返回结果。

```typescript
const form = loader.executeSync(`
  const form = new FlexiForm();
  form.setTitle('动态表单');
  return form;
`);

console.log(form); // FlexiForm 实例
// 执行时间会自动记录到控制台
```

#### `execute<T>(code: string, options?: ExecutionOptions): Promise<T>`

异步执行代码，支持超时控制。

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

console.log(form); // FlexiForm 实例
```

#### `executeWithImports<T>(code: string, imports: object, options?: ExecutionOptions): T`

使用额外的临时导入执行代码。

```typescript
const component = loader.executeWithImports(`
  return new CustomComponent({
    message: '来自动态代码的问候！'
  });
`, {
  CustomComponent: MyCustomComponent,
  utils: myUtilsLibrary
});
```

### 配置选项

```typescript
interface DynaJsConfig {
  defaultTimeout?: number;           // 默认：5000ms
  defaultStrict?: boolean;           // 默认：true
  allowedGlobals?: string[];         // 允许的全局变量白名单
  blockedGlobals?: string[];         // 阻止的变量黑名单
  defaultImports?: object;           // 预导入的类/函数
  allowTimers?: boolean;             // 允许 setTimeout/setInterval（默认：false）
  allowDynamicImports?: boolean;     // 允许 import()/require()（默认：false）
  validateCode?: boolean;            // 启用代码验证（默认：true）
  allowBrowserAPIs?: boolean;        // 允许 window/document 访问（默认：false）
  allowNodeAPIs?: boolean;           // 允许 process/require 访问（默认：false）
}
```

## 安全配置

### 🔒 **严格模式（推荐，默认）**

```typescript
initializeDynaJs({
  defaultImports: { FlexiForm, Dialog },
  allowBrowserAPIs: false,    // 阻止 window、document、localStorage
  allowNodeAPIs: false,       // 阻止 process、require
  allowTimers: false,         // 阻止 setTimeout/setInterval
  validateCode: true          // 启用代码模式验证
});

// ❌ 这些将被阻止：
// window.location.href = 'malicious-site.com'
// localStorage.clear()
// setTimeout(maliciousFunction, 1000)
```

### 🟡 **宽松模式**

```typescript
initializeDynaJs({
  defaultImports: { FlexiForm, Dialog },
  allowBrowserAPIs: true,     // ✅ 允许浏览器 API
  allowTimers: true,          // ✅ 允许定时器
  allowDynamicImports: true,  // ✅ 允许动态导入
  validateCode: false         // 禁用验证
});

// ✅ 现在允许：
// document.getElementById('myDiv')
// localStorage.getItem('data')
// setTimeout(() => {}, 1000)
```

### 🎯 **平衡模式（推荐用于表单创建）**

```typescript
initializeDynaJs({
  defaultImports: {
    FlexiForm, Dialog, MessageBox,
    // 提供安全的 DOM 访问
    safeDOM: {
      getElementById: (id) => document.getElementById(id),
      createElement: (tag) => document.createElement(tag)
    }
  },
  allowBrowserAPIs: false,     // 仍然安全
  allowTimers: false,          // 表单不需要定时器
  validateCode: true           // 保持验证
});
```

## 高级示例

### 创建动态表单组件

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

// 使用动态创建的表单构建器
const formBuilder = new DynamicFormBuilder({
  title: '动态联系表单'
});

formBuilder
  .addField({ label: '姓名', type: 'text' })
  .addField({ label: '年龄', type: 'number' })
  .show();
```

### 函数创建

```typescript
const dynamicValidator = loader.createFunction(`
  return function validateForm(formData) {
    const errors = [];

    if (!formData.name) {
      errors.push('姓名是必填项');
    }

    if (!formData.email || !formData.email.includes('@')) {
      errors.push('需要有效的邮箱地址');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };
`, []);

// 使用动态函数
const validation = dynamicValidator({
  name: 'John',
  email: 'john@example.com'
});
```

## ModuleLoader - 动态模块管理

`ModuleLoader` 是一个单例类，用于管理具有自动缓存和版本控制的动态 JavaScript 模块。它非常适合加载远程代码模块并管理它们的生命周期。

### 核心特性

- **单例模式** - 单个实例管理所有模块
- **版本控制** - 基于摘要的自动新鲜度检查
- **本地缓存** - 将模块存储在 localStorage 中以供离线访问
- **懒加载** - 模块仅在需要时才实例化
- **自定义钩子** - 使用自定义实现覆盖默认行为

### 基础用法

#### 1. 初始化 ModuleLoader

```typescript
import { ModuleLoader } from '@ticatec/dyna-js';

// 定义如何从服务器加载模块
const loadModuleFromServer = async (moduleInfo) => {
  const response = await fetch(`/api/modules/${moduleInfo.code}`);
  return response.json(); // 应该返回 { code, digest, scriptText }
};

// 初始化单例
const moduleLoader = ModuleLoader.initialize(loadModuleFromServer, {
  // 所有选项都是可选的 - 默认使用 localStorage
});
```

#### 2. 检查和更新模块

```typescript
// 检查模块列表并在需要时更新
await moduleLoader.checkFreshScripts([
  { code: 'user-form', digest: 'abc123...' },
  { code: 'data-grid', digest: 'def456...' },
  { code: 'chart-widget', digest: 'ghi789...' }
]);

// 这将：
// 1. 检查每个模块的摘要与 localStorage 中的对比
// 2. 下载并保存已更改的模块
// 3. 清除模块实例缓存
```

#### 3. 创建和使用模块

```typescript
// 导入模块需要的依赖项
import React from 'react';
import ReactDOM from 'react-dom';

// 创建模块实例
const UserForm = moduleLoader.createModule('user-form', {
  React,
  ReactDOM,
  // 添加模块需要的任何其他依赖项
});

// 使用模块（它现在已被缓存以供后续调用）
const formInstance = new UserForm({
  title: '用户注册',
  onSubmit: handleSubmit
});
```

### 高级配置

#### 自定义模块检查函数

```typescript
const moduleLoader = ModuleLoader.initialize(loadModuleFromServer, {
  // 自定义逻辑来检查模块是否需要更新
  moduleCheck: (moduleInfo) => {
    const localVersion = localStorage.getItem(`version:${moduleInfo.code}`);
    return localVersion === moduleInfo.version;
  }
});
```

#### 自定义存储实现

```typescript
// 使用您自己的存储解决方案（IndexedDB、自定义缓存等）
const moduleLoader = ModuleLoader.initialize(loadModuleFromServer, {
  // 自定义保存函数
  saveModule: (moduleData) => {
    myCustomCache.set(moduleData.code, {
      digest: moduleData.digest,
      script: moduleData.scriptText,
      timestamp: Date.now()
    });
  },

  // 自定义加载函数
  loadLocalModule: (moduleCode) => {
    const cached = myCustomCache.get(moduleCode);
    return cached ? cached.script : null;
  }
});
```

### 完整示例

```typescript
import { ModuleLoader, initializeDynaJs } from '@ticatec/dyna-js';
import React from 'react';
import ReactDOM from 'react-dom';

// 1. 使用基础导入初始化 DynaJs
initializeDynaJs({
  defaultImports: {
    Dialog: DialogClass,
    MessageBox: MessageBoxClass
  }
});

// 2. 设置模块加载器
const loadModule = async (moduleInfo) => {
  const response = await fetch(`/api/modules/${moduleInfo.code}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ digest: moduleInfo.digest })
  });

  if (!response.ok) throw new Error('加载模块失败');
  return response.json();
};

const moduleLoader = ModuleLoader.initialize(loadModule, {});

// 3. 在应用启动时，检查模块更新
async function initializeApp() {
  try {
    // 从服务器获取模块清单
    const manifest = await fetch('/api/modules/manifest').then(r => r.json());

    // 更新所有已更改的模块
    await moduleLoader.checkFreshScripts(manifest.modules);

    console.log('所有模块都是最新的！');
  } catch (error) {
    console.error('更新模块失败：', error);
  }
}

// 4. 按需加载和使用模块
function loadUserForm() {
  // 这将使用 localStorage 中的缓存版本
  const UserForm = moduleLoader.createModule('user-form', {
    React,
    ReactDOM,
    Dialog: DialogClass,
    MessageBox: MessageBoxClass
  });

  // 后续调用返回相同的缓存实例
  const form = new UserForm();
  form.render();
}

// 初始化
initializeApp().then(() => {
  loadUserForm();
});
```

### 模块数据格式

您的服务器应以此格式返回模块数据：

```typescript
interface ModuleData {
  code: string;        // 唯一的模块标识符
  digest: string;      // 哈希/版本标识符（例如 MD5、SHA-256）
  scriptText: string;  // 要执行的实际 JavaScript 代码
}
```

### 最佳实践

1. **版本控制**：对 digest 字段使用基于内容的哈希（MD5、SHA-256）
2. **优雅降级**：处理加载模块时的网络故障
3. **依赖注入**：在 imports 对象中传递所有必需的依赖项
4. **缓存失效**：在应用启动时和定期调用 `checkFreshScripts()`
5. **错误处理**：将模块创建包装在 try-catch 块中

```typescript
try {
  const module = moduleLoader.createModule('my-module', imports);
  const instance = new module();
  instance.run();
} catch (error) {
  console.error('模块加载或执行失败：', error);
  // 回退到默认行为
}
```

## 错误处理

```typescript
try {
  const result = loader.executeSync(`
    // 一些可能失败的动态代码
    return new NonExistentClass();
  `);
} catch (error) {
  console.error('执行失败：', error.message);
  // 错误信息包含执行时间和详细的错误信息
}
```

## 浏览器支持

- Chrome 51+
- Firefox 40+
- Safari 10+
- Edge 14+
- Node.js 14+

## TypeScript 支持

具有完整类型定义的 TypeScript 支持：

```typescript
import {
  DynaJs,
  ExecutionOptions,
  ModuleImports
} from '@ticatec/dyna-js';
```

## 贡献

1. Fork 仓库
2. 创建您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 许可证

MIT 许可证 - 详情请查看 [LICENSE](LICENSE) 文件。

## 安全考虑

⚠️ **重要安全注意事项：**

1. **代码验证**：在生产环境中始终保持 `validateCode: true`
2. **API 限制**：启用 `allowBrowserAPIs` 或 `allowNodeAPIs` 时要小心
3. **输入清理**：验证来自外部源的所有动态代码输入
4. **超时设置**：设置适当的超时以防止无限循环
5. **最小权限原则**：只导入所需的最少函数和类

## 支持

如有问题和功能请求，请使用 [GitHub Issues](https://github.com/ticatec-auckland/common-web-library/issues) 页面。

---

## 使用场景示例

### 动态表单创建
```typescript
// 适合创建各种动态表单组件
const ContactForm = loader.executeSync(`...`);
const SurveyForm = loader.executeSync(`...`);
const RegistrationForm = loader.executeSync(`...`);
```

### 业务规则执行
```typescript
// 动态业务逻辑
const businessRule = loader.executeSync(`
  return function(data) {
    // 复杂的业务逻辑
    return processBusinessRule(data);
  };
`);
```

### 模板渲染
```typescript
// 动态模板处理
const templateEngine = loader.executeSync(`
  class TemplateEngine {
    render(template, data) {
      // 模板渲染逻辑
      return processTemplate(template, data);
    }
  }
  return TemplateEngine;
`);
```