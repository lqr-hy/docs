# 处理 js

在 Webpack 中配置打包高级语法时，可能涉及到处理 ES6+ 的新语法和其他高级功能。以下是一些常见的高级语法配置和优化选项：

### 1. 处理 ES6+ 语法

Webpack 默认可以处理部分 ES6+ 语法，但对于某些较新的语法特性（如动态导入、async/await 等），您可能需要使用额外的插件来进行转译。

使用 Babel 可以非常方便地将 ES6+ 代码转换为兼容性较好的 ES5 代码。首先，安装 Babel 相关依赖：

```bash
npm install @babel/core @babel/preset-env babel-loader --save-dev
```

然后，在 Webpack 配置中，添加 `babel-loader` 并配置 Babel 的预设：

```javascript
// webpack.config.js
module.exports = {
  // ...其他配置...
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
```

以上配置会将所有以 `.js` 结尾的文件通过 `babel-loader` 进行处理，并使用 `@babel/preset-env` 预设来转译 ES6+ 语法。

### 2、处理 TS

1. **安装依赖**：

首先，安装与 TypeScript 和 Webpack 相关的依赖：

```bash
npm install typescript ts-loader --save-dev
```

2. **创建 tsconfig.json**：

在项目根目录下创建一个`tsconfig.json`文件，用于配置 TypeScript 编译选项。例如：

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "module": "commonjs",
    "strict": true
  }
}
```

您可以根据项目需要调整其他编译选项。例如，设置`target`为更高版本以支持 ES6+功能，或者启用其他类型检查选项。

3. **配置 Webpack**：

在 Webpack 配置文件中，配置 TypeScript 的处理：

```javascript
// webpack.config.js
const path = require('path')

module.exports = {
  entry: './src/index.ts', // 入口文件
  output: {
    path: path.resolve(__dirname, 'dist'), // 输出目录
    filename: 'bundle.js' // 输出文件名
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js'] // 自动解析扩展名，使导入模块时不需要加后缀
  }
}
```

在上述配置中，我们指定入口文件为`src/index.ts`，并使用`ts-loader`来处理`.ts`文件。`exclude: /node_modules/`用于排除`node_modules`目录下的文件，因为通常不需要对其进行处理。

`resolve.extensions`用于设置自动解析扩展名，这样在导入模块时不需要加`.ts`后缀

4. 考虑 polyfill

```bash
npm i --save-dev babel-loader @babel/preset-typescript
```

```js
// webpack.config.js
module: {
  rules: [
    {
      test: /\.ts$/,
      exclude: /node_modules/,
      use: 'babel-loader'
    }
  ]
}

// babel.config.js
{
  presets: [['@babel/preset-typescript']]
}
```

:::info 区别
- babel-loader  不会做类型校验     ts-loader 会做类型校验
- babel-loader  会polyfill     ts-loader 不会
:::