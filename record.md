# vibe-coding以及个人解读记录

## 整体项目结构

```bash
my-blog/
├─ backend/                     # FastAPI 后端
│  ├─ app/
│  │  ├─ __init__.py
│  │  ├─ main.py               # FastAPI 入口
│  │  ├─ database.py           # 数据库连接配置
│  │  ├─ models.py             # SQLAlchemy 数据表模型
│  │  ├─ schemas.py            # Pydantic 请求/响应模型
│  │  ├─ crud.py               # 数据库增删改查逻辑
│  │  ├─ seed.py               # 可选：初始化示例数据
│  │  └─ routers/
│  │     ├─ __init__.py
│  │     ├─ posts.py           # 文章相关接口
│  │     ├─ tags.py            # 标签相关接口
│  │     └─ site.py            # about 等站点信息接口
│  ├─ requirements.txt
│  └─ blog.db                  # SQLite 数据库文件（运行后生成）
│
├─ frontend/                   # React 前端
│  ├─ src/
│  │  ├─ api/                  # 请求后端的封装
│  │  ├─ components/           # 公共组件
│  │  ├─ pages/                # 页面
│  │  ├─ layouts/              # 布局组件
│  │  ├─ styles/               # 自定义样式
│  │  ├─ App.jsx
│  │  └─ main.jsx
│  ├─ package.json
│  └─ ...
│
└─ README.md
```

## 首版功能设计

首要核心功能：

1. 发布帖子，通过网页后台页面发布文章：
    - 标题
    - 摘要
    - Markdown 正文
    - 标签
    - 是否置顶
    - 后端会把文章存进 SQLite 数据库。

2. About 页面，做一个独立页面 `/about`，显示：
    - 你的介绍
    - 联系方式
    - 其它链接
    - 首版先把 About 内容存在数据库里，这样以后你可以通过接口更新，而不是每次改代码。

3. Tag 功能
    - 每篇文章绑定多个 tag
    - tag 页面列出所有标签
    - 点击某个标签可以筛选相关文章

## 数据库设计

为了让结构简单清晰，做两张主要表：

### 表 1：posts
存文章

字段大概如下：

| 字段名 | 类型 | 作用 |
|---|---|---|
| id | 整数 | 主键 |
| title | 字符串 | 标题 |
| slug | 字符串 | 文章 URL 标识 |
| summary | 文本 | 摘要 |
| content | 文本 | Markdown 正文 |
| is_pinned | 布尔 | 是否置顶 |
| created_at | 时间 | 创建时间 |
| updated_at | 时间 | 更新时间 |

---

### 表 2：tags
存标签

| 字段名 | 类型 | 作用 |
|---|---|---|
| id | 整数 | 主键 |
| name | 字符串 | 标签名 |

---

### 中间表：post_tags
因为一篇文章可以有多个标签，一个标签也可以属于多篇文章，所以需要“多对多关系”中间表。

### 表 3：site_meta
存站点信息，比如 about 内容

| 字段名 | 类型 | 作用 |
|---|---|---|
| id | 整数 | 主键 |
| about_title | 字符串 | about 页面标题 |
| about_content | 文本 | about 页面正文（支持 Markdown） |

<hr>

## 后端代码

> 说实话这个和做simpletasker用到的flask长得巨像

### `requirement.txt`说明：

> - `fastapi`：后端框架
> - `uvicorn`：运行 FastAPI
> - `sqlalchemy`：操作数据库
> - `pydantic`：做数据校验
> - `python-slugify`：把标题转成 URL 友好的 slug

### `backend/app/database.py`

### `backend/app/models.py`

### `backend/app/schemas.py`

### `backend/app/crud.py`

### `backend/app/routers/posts.py`

### `backend/app/routers/tags.py`

### `backend/app/routers/site.py`

### `backend/app/main.py`

### `backend/app/routers/__init__.py`

### `backend/app/__init__.py`

## 后端运行

```bash
cd backend
安装依赖，建议先开虚拟环境。
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
启动
uvicorn app.main:app --reload
```

如果启动成功，会看到类似：
```bash
Uvicorn running on http://127.0.0.1:8000
```

### 打开接口文档测试

FastAPI 自带接口文档：

- Swagger 文档：  
  `http://127.0.0.1:8000/docs`

可以直接在这里测试发帖接口。

#### 你现在已经可以测试的接口

##### 1. 获取所有文章
```http
GET /posts/
```

##### 2. 新建文章
```http
POST /posts/
```

示例请求体：

```json
{
  "title": "我的第一篇文章",
  "summary": "这是一个测试摘要",
  "content": "# 你好\n\n这是一篇用 **Markdown** 写的文章。",
  "is_pinned": true,
  "tags": ["随笔", "测试"]
}
```

##### 3. 获取单篇文章
比如 slug 是 `我的第一篇文章`

```http
GET /posts/我的第一篇文章
```

##### 4. 获取所有标签
```http
GET /tags/
```

##### 5. 获取 About 内容
```http
GET /site/about
```

##### 6. 更新 About 内容
```http
PUT /site/about
```

示例：

```json
{
  "about_title": "About",
  "about_content": "# 自我介绍\n\n你好，我是 xxx。这里是我的博客。"
}
```

### 作用总结

- 已经有了一个**可以工作的后端雏形**：
    - 能发帖
    - 能读文章
    - 能按 tag 查文章
    - 能拿到 about 内容
    - 支持 Markdown 原文存储


## 前端技术选择

- **React**
- **Vite**
- **React Router**
- **普通 CSS**
- `react-markdown`

## 前端目录结构

把 `src` 目录整理成这样：

```bash
frontend/
├─ src/
│  ├─ api/
│  │  └─ client.js
│  ├─ components/
│  │  ├─ Header.jsx
│  │  └─ PageTitle.jsx
│  ├─ layouts/
│  │  └─ MainLayout.jsx
│  ├─ pages/
│  │  ├─ HomePage.jsx
│  │  ├─ PostDetailPage.jsx
│  │  ├─ TagsPage.jsx
│  │  ├─ AboutPage.jsx
│  │  └─ NewPostPage.jsx
│  ├─ styles/
│  │  └─ global.css
│  ├─ App.jsx
│  └─ main.jsx
```

## 入口文件

### `frontend/src/main.jsx`


## App 路由总入口

### `frontend/src/App.jsx`

## 布局组件

这个组件负责统一页面结构，比如：

- 顶部导航栏
- 页面整体宽度
- 页面内容区域

### `frontend/src/layouts/MainLayout.jsx`

## 顶部导航栏

博客风格：
- 左边站点标题
- 右边 Posts / Tags / About
- 整体很轻，细边框，留白充足

### `frontend/src/components/Header.jsx`

## 通用页面标题组件

特征：

- 大标题居中
- 标题下面一条短横线
- 上面常有一行淡色说明文字

我们提前做一个公共组件，后面 About、Tags、Post 都可以复用这种视觉结构。

### `frontend/src/components/PageTitle.jsx`

## API 请求封装

为了以后不在每个页面里都重复写 `fetch("http://127.0.0.1:8000/...")`，我们先封装一个基础请求文件。

### `frontend/src/api/client.js`

## 先创建页面骨架

这一步先只做最基础的占位页面，确保路由和布局都通了。  
下一条我们再把这些页面替换成真正功能页面。

### `frontend/src/pages/HomePage.jsx`

### `frontend/src/pages/PostDetailPage.jsx`

### `frontend/src/pages/TagsPage.jsx`

### `frontend/src/pages/AboutPage.jsx`

### `frontend/src/pages/NewPostPage.jsx`

## 全局样式

先做一个接近参考博客的基础风格：

- 白底
- 深灰主标题
- 灰色辅助文字
- 大量留白
- 顶部细边线
- 居中内容区
- 标题下短横线

### `frontend/src/styles/global.css`

## 前端运行

```bash
cd frontend
npm run dev
```

正常会看到类似：

```bash
VITE v... ready in ...
Local: http://localhost:5173/
```
访问

## 文件作用总结

### `main.jsx`
React 应用真正挂载到页面的入口。

### `App.jsx`
整个前端的路由总表，决定每个 URL 对应哪个页面。

### `MainLayout.jsx`
统一布局框架，所有主要页面共享顶部导航和主内容区。

### `Header.jsx`
顶部导航栏，负责页面切换。

### `PageTitle.jsx`
复用型标题组件，用来做你参考博客那种：
- 上方小字
- 大标题
- 下方短横线

### `client.js`
前后端通信封装，以后所有接口请求都从这里走。

### `global.css`
全站样式基础，决定博客整体气质。

<hr>

## 容器化（Docker）

### 为什么容器化

- **环境一致性**：换服务器只需装 Docker，一条命令跑起来，不再需要手动装 Node.js、Python、Nginx
- **依赖隔离**：Node.js 和 Python 只存在于镜像内部，不污染宿主机
- **一键部署**：`docker compose up -d` 替代多个手动步骤
- **崩溃自愈**：`restart: unless-stopped` 替代 systemd

### 核心概念

| 概念 | 类比 | 说明 |
|---|---|---|
| 镜像（Image） | 游戏安装包 | 包含代码 + 依赖 + 运行环境，一次构建到处运行 |
| 容器（Container） | 运行中的游戏 | 镜像跑起来之后的进程，隔离运行 |
| Dockerfile | 安装说明书 | 定义镜像怎么构建（装什么依赖、复制哪些文件、启动什么命令） |
| docker-compose.yml | 多服务编排 | 定义多个容器怎么协作（网络、端口、卷、环境变量） |
| Volume（卷） | 外接硬盘 | 把宿主机目录挂载进容器，容器删了数据不丢 |
| 多阶段构建 | 用完就扔 | 第一个阶段编译代码，第二个阶段只保留产物，最终镜像极小 |

### 新建文件清单

```
dreamland/
├── docker-compose.yml          # 编排 backend + frontend 两个服务
├── .dockerignore               # 全局排除（node_modules、venv、.git 等）
├── backend/
│   ├── Dockerfile              # Python 3.11-slim + pip install + uvicorn
│   └── .dockerignore           # 排除 venv、.env、blog.db
└── frontend/
    ├── Dockerfile              # 多阶段：node:20-alpine 构建 → nginx:alpine 托管
    ├── nginx.conf              # 静态文件 + 代理 /posts/ /tags/ /site/ 到 backend
    └── .dockerignore           # 排除 node_modules、dist
```

### 关键设计决策

1. **Nginx 替代 CORS**：容器化后浏览器只和 Nginx 通信（同源），Nginx 在服务端转发给 FastAPI，跨域问题自然消失。`DISABLE_CORS=true` 可跳过 CORS 中间件。

2. **SQLite 数据持久化**：`docker-compose.yml` 中 `volumes: - ./backend/data:/app/data` 把 blog.db 存在宿主机，容器重建不丢数据。

3. **密钥不进镜像**：`.env` 通过 `env_file` 在启动时注入，`.dockerignore` 排除 `.env`，`ADMIN_SECRET` 不会被打包进镜像。

4. **前端用相对路径**：`client.js` 中 `BASE_URL` 默认空字符串，API 请求走同源，由 Nginx 代理到后端。

### 常用命令

```bash
# 构建并启动（开发/测试）
docker compose up -d --build

# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f

# 停止
docker compose down

# 清理旧镜像
docker system prune -f
```

### 迁移注意事项

- 服务器只需装 Docker + Docker Compose（`apt install docker.io docker-compose-v2`）
- 把 `blog.db` 放到 `backend/data/` 目录下
- 宿主机不需要再装 Node.js、Python、Nginx
- 不再需要 systemd 管理后端进程
- HTTPS 证书需要额外处理（挂载进 Nginx 容器或使用 nginx-proxy + acme-companion）

## 新增文章列表项组件

为了让首页代码更清晰，我们把单篇文章卡片拆出来。这个组件会模仿参考博客的文章列表效果：

- 显示日期
- 显示标题
- 标题下短横线
- 显示摘要
- hover 时横线变长
- 整个区块可点击

### `frontend/src/components/PostListItem.jsx`

## 首页：从后端获取文章列表

把 `HomePage` 改成真正请求 `/posts/`。

### `frontend/src/pages/HomePage.jsx`

## 文章详情页：获取单篇文章并渲染 Markdown

这一步会用 `react-markdown` 来渲染正文。

### `frontend/src/pages/PostDetailPage.jsx`

## Tags 页面：显示所有标签，并支持点击某个标签查看相关文章

为了简单直观，我们把这个页面做成：

- 页面顶部大标题 `Tags`
- 一排 tag 按钮
- 点击某个 tag 后，下方列出相关文章

另外，如果从文章详情页点进来，URL 会带 `?tag=某某标签`，这样能自动选中对应标签。

### `frontend/src/pages/TagsPage.jsx`

## About 页面：从后端读取 About 内容并渲染 Markdown

### `frontend/src/pages/AboutPage.jsx`

## 样式：文章列表、详情页、tags 页、Markdown 正文

把以下样式**追加**到 `frontend/src/styles/global.css` 最后面。

### `frontend/src/styles/global.css` 


## 测试前端

确保两个服务都在运行即可


## 把 NewPostPage 改成真正的发帖页

### `frontend/src/pages/NewPostPage.jsx`

## 给全局样式追加发帖页样式

把下面这些样式**追加到** `frontend/src/styles/global.css` 最后面。

### `frontend/src/styles/global.css` 追加内容

## 怎么使用前端发帖

启动前后端,在前端的网页后输入`admin/new`

## mvp产品

已实现：
- 看文章列表
- 看文章详情
- Markdown 渲染
- About 页面
- Tags 页面
- **前端发帖**
- 发帖后写入后端数据库
- 发帖后前台实时可见

## 为什么发帖后前端会改变

前端不是静态写死的，而是**每次页面加载都从后端接口取数据**：

- 首页从 `/posts/` 取
- 详情页从 `/posts/{slug}` 取
- 标签页从 `/tags/` 和 `/tags/{tag_name}` 取

所以只要后端数据库变了，前端再次请求时看到的就是新数据。

这就是“前后端分离博客”的基本工作方式。

## 修改

我们这次会新增/修改这些文件：

```bash
src/
├─ components/
│  ├─ Header.jsx              # 改导航
│  ├─ ProfileCard.jsx         # 新增：首页左侧个人卡片
│  └─ FriendCard.jsx          # 新增：友链卡片
├─ data/
│  ├─ profile.js              # 新增：个人资料配置
│  └─ friends.js              # 新增：友链数据
├─ pages/
│  ├─ HomePage.jsx            # 改成左卡片 + 右文章列表
│  └─ FriendsPage.jsx         # 新增：友链页
├─ App.jsx                    # 注册 /friends 路由
└─ styles/
   └─ global.css              # 追加新样式
```

另外要安装一个图标库：

```bash
npm install react-icons
```

## 新增 profile 配置文件

### `frontend/src/data/profile.js`

- 专门存你的个人资料卡片信息。
- 以后你想改名字、简介、头像、社交链接，
- 都只需要改这里，不用去组件里到处找。

## 新增友链数据文件

### `frontend/src/data/friends.js`

## 新增个人卡片组件

### `frontend/src/components/ProfileCard.jsx`

### `frontend/src/components/FriendCard.jsx`

## 改首页 HomePage

这里要同时请求：
- 文章列表
- 标签列表

因为左侧卡片要显示文章数和标签数。

### `frontend/src/pages/HomePage.jsx`

## 新增 Friends 页面

### `frontend/src/pages/FriendsPage.jsx`


## 后端加入管理员密钥配置

我们先在后端写一个固定的管理员密钥读取方式。  
首版先直接写在代码里也行，但更推荐你用**环境变量**。

### 修改 `backend/app/main.py`

## 让发帖接口校验管理员密钥

### 修改 `backend/app/routers/posts.py`

## 先在本地设置环境变量

这是关键一步。  
因为后端现在会读取：

```bash
ADMIN_SECRET
```

### Windows PowerShell 临时设置方法

你在启动后端前，先执行：

```powershell
$env:ADMIN_SECRET="your-super-secret-key"
```

例如：

```powershell
$env:ADMIN_SECRET="ramenboy-admin-2025"
```

然后再启动后端：

```powershell
uvicorn app.main:app --reload
```

### 注意
这个设置是**当前终端会话临时生效**。  
你关掉终端就没了。

这在开发阶段完全没问题。

## 先测试后端有没有读到密钥

启动后端后，打开：

```text
http://127.0.0.1:8000/admin/check
```

如果看到：

```json
{
  "admin_secret_configured": true
}
```

说明后端已经成功读到密钥。

如果是 `false`，说明你环境变量没设置成功。

---

## 前端请求封装要支持管理员密钥

现在我们要让前端发帖时，在请求头里加上：

```http
X-Admin-Secret: 你输入的密钥
```

### 修改 `frontend/src/api/client.js`

## 前端发帖页增加密钥输入框

### 修改 `frontend/src/pages/NewPostPage.jsx`

## 怎么测试这套管理员保护

### 先启动后端前设置密钥

```powershell
$env:ADMIN_SECRET="ramenboy-admin-2025"
uvicorn app.main:app --reload
```

### 验证后端确实读到了密钥
打开：

```text
http://127.0.0.1:8000/admin/check
```

应该看到：

```json
{
  "admin_secret_configured": true
}
```

### 打开发帖页
```text
http://localhost:5173/admin/new
```

你会看到页面最上方多了一个：

- 管理员密钥 Admin Secret

## 部署前准备 

### 1）前端：把 API 地址改成环境变量

#### 改 `frontend/src/api/client.js`

#### 新建 `frontend/.env.development`

#### 新建 `frontend/.env.example`

### 2）后端：把 CORS 改成环境变量

#### 新建 `backend/.env.example`

#### 修改 `backend/app/main.py`

### 3）补一个 `.gitignore`

如果你还没有把 `.env` 忽略掉，建议加上：

#### 根目录 `.gitignore` 追加


### 4）本地怎么跑

在 `backend/` 下：

```powershell
pip install -r requirements.txt
```

然后新建 `backend/.env`：

```env
ADMIN_SECRET=ramenboy-admin-2025
CORS_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
```

启动：

```powershell
uvicorn app.main:app --reload
```

前端,在 `frontend/` 下：

```bash
npm run dev
```

服务器部署中说明：
在后端的`.env`中，现在我们先用 IP 部署，所以先写 IP。

以后切域名时再改成：

```env
CORS_ORIGINS=https://ramenboy.cc,https://blog.ramenboy.cc
```

以后怎么管理这个服务
- 查看状态
```bash
sudo systemctl status dreamland-backend
```

- 重启服务
```bash
sudo systemctl restart dreamland-backend
```

- 停止服务
```bash
sudo systemctl stop dreamland-backend
```

- 查看日志

```bash
sudo journalctl -u dreamland-backend -n 50
```

- 持续看日志：

```bash
sudo journalctl -u dreamland-backend -f
```