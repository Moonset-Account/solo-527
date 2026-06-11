# sitemap-checker

站点地图死链检查 CLI — 给内容运营上线前使用。

## 功能

- 🗺️ 读取 sitemap (本地 XML 或远程 URL)、页面导出 (TXT/CSV)、白名单文件
- 🔍 检查：
  - **404 死链**（内部 + 外链 HEAD）
  - **重定向链过长 / 循环**（超过 `--max-redirects` 步）
  - **标题缺失 / 为空**（`<title>`）
  - **Canonical 冲突 / 缺失**
  - **图片资源 404**
- 🛡️ **区分真实死链 vs 网络错误**：超时 / SSL / 连接异常标记为"需人工确认"，避免内容运营误删页面
- 🚦 速率限制 + 并发控制
- 🔢 `--max-depth` 控制爬取深度
- 📊 输出 **JSON** 和 **Markdown** 报告
- 🛠️ **修复计划**区分内部链接、外部链接、图片资源三类，内容运营确认后可输出可执行的 sed 替换脚本

## 安装

```bash
pip install -e ".[dev]"
```

## 快速使用

```bash
# 基础用法：指定 sitemap 和域名
sitemap-checker check \
  --sitemap https://example.com/sitemap.xml \
  --domain example.com \
  --markdown report.md \
  --json report.json

# 从页面导出文件 + sitemap + 白名单
sitemap-checker check \
  --sitemap ./examples/sitemap.xml \
  --pages ./examples/pages.csv \
  --whitelist ./examples/whitelist.txt \
  --max-depth 3 \
  --rate-limit 5 \
  --markdown report.md \
  --replace-script fix-links.sh

# 深度 0：只检查输入链接，不爬取页面内的链接
sitemap-checker check \
  --pages urls.txt \
  --max-depth 0
```

## 参数

| 参数 | 说明 | 默认 |
|------|------|------|
| `--sitemap / -s` | Sitemap URL 或本地路径，可多次指定 | — |
| `--pages / -p` | 页面导出文件 (TXT / CSV，每行一个 URL) | — |
| `--whitelist / -w` | 白名单文件，支持 `*` 通配符 | — |
| `--domain / -d` | 基础域名，用于区分内/外链，默认自动推断 | — |
| `--max-depth` | 最大爬取深度 (0 = 仅检查输入链接) | 2 |
| `--max-redirects` | 最大重定向链长度 | 3 |
| `--rate-limit / -r` | 每秒最大请求数 | 10 |
| `--concurrency / -c` | 最大并发请求数 | 20 |
| `--timeout` | 单次请求超时秒数 | 15 |
| `--retries` | 网络错误重试次数 | 2 |
| `--no-title-check` | 跳过标题检查 | false |
| `--no-canonical-check` | 跳过 canonical 检查 | false |
| `--no-image-check` | 跳过图片资源检查 | false |
| `--json` | 输出 JSON 报告路径 | — |
| `--markdown / -o` | 输出 Markdown 报告路径 | — |
| `--replace-script` | 生成 sed 批量替换脚本 | — |
| `--print-json` | 将 JSON 报告打印到 stdout | false |

## 退出码

- `0` 扫描完成，无严重问题
- `1` 参数错误 / 运行异常
- `2` 扫描完成，存在严重问题（如 404）

## 网络错误 vs 真实死链

| 错误类型 | 分类 | 建议 |
|----------|------|------|
| HTTP 404 / 410 | ✅ 真实死链 | 移除或修复链接 |
| HTTP 5xx | ⚠️ 服务器错误 | 稍后重试或联系对方 |
| DNS 解析失败 | ✅ 高概率死链 | 确认域名是否过期 |
| 请求超时 | ⚠️ 需人工确认 | 目标服务器慢或临时性问题，不要直接删 |
| SSL 证书错误 | ⚠️ 需人工确认 | 可能是临时配置问题 |
| 连接被拒 / 网络不可达 | ⚠️ 需人工确认 | 可能是临时性网络波动 |

## 修复脚本

生成的替换脚本默认 **dry-run**：

```bash
# 查看将执行哪些替换
bash fix-links.sh

# 内容运营确认后实际执行
CONFIRMED=1 SEARCH_ROOT=./content bash fix-links.sh
```
