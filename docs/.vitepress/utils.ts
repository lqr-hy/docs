import fs, { link } from 'node:fs'
import path from 'node:path'
import { text } from 'stream/consumers'
import { DefaultTheme } from 'vitepress'

let navList: DefaultTheme.NavItem[] = []

interface IDir {
  text: string
  link: string
  activeMatch?: string
  childrenFile?: string
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
          link: fileName,
          childrenFile: fileName
        }
      }

      if (fileInfo.isDirectory() && !fileName.includes('.')) {
        arr = {
          text: fileName,
          link: fileName.toLowerCase(),
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

function nav() {
  const dirTree = eachFile()
  for (const navItem of dirTree) {
    if (navItem.childrenDir && (navItem.childrenDir as IDir[]).length) {
      navList.push({
        text: navItem.text,
        link: defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    } else {
      navList.push({
        text: navItem.text,
        link: defaultLink(navItem, navItem.link),
        activeMatch: navItem.activeMatch
      })
    }
  }
  return navList
}

function itemLink(navItem: IDir, itemChild: IDir) {
  if (itemChild.childrenDir && itemChild.childrenDir.length) {
    let linkPath = navItem.link + '/' + itemChild.link
    function deepPath (itemChild: IDir, linkPath) {
      console.log(itemChild, '====')
      if (itemChild.childrenDir?.length) {
        linkPath = linkPath + '/' + itemChild.childrenDir[0].link
        return deepPath(itemChild.childrenDir[0], linkPath)
      }
      return linkPath
    }
    linkPath = deepPath(itemChild, linkPath)
    return linkPath
  }
  return navItem.link + '/' + itemChild.link
}

function sidebar() {
  const dirTree = eachFile()
  // console.log(dirTree)
  let sideObj: DefaultTheme.Sidebar = {}
  // console.log(navList)
  // const bar = navList.map((nav) => {
  //   return eachFile('/' + nav.text)
  // })
  // console.log(bar)

  function deepDir() {
    dirTree.forEach((item) => {
      sideObj[`${item.activeMatch}`] = [
        {
          text: item.text,
          collapsed: false,
          items: item.childrenDir?.map((itemChild) => {
            return {
              text: itemChild.text,
              link: itemLink(item, itemChild)
            }
          })
        }
      ]
    })
  }

  deepDir()
  for (const key in sideObj) {
    console.log(sideObj[key][0])
  }

  return sideObj
}

export { nav, sidebar }
