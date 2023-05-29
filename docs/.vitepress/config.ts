import { defineConfig } from 'vitepress'
import { nav, sidebar } from './utils'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/docs',
  title: "my-note",
  description: "lqr 的笔记",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: nav(),

    sidebar: sidebar(),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/lqr-hy/docs' }
    ]
  }
})
