# 阿巴菲静态阅读网站

这是米克洛什·约希卡的历史小说《阿巴菲》简体中文静态阅读网站。项目只使用原生 HTML、CSS 和 JavaScript，不需要后端、数据库或构建步骤，可以直接部署到 Vercel。

正文来源参考匈牙利电子图书馆：https://mek.oszk.hu/03800/03850/03850.htm

## 文件结构

```text
.
├── index.html
├── styles.css
├── app.js
├── content/
│   ├── book.md
│   └── meta.json
├── vercel.json
├── .gitignore
└── README.md
```

## 本地预览

不要直接双击打开 `index.html`，因为浏览器可能会阻止 `fetch()` 读取 `content/book.md` 和 `content/meta.json`。

推荐在项目根目录运行：

```bash
python -m http.server 3000
```

然后访问：

```text
http://localhost:3000
```

如果 `python` 命令不可用，可以尝试：

```bash
py -m http.server 3000
```

## 修改书籍内容

- 正文在 `content/book.md`。
- 元数据在 `content/meta.json`。
- Markdown 支持基础结构：`#`、`##`、`###` 标题，普通段落，`>` 引用，`---` 分割线。
- 页面会根据 Markdown 标题自动生成目录，所以新增章节时只需要添加标题和正文。
- 已预留“译者注释”“人物表”“历史背景”“版本说明”四个区域，可以直接在 `content/book.md` 对应标题下补充内容。

## 部署到 Vercel

这个项目没有 build 命令。

Vercel 项目设置：

- Framework Preset: `Other`
- Build Command: 留空
- Output Directory: 项目根目录

`vercel.json` 只启用了 `cleanUrls`，用于保持静态站配置简单可靠。

## 使用 GitHub + Vercel

1. 在本地初始化 Git 仓库并提交：

```bash
git init
git add .
git commit -m "Initial Chinese reading site"
```

2. 在 GitHub 创建一个新仓库。
3. 按 GitHub 页面提示添加远端并推送，例如：

```bash
git remote add origin https://github.com/your-name/abafi.git
git branch -M main
git push -u origin main
```

4. 打开 Vercel，选择 `Add New Project`。
5. 导入这个 GitHub 仓库。
6. Framework Preset 选择 `Other`，Build Command 留空，Output Directory 使用项目根目录。
7. 点击 Deploy。

## 使用 Vercel CLI

安装并登录 Vercel CLI：

```bash
npm i -g vercel
vercel login
```

在项目根目录运行：

```bash
vercel
```

首次部署时按提示选择项目；框架选择 `Other`，不要设置 build 命令。

生产部署：

```bash
vercel --prod
```

## 内容说明

`content/book.md` 当前为机器辅助初译版本，适合作为静态阅读站的初始内容。正式发布前建议继续人工校订专名、诗句、历史术语和长句语气。
