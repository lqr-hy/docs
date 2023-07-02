import fs from 'node:fs'
import path from 'node:path'
import { DefaultTheme } from 'vitepress'

interface IDir {
  text: string
  link: string
  activeMatch?: string
  childrenDir?: IDir[]
}

let dirTree: IDir[] = []

function eachFile(currentPath: string = '/') {
  if (dirTree.length) {
    return dirTree
  }
  const dirPath = path.resolve(__dirname, '../../docs' + currentPath)

  function deepFile(dirPath, dirArr: IDir[]) {
    const fileNames = fs.readdirSync(dirPath)

    const compare = (a, b) => {
      const numA = parseInt(a.slice(0, -1)); // 提取数字部分
      const numB = parseInt(b.slice(0, -1));
      
      return numA - numB; // 按数字升序排序
    };
    // 排序
    fileNames.sort(compare)
    fileNames.forEach((fileName) => {
      let arr: IDir = {
        text: '',
        link: '',
        activeMatch: '',
        childrenDir: []
      }
      const filePath = path.resolve(dirPath, fileName)
      // 读取文件信息
      const fileInfo = fs.lstatSync(filePath)
      if (fileInfo.isFile()) {
        arr = {
          text: fileName.replace(/\d+-/i, '').replace('.md', ''),
          link: fileName
        }
      }

      if (fileInfo.isDirectory() && !fileName.includes('.')) {
        arr = {
          text: fileName,
          link: fileName,
          activeMatch: `/${fileName}/`,
          childrenDir: deepFile(path.join(dirPath, fileName), [])
        }
      }

      dirArr.push(arr)
    })

    return dirArr
  }

  dirTree = deepFile(dirPath, []).filter((file) => file.childrenDir?.length)

  return dirTree
}

// 默认link
function defaultLink(navItem: IDir, link) {
  if (navItem.childrenDir && navItem.childrenDir.length) {
    const linkPath = link + '/' + navItem.childrenDir[0].link
    if (navItem.childrenDir[0].childrenDir?.length) {
      return defaultLink(navItem.childrenDir[0], linkPath)
    }
    return linkPath
  }
  return navItem.link + '/'
}

const baseCategory = ['Html-Css', 'Javascript', 'Typescript']
const visualizationCategory = ['Threejs', 'WebGpu', 'Webgl']
const frameworkCategory = ['Vue', 'React']
const engineeringCategory = ['Build-Tools', 'Git']

function nav() {
  let navList: DefaultTheme.NavItem[] = [
    {
      text: '基础',
      items: []
    },
    {
      text: '框架',
      items: []
    },
    {
      text: '可视化',
      items: []
    },
    {
      text: '工程化',
      items: []
    },
    {
      text: '其他',
      items: []
    }
  ]
  const dirTree = eachFile()
  for (const navItem of dirTree) {
    if (baseCategory.includes(navItem.text)) {
      const baseNav = navList.find(
        (nav) => nav.text && nav.text === '基础'
      ) as DefaultTheme.NavItemChildren
      baseNav.items.push({
        text: navItem.text,
        link: '/' + defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    } else if (visualizationCategory.includes(navItem.text)) {
      const visualizationNav = navList.find(
        (nav) => nav.text && nav.text === '可视化'
      ) as DefaultTheme.NavItemChildren
      visualizationNav.items.push({
        text: navItem.text,
        link: '/' + defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    } else if (frameworkCategory.includes(navItem.text)) {
      const frameworkNav = navList.find(
        (nav) => nav.text && nav.text === '框架'
      ) as DefaultTheme.NavItemChildren
      frameworkNav.items.push({
        text: navItem.text,
        link: '/' + defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    } else if (engineeringCategory.includes(navItem.text)) {
      const engineeringNav = navList.find(
        (nav) => nav.text && nav.text === '工程化'
      ) as DefaultTheme.NavItemChildren
      engineeringNav.items.push({
        text: navItem.text,
        link: '/' + defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    } else {
      const otherNav = navList.find(
        (nav) => nav.text && nav.text === '其他'
      ) as DefaultTheme.NavItemChildren
      otherNav.items.push({
        text: navItem.text,
        link: '/' + defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    }
  }
  return navList
}

function sidebar() {
  const dirTree = eachFile()
  let sideObj: DefaultTheme.Sidebar = {}

  const dirResult = dirTree.map((dir) => {
    return {
      text: dir.text,
      collapsed: false,
      items: deepDir(dir.childrenDir, '/' + dir.link)
    }
  })

  function deepDir(dir, link) {
    if (Array.isArray(dir)) {
      return dir.map((item) => {
        const linkPath = link + '/' + item.link
        const isShowCollapsed = item.childrenDir
          ? {
              collapsed: false
            }
          : {
              link: linkPath.replace('.md', '')
            }
        return {
          text: item.text,
          ...isShowCollapsed,
          items: deepDir(item.childrenDir, linkPath)
        }
      })
    }
    return null
  }

  for (const dir of dirResult) {
    sideObj[`/${dir.text}/`] = [dir]
  }
  return sideObj
}

export { nav, sidebar }
