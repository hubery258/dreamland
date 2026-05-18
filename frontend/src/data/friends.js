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
    url: "https://yanzhuchen0901.github.io/",
    avatar: "https://s41.ax1x.com/2026/03/14/peEcPHK.png",
  },
  {
    id: 2,
    name: "小板砖",
    description: "深圳最帅之人",
    url: "https://littlebanbrick.cn",
    avatar: "https://avatars.githubusercontent.com/u/245135180?v=4",
  },
];

export default friends;