# RSS 部署说明

这份仓库没有生产服务器的 deploy.sh、反向代理配置、API 端口和正式域名信息，以下是需要在服务器按现状核对后执行的配置模板。它不是线上已部署或已验证的证明。

## 服务器环境

在后端运行环境安装 backend/requirement.txt，并在 backend/.env 设置：

    SITE_URL=https://你的正式域名
    RSS_TITLE=Dreamland
    RSS_DESCRIPTION=Dreamland 文章更新
    RSS_AUTHOR=Dreamland
    RSS_LIMIT=50
    RSS_ID_NAMESPACE=部署后永久固定的命名空间

SITE_URL 必须是正式 HTTPS 网站地址；RSS_ID_NAMESPACE 一旦发布不要再改。保留现有 DATABASE_URL、ADMIN_SECRET 和 CORS_ORIGINS 配置，不要把密钥提交到仓库。

## 反向代理

若 API 实际监听 127.0.0.1:8000，在 SPA fallback 之前增加精确匹配：

    location = /rss.xml {
        proxy_pass http://127.0.0.1:8000/rss.xml;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

保留现有 /posts/ 等 API 规则和 / 的前端 fallback。不要让 /rss.xml 经过会返回 index.html 的 fallback，也不要删除 /rss.xml 路径前缀。代理/CDN 应转发 ETag、Cache-Control、Content-Type 和 If-None-Match。

## 上线顺序与验收

1. 备份服务器代理配置和数据库，核对实际 API 端口、服务用户、正式域名及图片域名。
2. 在后端环境安装依赖并更新 .env，重启 FastAPI 服务。
3. 部署前端构建产物和精确 /rss.xml 代理规则。
4. 从公网检查 curl -i https://你的正式域名/rss.xml：应为 200、application/rss+xml，正文是 RSS XML 而不是 HTML。
5. 复制响应中的 ETag，用 curl -i -H 'If-None-Match: ...' 检查返回 304。
6. 检查文章链接和图片 URL 均为可访问的绝对地址，再用实际阅读器完成自动发现、全文和图片验收。

当前仓库只验证本地隔离数据库、后端响应和前端构建；正式域名、服务器代理、生产文章、第三方图床、CDN/WAF 和阅读器客户端仍需你在部署环境验证。
