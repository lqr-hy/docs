const moment = require('moment');
module.exports = {
  base: '/docs/',
  title: 'lqrDream的笔记',
  head: [
    ['link', { rel: 'icon', href: '/assets/logo.jpg' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    ['meta', { name: 'theme-color', content: '#3eaf7c' }],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }],
    ['link', { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' }],
    ['link', { rel: 'mask-icon', href: '/icons/icon-192x192.svg', color: '#3eaf7c' }],
    ['meta', { name: 'msapplication-TileImage', content: '/icons/icon-192x192.png' }],
    ['meta', { name: 'msapplication-TileColor', content: '#000000' }]
  ],
  plugins: [
    [
      '@vuepress/last-updated',
      {
        transformer: (timestamp, lang) => {
          // 不要忘了安装 moment
          const moment = require('moment')
          moment.locale(lang)
          return moment(timestamp).fromNow()
        }
      }
    ]
  ],
  themeConfig: {
    logo: '/assets/logo.jpg',
    nav: [
      { text: 'Home', link: '/' },
      { text: 'React', link: '/react/' },
      { text: 'Vue', link: '/vue/',
        items: [
          { text: '基础', link: '/vue/base/' },
          { text: '优化', link: '/vue/jinjie/' }
        ]
      },
      { text: 'Node', link: '/node/' },
      { text: 'Webpack', link: '/webpack/' },
      { text: 'Network', link: '/network/' },
      { text: 'Docker', link: '/docker/' },
      { text: 'Github', link: 'https://github.com/lqrDream' },
    ],
    sidebar:  {
      '/react/': [
        'react',
        '进阶'
      ]
    }
  }
}