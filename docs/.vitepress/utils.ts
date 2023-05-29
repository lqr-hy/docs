import fs from 'node:fs'
import path from 'node:path'
import { DefaultTheme } from 'vitepress'

let navList: DefaultTheme.NavItem[] = []

function eachFile(currentPath: string = '/') {
  const mapDir = new Map()
  const mapFile = new Map()
  const dirPath = path.resolve(__dirname, '../../docs' + currentPath)
  const fileNames = fs.readdirSync(dirPath)
  fileNames.forEach((fileName) => {
    const filePath = path.resolve(dirPath, fileName)
    // 读取文件信息
    const fileInfo = fs.lstatSync(filePath)
    if (fileInfo.isDirectory() && !fileName.includes('.')) {
      mapDir.set(fileName, fileName.toLowerCase())
    }

    if (fileInfo.isFile()) {
      console.log(fileName)
      // mapDir.set(fileName, )
    }
  })
  return {
    mapDir
  }
}

function nav() {
  const { mapDir } = eachFile()
  console.log(mapDir)
  for (const navItem of mapDir) {
    navList.push({
      text: navItem[0],
      link: navItem[1] + '/index',
      activeMatch: `/${navItem[1]}/`
    })
  }
  return navList
}

function sidebar() {
  // console.log(navList)
  // const bar = navList.map((nav) => {
  //   return eachFile('/' + nav.text)
  // })
  // console.log(bar)
  return {
    '/markdown/': [
      {
        text: 'ass',
        link: '/a'
      }
    ]
  }
}

export { nav, sidebar }
