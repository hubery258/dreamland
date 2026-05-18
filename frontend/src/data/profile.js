
// src/data/profile.js

/**
 * 这个文件专门存你的个人资料卡片信息。
 * 以后你想改名字、简介、头像、社交链接，
 * 都只需要改这里，不用去组件里到处找。
 */

const profile = {
  name: "RamenBoy",

  // 简介支持分两行显示，所以这里用数组
  bioLines: [
    "ZJUer & CSer",
    "每一个冬天的句号都是春暖花开",
  ],

  /**
   * 头像地址：
   * 你以后只要把头像放到 frontend/public/ 目录下，
   * 然后把这里改成对应路径就行。
   *
   * 例如你放一个文件：
   * frontend/public/avatar.jpg
   *
   * 那这里就改成：
   * avatarUrl: "/avatar.jpg"
   *
   * 现在先留空，用占位圆形代替。
   */
  avatarUrl: "https://s41.ax1x.com/2026/03/14/peEfnTx.jpg",

  /**
   * 社交链接先全部给占位地址。
   * 以后你只需要把 href 改成真实链接即可。
   */
  links: {
    github: "https://github.com/hubery258",
    email: "mailto:ramenboy233@gmail.com",
    notebook: "https://hubery258.github.io/notebook/",
    zhihu: "https://www.zhihu.com/people/hubery-62-3",
    douban: "https://www.douban.com/people/258193304",
    bilibili: "https://space.bilibili.com/2134294131",
    wechat: "公众号“没有时间感的盆栽”",
  },
};

export default profile;