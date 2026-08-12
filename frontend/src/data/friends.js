// src/data/friends.js

/**
 * 这里先放前端本地友链数据。
 * 后面如果你想做“后台管理友链”，再把这里迁移到后端数据库。
 *
 * avatar 也是同理：
 * 如果你以后把图片放到 public/ 目录，就写成 "/friends/xxx.jpg"
 * 现在先用空字符串，让页面显示占位头像。
 */

const friends = [
  {
    id: 1,
    name: "Chenのhomepage",
    description: "yzgg tql",
    url: "https://Bamb0oChen.github.io/",
    avatar: "https://s41.ax1x.com/2026/03/14/peEcPHK.png",
  },
  {
    id: 2,
    name: "小板砖",
    description: "深圳最帅之人",
    url: "https://littlebanbrick.cn",
    avatar: "https://avatars.githubusercontent.com/u/245135180?v=4",
  },
  {
    id: 3,
    name: "FelixFu's Craft",
    description: "jfgg做出来功能很全面的的小站:关于cs、随笔、音乐与学习等等!",
    url: "www.felixfu.xyz",
    avatar: "https://www.felixfu.xyz/uploads/20260809094541-13e0eedf9b354f93b34bd16818147e9e.jpg",
  },
];

export default friends;