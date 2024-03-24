import { nav, sidebar } from './utils'

// https://vitepress.dev/reference/site-config
export default {
  base: '/docs',
  title: 'my-note',
  description: 'lqr 的笔记',
  lastUpdated: true,
  cleanUrls: true,
  head: [['link', { rel: 'icon', href: '/docs/favicon.ico' }]],
  ignoreDeadLinks: true,
  themeConfig: {
    outline: 'deep',
    nav: nav(),

    sidebar: sidebar(),

    socialLinks: [{ icon: 'github', link: 'https://github.com/lqr-hy/docs' }],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'LQR'
    },

    editLink: {
      pattern: 'https://github.com/lqr-hy/docs/tree/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
}
