# 配置 ESlint 和 Prettier

### 1、Eslint

1. 安装依赖

```bash
npm install eslint eslint-loader eslint-plugin-your-plugin --save-dev
```

2. 创建 ESLint 配置文件

npx eslint --init

```js
// .eslintrc.js
module.exports = {
  env: {
    // 环境
    browser: true,
    commonjs: true,
    es2021: true
  },
  extends: [
    // 继承的eslint 校验
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser', // ast 指定解析器目的转ast
  parserOptions: {
    // 选项配置
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 13 // ecma配置版本
  },
  plugins: [
    // 插件
    'react',
    '@typescript-eslint'
  ],
  rules: {}
}
```

3. 配置 Webpack

在 Webpack 配置文件中添加 `eslint-loader` 以处理 JavaScript 或 TypeScript 文件，并将其配置为在打包前进行代码检查。

```javascript
// webpack.config.js
module.exports = {
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'eslint-loader']
      }
    ]
  }
}
```

### 2、Prettier

1. 安装依赖

```bash
npm i --save-dev prettier
```

2. 新建`.prettierrc` 文件

```js
{
  "parser": "typescript",
  "singleQuote": true,
  "printWidth": 80,
  "trailingComma": "none",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "arrowParens": "always",
  "semi": true,
  "useTabs": false,
  "tabWidth": 2
}

```

### 3、如何解决 eslint 和 prettier 冲突

- eslint-config-prettier 的作用是关闭 eslint 中与 prettier 相互冲突的规则
- eslint-plugin-prettier 的作用是赋予 eslint 用 prettier 格式化代码的能力

安装依赖并修改.eslintrc.js 文件

```js
{
  extends": ["eslint:recommended", "standard",  "plugin:prettier/recommended"]
}
```

### 4、项目配置

.eslintrc.js

```js
{
  "parser": "@typescript-eslint/parser", // 指定解析器的名称，这里使用的是 @typescript-eslint/parser，表示使用 TypeScript 的 ESLint 解析器
  "parserOptions": {
    "ecmaVersion": 6, // ECMAScript 版本为 ES6
    "sourceType": "module", // 代码模块类型为 ES6 模块
    "ecmaFeatures": {
      "modules": true, // 支持 ES6 模块
      "jsx": true // 支持 JSX 语法
    }
  },
  "env": {
    "browser": true, // 支持浏览器环境
    "node": true, // 支持 Node.js 环境
    "es6": true // 支持 ES6 语法
  },
  "extends": [
    "standard", // 继承 standard 规则集
    "eslint:recommended", // 继承 ESLint 推荐的规则
    "plugin:@typescript-eslint/recommended", // 继承 @typescript-eslint 推荐的规则
    "prettier" // 继承 prettier 插件的规则
  ],
  "plugins": ["@typescript-eslint", "react", "react-hooks", "prettier"], // 加载 ESLint 插件
  "rules": {
    "prettier/prettier": 1, // 开启 prettier 插件的规则，并在违反时显示警告，但不会阻止代码的执行
    "accessor-pairs": "off", // 强制 getter 和 setter 在对象中成对出现
    "array-bracket-newline": "off", // 在数组括号内强制换行
    "array-bracket-spacing": "off", // 强制数组方括号中使用一致的空格
    "array-callback-return": "error", // 强制数组方法的回调函数中有 return 语句
    "array-element-newline": "off", // 在数组元素的强制换行
    "arrow-body-style": "off", // 强制箭头函数体的位置
    "arrow-parens": "off", // 强制箭头函数的参数使用括号
    "arrow-spacing": "off", // 强制箭头函数的间距样式
    "block-scoped-var": "error", // 强制把变量的使用限制在其定义的作用域范围内
    "block-spacing": "off", // 强制代码块之间的间距样式
    "brace-style": "off", // 强制在代码块中使用一致的大括号样式
    "callback-return": "off", // 强制函数中的回调函数有 return 语句
    "camelcase": "off", // 强制使用骆驼拼写法命名约定
    "capitalized-comments": "off", // 强制注释的首字母大写或小写
    "class-methods-use-this": "off", // 强制在 class 方法中使用 this
    "comma-dangle": "off", // 强制使用一致的逗号样式
    "comma-spacing": "off", // 强制逗号前后使用一致的空格
    "comma-style": "off", // 强制逗号的位置样式
    "complexity": "off", // 指定程序中允许的最大环路复杂度
    "computed-property-spacing": "off", // 强制在计算的属性的方括号中使用一致的空格
    "consistent-return": "off", // 要求 return 语句要么总是指定返回的值，要么不指定
    "consistent-this": "off", // 当获取当前执行环境的上下文时，强制使用一致的命名
    "constructor-super": "error", // 强制在构造函数中使用 super()
    "curly": "off", // 强制所有控制语句使用一致的括号样式
    "default-case": "off", // 要求 switch 语句中有 default 分支
    "default-case-last": "off", // 要求 switch 语句中的 default 分支是最后一个分支
    "default-param-last": "off", // 强制在默认参数上强制隐式的最后位置
    "dot-location": "off", // 强制在点号之前和之后一致的换行
    "dot-notation": "off", // 强制尽可能地使用点号
    "eol-last": "off", // 要求或禁止文件末尾存在空行
    "eqeqeq": "off", // 要求使用 === 和 !==
    "for-direction": "error", // 强制 “for” 循环中更新子句的计数器朝着正确的方向移动
    "func-call-spacing": "off", // 强制在函数标识符和其调用之间有空格
    "func-name-matching": "off", // 强制函数名与它所在的变量名或属性名相匹配
    "func-names": "off", // 要求或禁止使用命名的 function 表达式
    "func-style": "off", // 强制一致地使用 function 声明或表达式
    "function-call-argument-newline": "off", // 强制对函数调用的参数进行一致的换行
    "function-paren-newline": "off", // 强制在函数括号内使用一致的换行
    "generator-star-spacing": "off", // 强制 generator 函数中 * 号周围使用一致的空格
    "getter-return": "off", // 要求在 getter 属性中出现一个 return 语句
    "global-require": "off", // 要求 require() 出现在顶层模块作用域中
    "grouped-accessor-pairs": "off", // 强制 getter 和 setter 成对出现在对象中
    "guard-for-in": "off", // 要求 for-in 循环中有一个 if 语句
    "handle-callback-err": "off", // 要求回调函数中有容错处理
    "id-denylist": "off", // 禁止使用指定的标识符
    "id-length": "off", // 强制标识符的最小和最大长度
    "id-match": "off", // 要求标识符匹配一个指定的正则表达式
    "implicit-arrow-linebreak": "off", // 强制隐式返回的箭头函数体的位置
    "indent": "off", // 强制使用一致的缩进
    "init-declarations": "off", // 强制或禁止变量声明语句中初始化
    "jsx-quotes": "off", // 强制使用一致的双引号或单引号样式
    "key-spacing": "off", // 强制在对象字面量的键和值之间使用一致的空格
    "keyword-spacing": "off", // 强制关键字周围空格的一致性
    "line-comment-position": "off", // 强制行注释的位置
    "linebreak-style": "off", // 强制使用一致的换行符风格
    "lines-around-comment": "off", // 强制在注释周围有空行
    "lines-between-class-members": "off", // 强制类成员之间出现空行
    "max-classes-per-file": "off", // 强制每个文件中包含的的类的最大数量
    "max-depth": "off", // 强制块语句的最大可嵌套深度
    "max-len": "off", // 强制一行的最大长度
    "max-lines": "off", // 强制文件的最大行数
    "max-lines-per-function": "off", // 强制函数最大行数
    "max-nested-callbacks": "off", // 强制回调函数最大嵌套深度
    "max-params": "off", // 强制函数定义中最多允许的参数数量
    "max-statements": "off", // 强制函数块最多允许的的语句数量
    "max-statements-per-line": "off", // 强制每一行中所允许的最大语句数量
    "multiline-comment-style": "off", // 强制对多行注释使用特定风格
    "multiline-ternary": "off", // 要求或禁止在三元操作数中间换行
    "new-cap": "off", // 要求构造函数首字母大写
    "new-parens": "off", // 强制或禁止调用无参构造函数时有圆括号
    "newline-per-chained-call": "off", // 要求方法链中每个调用都有一个换行符
    "no-alert": "off", // 禁用 alert、confirm 和 prompt
    "no-array-constructor": "off", // 禁止使用 Array 构造函数
    "no-async-promise-executor": "off", // 禁止使用异步函数作为 Promise executor
    "no-await-in-loop": "off", // 禁止在循环中出现 await
    "no-bitwise": "off", // 禁用按位运算符
    "no-buffer-constructor": "off", // 禁止使用 Buffer() 构造函数
    "no-caller": "off", // 禁用 arguments.caller 或 arguments.callee
    "no-case-declarations": "error", // 不允许在 case 子句中使用词法声明
    "no-catch-shadow": "off", // 禁止 catch 子句的参数与外层作用域中的变量同名
    "no-class-assign": "error", // 禁止修改类声明的变量
    "no-compare-neg-zero": "error", // 禁止与 -0 进行比较
    "no-cond-assign": "error", // 禁止条件表达式中出现赋值操作符
    "no-confusing-arrow": "off", // 禁止在可能与比较操作符相混淆的地方使用箭头函数
    "no-console": "off", // 禁用 console
    "no-const-assign": "error", // 禁止修改 const 声明的变量
    "no-constant-condition": "error", // 禁止在条件中使用常量表达式
    "no-constructor-return": "off", // 禁止在构造函数中返回值
    "no-continue": "off", // 禁止使用 continue 语句
    "no-control-regex": "error", // 禁止在正则表达式中使用控制字符
    "no-debugger": "error", // 禁用 debugger
    "no-delete-var": "error", // 禁止删除变量
    "no-div-regex": "off", // 禁止除法操作符显式的出现在正则表达式开始的位置
    "no-dupe-args": "error", // 禁止 function 定义中出现重名参数
    "no-dupe-class-members": "error", // 禁止类成员中出现重复的名称
    "no-dupe-else-if": "off", // 禁止 if 语句中有相同的条件
    "no-dupe-keys": "error", // 禁止对象字面量中出现重复的 key
    "no-duplicate-case": "error", // 禁止在 switch 语句中出现重复测试表达式的 case
    "no-duplicate-imports": "off", // 禁止重复模块导入
    "no-else-return": "error", // 禁止在 else 前有 return
    "no-empty": "error", // 禁止出现空语句块
    "no-empty-character-class": "error", // 禁止在正则表达式中使用空字符集
    "no-empty-function": "error", // 禁止出现空的函数
    "no-empty-pattern": "error", // 禁止使用空解构模式
    "no-eq-null": "off", // 禁止在没有类型检查操作符的情况下与 null 进行比较
    "no-eval": "error", // 禁用 eval()
    "no-ex-assign": "error", // 禁止对 catch 子句的参数重新赋值
    "no-extend-native": "error", // 禁止扩展原生对象
    "no-extra-bind": "error", // 禁止不必要的 .bind() 调用
    "no-extra-boolean-cast": "error", // 禁止不必要的布尔类型转换
    "no-extra-label": "error", // 禁止不必要的标签
    "no-extra-parens": "off", // 禁止不必要的括号
    "no-extra-semi": "error", // 禁止不必要的分号
    "no-fallthrough": "error", // 禁止 case 语句落空
    "no-floating-decimal": "error", // 禁止浮点小数
    "no-func-assign": "error", // 禁止对 function 声明重新赋值
    "no-global-assign": "error", // 禁止对原生对象或只读的全局对象进行赋值
    "no-implicit-coercion": "off", // 禁止使用短符号进行类型转换
    "no-implicit-globals": "error", // 禁止在全局范围内使用变量声明和 function 声明
    "no-implied-eval": "off", // 禁止使用类似 eval() 的方法
    "no-import-assign": "error", // 禁止对 import 重新赋值
    "no-inline-comments": "off", // 禁止在代码后使用内联注释
    "no-inner-declarations": "error", // 禁止在嵌套的块中出现变量声明或 function 声明
    "no-invalid-regexp": "error", // 禁止 RegExp 构造函数中存在无效的正则表达式字符串
    "no-invalid-this": "off", // 禁止 this 关键字在类或类对象之外出现
    "no-irregular-whitespace": "error", // 禁止在字符串和注释之外不规则的空白
    "no-iterator": "error", // 禁用 __iterator__ 属性
    "no-label-var": "off", // 不允许标签与变量同名
    "no-labels": "off", // 禁用标签语句
    "no-lone-blocks": "off", // 禁用不必要的嵌套块
    "no-lonely-if": "error", // 禁止 if 作为唯一的语句出现在 else 语句中
    "no-loop-func": "off", // 禁止循环中存在函数
    "no-loss-of-precision": "off", // 禁止丢失精度
    "no-magic-numbers": "off", // 禁用魔术数字
    "no-misleading-character-class": "error", // 不允许在字符类语法中出现多个代码点组成的字符
    "no-mixed-operators": "off", // 禁止混合使用不同的操作符
    "no-mixed-requires": "off", // 禁止混合常规变量声明和 require 调用
    "no-mixed-spaces-and-tabs": "error", // 禁止空格和 tab 的混合缩进
    "no-multi-assign": "off", // 禁止连续赋值
    "no-multi-spaces": "off", // 禁止多个空格
    "no-multi-str": "error", // 禁止多行字符串
    "no-multiple-empty-lines": "off", // 禁止多个空行
    "no-native-reassign": "off", // 禁止重新分配本地对象
    "no-negated-condition": "off", // 禁用否定的表达式
    "no-negated-in-lhs": "error", // 禁止在 in 表达式中出现否定的左操作数
    "no-nested-ternary": "off", // 禁用嵌套的三元表达式
    "no-new": "off", // 禁止使用 new 以避免产生副作用
    "no-new-func": "off", // 禁止对 Function 对象使用 new 操作符
    "no-new-object": "off", // 禁止使用 Object 的构造函数
    "no-new-require": "off", // 禁止调用 require 时使用 new 操作符
    "no-new-symbol": "error", // 禁止 Symbolnew 操作符和 new 一起使用
    "no-new-wrappers": "off", // 禁止对 String，Number 和 Boolean 使用 new 操作符
    "no-obj-calls": "error", // 禁止将全局对象当作函数进行调用
    "no-octal": "error", // 禁用八进制字面量
    "no-octal-escape": "error", // 禁止在字符串中使用八进制转义序列
    "no-param-reassign": "off", // 禁止对 function 的参数进行重新赋值
    "no-path-concat": "off", // 禁止对 __dirname 和 __filename 进行字符串连接
    "no-plusplus": "off", // 禁用一元操作符 ++ 和 --
    "no-process-env": "off", // 禁用 process.env
    "no-process-exit": "off", // 禁用 process.exit()
    "no-proto": "off", // 禁止使用 __proto__ 属性
    "no-prototype-builtins": "error", // 禁止直接在对象实例上调用一些 Object.prototype 方法
    "no-redeclare": "error", // 禁止多次声明同一变量
    "no-regex-spaces": "error", // 禁止正则表达式字面量中出现多个空格
    "no-restricted-exports": "off", // 禁止使用特定的导出名称
    "no-restricted-globals": "off", // 禁用特定的全局变量
    "no-restricted-imports": "off", // 禁止使用特定的导入名称
    "no-restricted-properties": "off", // 禁止使用特定的对象属性
    "no-restricted-syntax": "off", // 禁用特定的语法
    "no-return-assign": "error", // 禁止在返回语句中赋值
    "no-return-await": "off", // 禁用不必要的 return await
    "no-script-url": "off", // 禁止使用 javascript: url
    "no-self-assign": "error", // 禁止自我赋值
    "no-self-compare": "error", // 禁止自身比较
    "no-sequences": "error", // 禁用逗号操作符
    "no-setter-return": "off", // 禁止在 setter 中返回值
    "no-shadow": "off", // 禁止变量声明与外层作用域的变量同名
    "no-shadow-restricted-names": "error", // 禁止将标识符定义为受限的名字
    "no-spaced-func": "off", // 禁止 function 标识符和括号之间出现空格
    "no-sparse-arrays": "error", // 禁用稀疏数组
    "no-tabs": "error", // 禁用 tab
    "no-template-curly-in-string": "off", // 禁止在常规字符串中出现模板字面量占位符语法
    "no-ternary": "off", // 禁用三元操作符
    "no-this-before-super": "error", // 禁止在构造函数中，在调用 super() 之前使用 this 或 super
    "no-throw-literal": "error", // 禁止抛出异常字面量
    "no-trailing-spaces": "off", // 禁用行尾空格
    "no-undef": "error", // 禁用未声明的变量，除非它们在 /*global */ 注释中被提到
    "no-undef-init": "error", // 禁止将变量初始化为 undefined
    "no-undefined": "off", // 禁止使用 undefined 变量
    "no-underscore-dangle": "off", // 禁止标识符中有悬空下划线
    "no-unexpected-multiline": "off", // 禁止使用令人困惑的多行表达式
    "no-unmodified-loop-condition": "error", // 禁用一成不变的循环条件
    "no-unneeded-ternary": "error", // 禁止可以在有更简单的可替代的表达式时使用三元操作符
    "no-unreachable": "error", // 禁止在 return、throw、continue 和 break 语句后出现不可达代码
    "no-unsafe-finally": "off", // 禁止在 finally 语句块中出现控制流语句
    "no-unsafe-negation": "error", // 禁止对关系运算符的左操作数使用否定操作符
    "no-unused-expressions": "error", // 禁止出现未使用过的表达式
    "no-unused-labels": "error", // 禁用出现未使用过的标签
    "no-unused-vars": "error", // 禁止出现未使用过的变量
    "no-use-before-define": "off", // 禁止在变量定义之前使用它们
    "no-useless-backreference": "error", // 禁止在正则表达式中使用无意义的反向引用
    "no-useless-call": "off", // 禁止不必要的 .call() 和 .apply()
    "no-useless-catch": "error", // 禁止不必要的 catch 子句
    "no-useless-computed-key": "off", // 禁止在对象中使用不必要的计算属性
    "no-useless-concat": "error", // 禁止不必要的字符串字面量或模板字面量的连接
    "no-useless-constructor": "off", // 禁用不必要的构造函数
    "no-useless-escape": "off", // 禁用不必要的转义字符
    "no-useless-rename": "error", // 禁止在 import 和 export 和解构赋值时将引用重命名为相同的名字
    "no-useless-return": "off", // 禁止多余的 return 语句
    "no-var": "error", // 要求使用 let 或 const 而不是 var
    "no-void": "off", // 禁用 void 操作符
    "no-warning-comments": "off", // 禁止在注释中使用特定的警告术语
    "no-whitespace-before-property": "off", // 禁止属性前有空白
    "no-with": "off", // 禁用 with 语句
    "nonblock-statement-body-position": "off", // 强制单个语句的位置
    "object-curly-newline": "off", // 强制在大括号内使用一致的换行符
    "object-curly-spacing": "off", // 强制在大括号中使用一致的空格
    "object-property-newline": "off", // 强制将对象的属性放在不同的行上
    "object-shorthand": "off", // 强制对象字面量缩写语法
    "one-var": "off", // 强制函数中的变量在一起声明或分开声明
    "one-var-declaration-per-line": "off", // 要求或禁止在变量声明周围换行
    "operator-assignment": "off", // 要求或禁止在可能的情况下使用简化的赋值操作符
    "operator-linebreak": "off", // 强制操作符使用一致的换行符风格
    "padded-blocks": "off", // 要求或禁止块内填充
    "padding-line-between-statements": "off", // 要求或禁止在语句间填充空行
    "prefer-arrow-callback": "off", // 要求回调函数使用箭头函数
    "prefer-const": "off", // 要求使用 const 声明那些声明后不再被修改的变量
    "prefer-destructuring": "off", // 优先使用数组和对象解构
    "prefer-exponentiation-operator": "off", // 要求使用**运算符而非 Math.pow()
    "prefer-named-capture-group": "off", // 建议使用命名的捕获组
    "prefer-numeric-literals": "off", // 禁用 parseInt() 和 Number.parseInt()，使用二进制，八进制和十六进制字面量
    "prefer-object-spread": "off", // 要求对象字面量中方法和属性使用简洁语法
    "prefer-promise-reject-errors": "error", // 要求使用 Error 对象作为 Promise 拒绝的原因
    "prefer-regex-literals": "off", // 禁止在常规表达式中使用控制字符
    "prefer-rest-params": "off", // 要求使用剩余参数而不是 arguments
    "prefer-spread": "off", // 要求使用扩展运算符而非 .apply()
    "prefer-template": "off", // 要求使用模板字面量而非字符串连接
    "quote-props": "off", // 要求对象字面量属性名称使用引号
    "quotes": "off", // 强制使用一致的反勾号、双引号或单引号
    "radix": "off", // 强制在parseInt()使用基数参数
    "require-atomic-updates": "error", // 禁止由于 await 或 yield的使用而可能导致出现竞态条件的赋值
    "require-await": "off", // 禁止使用不带 await 表达式的 async 函数
    "require-unicode-regexp": "off", // 强制在RegExp上使用u标志
    "require-yield": "error", // 要求 generator 函数内有 yield
    "rest-spread-spacing": "off", // 强制剩余和扩展运算符及其表达式之间有空格
    "semi": "error", // 要求或禁止使用分号代替 ASI
    "semi-spacing": "off", // 强制分号之前和之后使用一致的空格
    "semi-style": "off", // 强制分号的位置
    "sort-imports": "off", // 强制模块导入的排序
    "sort-keys": "off", // 要求对象属性按序排列
    "sort-vars": "off", // 要求同一个声明块中的变量按顺序排列
    "space-before-blocks": "off", // 强制在块之前使用一致的空格
    "space-before-function-paren": "off", // 强制在 function的左括号之前使用一致的空格
    "space-in-parens": "off", // 强制在圆括号内使用一致的空格
    "space-infix-ops": "off", // 要求操作符周围有空格
    "space-unary-ops": "off", // 强制在一元操作符前后使用一致的空格
    "spaced-comment": "off", // 强制在注释中 // 或 /* 使用一致的空格
    "strict": "off", // 要求或禁止使用严格模式指令
    "switch-colon-spacing": "off", // 强制在 switch 的冒号左右有空格
    "symbol-description": "off", // 要求 symbol 描述
    "template-curly-spacing": "off", // 要求或禁止模板字符串中的嵌入表达式周围空格的使用
    "template-tag-spacing": "off", // 要求或禁止在模板标记和它们的字面量之间有空格
    "unicode-bom": "off", // 要求或禁止 Unicode 字节顺序标记 (BOM)
    "use-isnan": "error", // 要求使用 isNaN() 检查 NaN
    "valid-typeof": "error", // 强制 typeof 表达式与有效的字符串进行比较
    "vars-on-top": "off", // 要求所有的 var 声明出现在它们所在的作用域顶部
    "wrap-iife": "off", // 要求 IIFE 使用括号括起来
    "wrap-regex": "off", // 要求正则表达式被括号括起来
    "yield-star-spacing": "off", // 强制在 yield* 表达式中 * 周围使用空格
    "yoda": "off" // 要求或禁止 “Yoda” 条件
  }
}
```

.prettierrc.js
```js
{
  "parser": "typescript", // 指定解析器为 TypeScript 解析器
  "singleQuote": true, // 使用单引号而非双引号
  "printWidth": 80, // 每行代码的最大宽度为 80 个字符
  "trailingComma": "none", // 不使用尾逗号
  "bracketSpacing": true, // 在对象字面量的括号之间添加空格
  "bracketSameLine": false, // 大括号不和对象字面量的首尾在同一行
  "arrowParens": "always", // 箭头函数的参数始终使用括号
  "semi": true, // 使用分号结尾
  "useTabs": false, // 使用空格而不是制表符（Tab）
  "tabWidth": 2 // 每个缩进级别为 2 个空格
   "printWidth": 80, // 每行代码的最大宽度，超过将换行
  "tabWidth": 2, // 每个缩进级别的空格数
  "useTabs": false, // 使用空格代替制表符（Tab）
  "quoteProps": "as-needed", // 对象属性是否加引号，"as-needed"表示仅在必要时添加
  // 后面的不常用
  "jsxSingleQuote": false, // 在 JSX 中是否使用单引号
  "jsxBracketSameLine": false, // 在多行 JSX 中的最后一行的末尾是否添加 > 放在新的一行
  "rangeStart": 0, // 指定要格式化的代码范围的起始位置
  "rangeEnd": Infinity, // 指定要格式化的代码范围的结束位置
  "requirePragma": false, // 是否需要文件顶部添加 Prettier pragma 注释
  "insertPragma": false, // 是否在文件顶部插入 Prettier pragma 注释
  "proseWrap": "preserve", // 指定换行格式，"preserve"表示保持不变
  "htmlWhitespaceSensitivity": "css", // HTML 文件的空格敏感性，"css"表示跟随 CSS 规则
  "endOfLine": "auto", // 换行符，"auto"表示跟随系统换行符，"lf"表示换行符为 LF，"crlf"表示换行符为 CRLF
  "embeddedLanguageFormatting": "auto" // 控制 Prettier 是否格式化嵌套的语言（例如在 HTML 文件中的 JavaScript）
}
```