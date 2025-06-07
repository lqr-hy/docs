# JSX

### 1、React 17 中的 JSX 转换

React 17 引入了一种新的 JSX 转换方法,这带来了一些重要的变化和改进。以下是主要的区别和使用方法:

#### 1. 无需显式导入 React

在 React 17 之前:

```jsx
import React from 'react'

function App() {
  return <h1>Hello World</h1>
}
```

在 React 17 及以后:

```jsx
function App() {
  return <h1>Hello World</h1>
}
```

React 17 不再需要为使用 JSX 的文件显式导入 React。

#### 2. 更小的打包体积

新的转换方法不会将 React 的导入转换为 `React.__createElement`，这意味着打包工具可以更好地进行树摇（tree-shaking），从而减小最终的打包体积。

#### 3. 更快的编译速度

由于不需要为每个文件添加 React 导入，编译过程变得更快。

#### 4. 更好的开发者体验

减少了样板代码，使得代码更加简洁。特别是对于只使用 JSX 而不使用 React 其他特性的组件来说，代码变得更加清晰。

### 1、使用新的 JSX 转换

要使用新的 JSX 转换，您需要更新您的工具链：

1. 如果您使用 Create React App，请更新到最新版本。
2. 如果您使用 Next.js，请更新到 v9.5.3 或更高版本。
3. 如果您使用 Gatsby，请更新到 v2.24.5 或更高版本。

对于其他工具链，请更新到这些包的最新版本：

- `react` 和 `react-dom` 17.0.0 或更高
- `@babel/core` 7.9.0 或更高
- `@babel/preset-react` 7.9.0 或更高

然后，在您的 Babel 配置中添加 `{"runtime": "automatic"}` 选项：

```json
{
  "presets": [
    [
      "@babel/preset-react",
      {
        "runtime": "automatic"
      }
    ]
  ]
}
```

### 2、注意事项

1. 虽然不再需要导入 React 来使用 JSX，但如果您使用了 React 的其他特性（如 Hooks），仍然需要导入 React。

2. 如果您的项目使用 TypeScript，请确保更新到 TypeScript 4.1 或更高版本以支持新的 JSX 转换。

3. 旧的 JSX 转换仍然受支持，但建议迁移到新的转换方法以获得更好的性能和开发体验。

### 3、总结

React 17 以后的新 JSX 转换简化了代码，提高了性能，并改善了开发者体验。虽然这个变化在使用层面上相对较小，但它为未来 React 的发展铺平了道路，使得 React 更加模块化和高效。
