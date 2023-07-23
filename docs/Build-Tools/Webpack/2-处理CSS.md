# 配置 css

当使用 webpack-dev-server 的时候 无法生成实体文件 bundle.js
是在根目录生成了虚拟文件 bundle.js
安装 html-webpack-plugin 插件为了在内存中渲染网页模板

```bash
npm install html-webpack-plugin
```

```js
const htmlWebpackPlugin = require('html-webpack-plugin')
// 两个作用： 第一个是生成指定的页面到内存中  第二是自动把打包好的bundle.js加载到页面中
new htmlWebpackPlugin({
  //创建在内存中生成的html  插件
  template: path.join(__dirname, './src/index.html'), // 指定模板页面路径 ，相当于把指定页面进行渲染
  filename: 'index.html' // 在浏览器生成页面的名称
})
```

:::details htmlWebpackPlugin其他配置
```js
new HtmlWebpackPlugin({
    template: './index.html',
    filename: 'all.html',
    //页面注入title
    title: 'html webpack plugin title',
    //默认引入所有的chunks链接
    chunks: 'all',
    //注入页面位置
    inject: true,
    //启用hash
    hash: true,
    favicon: '',
    //插入meta标签
    meta: {
        'viewport': 'width=device-width, initial-scale=1.0'
    },
    minify: {
        //清除script标签引号
        removeAttributeQuotes: true,
        //清除html中的注释
        removeComments: true,
        //清除html中的空格、换行符
        //将html压缩成一行
        collapseWhitespace: false,
        //压缩html的行内样式成一行
        minifyCSS: true,
        //清除内容为空的元素（慎用）
        removeEmptyElements: false,
        //清除style和link标签的type属性
        removeStyleLinkTypeAttributes: false
    }
})

<title><%= htmlWebpackPlugin.options.title %></title>
```
:::

### 1、css-loader
1. 打包处理css文件
npm i style-loader css-loader -D

2. 打包处理less文件
npm i less-loader less -D
​
3. 打包处理scss文件
npm i sass-loader node-sass -D

在webpack.config.js的module ->rules数组中，添加规则
注意点：use 数组中指定的loader顺序是固定的 、多个loader的调用顺序是：从后往前调用
```js
{
  module: { 
    rules:[
      // test 表示匹配的文件类型 use 表示对应要调用的loader
      // 顺序不能够改变 改变就是错误
      { 
        test:/\.css$/,
        use:['style-loader','css-loader']
      }, 
      {
        test:/\.less/,
        use:['style-loader','css-loader','less-loader']
      }, 
      {
        test:/\.scss/,
        use:['style-loader','css-loader','sass-loader']
      }
    ]
  }
}
```

### 1、处理 css 兼容问题

#### 1、webpack4 中使用

postCSS 自动添加 css 的兼容前缀

```bash
npm i postcss-loader autoprefixer -D
```

```js
 {
    test: /\.less$/,
    use: [
      MiniCssExtractPlugin.loader,
      'css-loader',
      'less-loader',
      {
        loader: 'postcss-loader',
        options: {
          plugins: () => {
            require('autoprefixer')({
                // 设置兼容
              browsers: ['last 2 version', '>1%', 'iso 7']
            })
          }
        }
      }
    ]
  }
```

#### 2、webpack5 中使用

```bash
npm i postcss-preset-env postcss-loader -D
```

生成 postcss.config.js 并配置

```js
module.exports = {
  plugins: [['postcss-preset-env']]
}
```

### 2、处理 css 文件指纹

```bash
npm install --save-dev mini-css-extract-plugin
```

```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
{
  test: /\.css$/,
  use: [
    MiniCssExtractPlugin.loader, // 和 style-loader 不能共存
    'css-loader'
  ]
},
plugins: [
  new MiniCssExtractPlugin({
    filename: '[name]\_[contenthash:8].css'
  })
]
```

### 3、处理 css 压缩问题

#### 1、webpack4

```bash
npm install --save-dev optimize-css-assets-webpack-plugin cssnano
```

```js
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')

module.exports = {
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('style-loader', 'css-loader')
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.optimize\.css$/g,
      cssProcessor: require('cssnano'),
      cssProcessorPluginOptions: {
        preset: ['default', { discardComments: { removeAll: true } }]
      },
      canPrint: true
    })
  ]
}
```

#### 2、webpack5

```bash
npm install --save-dev css-minimizer-webpack-plugin
```

```js
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

{
  plugins: [new CssMinimzerPlugin()]
}
```

### 4、rem 处理

```bash
npm install --save-dev postcss-plugin-px2rem
```

```js
{
  test: /\.less$/,
  use: [
    MiniCssExtractPlugin.loader,
    'css-loader',
    'less-loader',
    {
      loader: 'postcss-loader',
      options: {
        plugins: () => [
          require('autoprefixer'), // 处理css兼容问题
          require('postcss-plugin-px2rem')({ //处理csspx转rem问题
            rootValue: 50, // 设计稿宽度750px时的配置，可以根据设计稿大小调整此数值
            unitPrecision: 6,
            minPixelValue: 2, // 小于2px的样式不会被转成rem，因为在部分设备上可能会出现小于1px而渲染失败
            exclude: /(src\/pages\/pc)/ // web文件px不需要转换成rem
          })
        ]
      }
    }
  ]
}
```
或者新建 postcss.config.js

```js
module.exports = {
  plugins: {
    autoprefixer: {},
    /**
     * @see https://github.com/pigcan/postcss-plugin-px2rem 了解更多选项
     */
    'postcss-plugin-px2rem': {
      rootValue: 37.5, // 设计稿宽度750px时的配置，可以根据设计稿大小调整此数值
      unitPrecision: 6,
      minPixelValue: 2 // 小于2px的样式不会被转成rem，因为在部分设备上可能会出现小于1px而渲染失败
    }
  }
}
```
### 5、删除无用的css
```bash
npm install purgecss-webpack-plugin @fullhuman/postcss-purgecss --save-dev
```

```js
const path = require('path');
const PurgeCSSPlugin = require('purgecss-webpack-plugin');
const glob = require('glob');

module.exports = {
  // 其他配置项...
  plugins: [
    // 添加 PurgeCSSPlugin 插件
    new PurgeCSSPlugin({
      paths: glob.sync(path.join(__dirname, 'src/**/*.js'), { nodir: true }),
      // 添加其他配置，如safelist用于排除特定样式
    }),
  ],
};

```