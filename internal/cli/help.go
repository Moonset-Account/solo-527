package cli

import "fmt"

func FullHelpText() string {
	return `logsum - 日志摘要与错误聚类工具

用法:
  logsum [flags] <logfile> [<logfile>...]
  logsum [flags] -                 # 从 stdin 读取
  cat app.log | logsum [flags] -   # 管道输入

描述:
  解析多服务日志文件，按服务/环境/时间/请求 ID 过滤，对错误进行聚类，
  截取上下文，并以文本或 JSON 格式导出摘要。默认行为保守：仅报告 ERROR/FATAL，
  输出前 10 个聚类，默认 text 格式方便人读。

选择参数:
  -s, --service <names>     过滤服务名，逗号分隔，可重复
                              例: --service api-gateway,user-svc
  --env <names>             过滤环境: prod,staging,dev,...
  --level <levels>          过滤级别: DEBUG,INFO,WARN,ERROR,FATAL
  --request-id <ids>        过滤请求/追踪 ID

时间范围:
  --since <duration>        相对回看: 30m, 2h, 1d, 1w (以最新日志时间为锚)
  --since-time <time>       绝对起始时间，RFC3339 或 YYYY-MM-DD HH:MM:SS
  --until <time>            绝对结束时间，格式同上

输出控制:
  -f, --format <fmt>        输出格式: text (默认) | json
  -j, --json               等同于 --format json (便捷写法)
  -o, --output <path>      写入文件而非 stdout
  -n, --top <N>            显示前 N 个错误聚类 (默认 10)
  -C, --context <N>          每个匹配前后上下文行数 (默认 2)
  --clusters=<bool>          是否启用错误聚类 (默认 true)
  -e, --errors-only=<bool>  仅 ERROR/FATAL 级别 (默认 true)
  --fail-on-errors         发现错误条目时以退出码 99 退出

杂项:
  -v, --version            显示版本信息
  -h, --help               显示此帮助
  --verbose                打开详细调试输出
  -q, --quiet              只输出报告，不输出进度

退出码:
  0   成功，无错误条目 (或关闭 errors-only)
  2   参数错误
  3   文件读取错误
  4   日志解析严重错误
  5   无匹配结果
  99  --fail-on-errors 且发现错误条目
  1   其它内部错误

示例:
  # 1) 最近 2 小时的 user-svc 和 order-svc 错误，JSON 导出
  logsum --since 2h --service user-svc,order-svc --json -o report.json /var/log/app/*.log

  # 2) 指定时间段全量服务，只看 request-id，附 5 行上下文
  logsum --since-time "2026-06-09 09:00:00" --until "2026-06-09 18:00:00" \
         --request-id abc-123 --context 5 /var/log/svc.log

  # 3) 管道 + stderr 重定向，给自动化脚本用（flags 写在最前）
  kubectl logs -n prod deploy/api | logsum --json --fail-on-errors - > /tmp/err.json; echo $?

  # 4) 只看 WARN 及以上（关闭 errors-only），前 20 聚类
  logsum --level WARN,ERROR,FATAL --errors-only=false -n 20 ./app.log

  # 5) 直接 --json 便捷写法
  logsum --json ./app.log | jq '.stats'

项目:
  源码及最新文档: https://github.com/backend-ops/logsum
`
}

func VersionText() string {
	return fmt.Sprintf("logsum %s (build %s)\n", Version, Build)
}
