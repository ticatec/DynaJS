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
  ExecutionResult,
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