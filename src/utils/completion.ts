import * as fs from 'fs';
import * as os from 'os';
import { AppError } from './errors';
import { PathUtils } from './path';
import { logger } from './logger';

export class CompletionGenerator {
  static generate(shell: 'bash' | 'zsh'): string {
    switch (shell) {
      case 'bash':
        return this.generateBash();
      case 'zsh':
        return this.generateZsh();
      default:
        throw new AppError(`不支持的 shell: ${shell}`, {
          code: 'UNSUPPORTED_SHELL',
          suggestions: ['支持的 shell: bash, zsh'],
        });
    }
  }

  private static generateBash(): string {
    return `# api-smoke bash completion script
# 安装:
#   1. 将此脚本保存到 /etc/bash_completion.d/api-smoke (系统级)
#   2. 或保存到 ~/.bash_completion.d/api-smoke 并 source 它
#   3. 或直接: source <(api-smoke completion bash)

_api-smoke_completions() {
  local cur prev opts
  COMPREPLY=()
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"

  local boolean_flags="--verbose --silent --no-color --dry-run --bail --strict-variables --fail-on-zero-tests --insecure"
  local value_flags="-c --collection -e --env -p --parallel -j --junit --json -o --output -l --log-level -t --timeout -r --retries --retry-delay -f --filter --tags --exclude-tags -g --global"
  local all_flags="\${boolean_flags} \${value_flags} -v --version -h --help -n -k --no-follow-redirects"
  local commands="completion"

  case "\${prev}" in
    -c|--collection|-e|--env)
      COMPREPLY=( $(compgen -f -X '!*.@(json|yaml|yml)' -- "\${cur}") )
      return 0
      ;;
    -j|--junit|--json|-o|--output)
      COMPREPLY=( $(compgen -f -- "\${cur}") )
      return 0
      ;;
    -l|--log-level)
      COMPREPLY=( $(compgen -W "silent error warn info debug verbose" -- "\${cur}") )
      return 0
      ;;
    -p|--parallel|-t|--timeout|-r|--retries|--retry-delay)
      COMPREPLY=( $(compgen -W "1 2 3 4 5 8 10 16 32" -- "\${cur}") )
      return 0
      ;;
    completion)
      COMPREPLY=( $(compgen -W "bash zsh" -- "\${cur}") )
      return 0
      ;;
    -g|--global)
      COMPREPLY=( $(compgen -W "BASE_URL= TOKEN= API_KEY= ENV= DEBUG=" -- "\${cur}") )
      return 0
      ;;
    *)
      ;;
  esac

  if [[ \${cur} == -* ]]; then
    COMPREPLY=( $(compgen -W "\${all_flags}" -- "\${cur}") )
    return 0
  fi

  local first_non_flag=""
  for word in "\${COMP_WORDS[@]:1}"; do
    if [[ "\${word}" != -* ]]; then
      first_non_flag="\${word}"
      break
    fi
  done

  if [[ -z "\${first_non_flag}" ]]; then
    COMPREPLY=( $(compgen -W "\${commands} \${all_flags}" -- "\${cur}") )
    return 0
  fi

  return 0
}

complete -F _api-smoke_completions api-smoke

# 别名支持 (如果使用了别名)
if [ -n "\$API_SMOKE_ALIASES" ]; then
  for alias_name in \$API_SMOKE_ALIASES; do
    complete -F _api-smoke_completions \$alias_name 2>/dev/null
  done
fi
`;
  }

  private static generateZsh(): string {
    return `#compdef api-smoke
# api-smoke zsh completion script
# 安装:
#   1. 将此文件保存为 ~/.zsh/completion/_api-smoke
#   2. 确保 fpath 包含 ~/.zsh/completion: fpath=(~/.zsh/completion \$fpath)
#   3. 在 .zshrc 中启用: autoload -Uz compinit && compinit
#   4. 或直接: source <(api-smoke completion zsh)

local -a opts boolean_opts value_opts subcmds

boolean_opts=(
  '--verbose[等价于 --log-level verbose]'
  '--silent[等价于 --log-level silent]'
  '--no-color[禁用彩色输出]'
  '-n[Dry Run 模式]'
  '--dry-run[预演模式不发送请求]'
  '-b[遇到第一个失败立即停止]'
  '--bail[遇到第一个失败立即停止]'
  '--strict-variables[严格模式: 未定义变量报错]'
  '--fail-on-zero-tests[没有测试用例时返回非零退出码]'
  '-k[关闭 SSL 证书验证]'
  '--insecure[关闭 SSL 证书验证]'
  '--no-follow-redirects[不跟随 HTTP 重定向]'
  '-v[显示版本号]'
  '--version[显示版本号]'
  '-h[显示帮助信息]'
  '--help[显示帮助信息]'
)

value_opts=(
  '-c[测试集合文件路径]:collection file:_files -g "*.json *.yaml *.yml"'
  '--collection[测试集合文件路径]:collection file:_files -g "*.json *.yaml *.yml"'
  '-e[环境变量配置文件]:env file:_files -g "*.json *.yaml *.yml *.env"'
  '--env[环境变量配置文件]:env file:_files -g "*.json *.yaml *.yml *.env"'
  '-p[并发执行数量]:parallel:(1 2 3 4 5 6 8 10 16 32)'
  '--parallel[并发执行数量]:parallel:(1 2 3 4 5 6 8 10 16 32)'
  '-j[导出 JUnit XML 报告]:junit file:_files'
  '--junit[导出 JUnit XML 报告]:junit file:_files'
  '--json[导出 JSON 报告]:json file:_files'
  '-o[统一输出目录]:output dir:_directories'
  '--output[统一输出目录]:output dir:_directories'
  '-l[日志级别]:level:(silent error warn info debug verbose)'
  '--log-level[日志级别]:level:(silent error warn info debug verbose)'
  '-t[请求超时时间(毫秒)]:timeout:(5000 10000 30000 60000 120000)'
  '--timeout[请求超时时间(毫秒)]:timeout:(5000 10000 30000 60000 120000)'
  '-r[失败重试次数]:retries:(0 1 2 3 5)'
  '--retries[失败重试次数]:retries:(0 1 2 3 5)'
  '--retry-delay[重试间隔(毫秒)]:delay:(500 1000 2000 5000)'
  '-f[按用例名称过滤]:filter:'
  '--filter[按用例名称过滤]:filter:'
  '--tags[包含标签(逗号分隔)]:tags:'
  '--exclude-tags[排除标签(逗号分隔)]:tags:'
  '-g[全局变量 KEY=VALUE]:global:'
  '--global[全局变量 KEY=VALUE]:global:'
)

subcmds=(
  'completion:生成 shell 补全脚本'
)

opts=("\${boolean_opts[@]}" "\${value_opts[@]}")

_arguments -C \
  "\${opts[@]}" \
  '1:cmd:->cmds' \
  '*::arg:->args'

case "\$state" in
  cmds)
    _describe -t commands 'api-smoke commands' subcmds
    ;;
  args)
    case "\$words[1]" in
      completion)
        _arguments \
          '1:shell type:(bash zsh)' \
          '--write[自动写入 shell 配置文件]'
        ;;
    esac
    ;;
esac
`;
  }

  static install(shell: 'bash' | 'zsh'): string {
    const script = this.generate(shell);
    let targetPath: string;

    const home = os.homedir();

    switch (shell) {
      case 'bash': {
        const completionDir = PathUtils.join(home, '.bash_completion.d');
        PathUtils.ensureDir(completionDir);
        targetPath = PathUtils.join(completionDir, 'api-smoke');
        fs.writeFileSync(targetPath, script, 'utf-8');

        const bashrc = PathUtils.join(home, '.bashrc');
        if (PathUtils.exists(bashrc)) {
          const content = fs.readFileSync(bashrc, 'utf-8');
          if (!content.includes('.bash_completion.d')) {
            fs.appendFileSync(
              bashrc,
              '\n# api-smoke bash completion\nfor f in ~/.bash_completion.d/*; do [[ -f "$f" ]] && source "$f"; done\n',
              'utf-8'
            );
          }
        }
        break;
      }
      case 'zsh': {
        const completionDir = PathUtils.join(home, '.zsh', 'completion');
        PathUtils.ensureDir(completionDir);
        targetPath = PathUtils.join(completionDir, '_api-smoke');
        fs.writeFileSync(targetPath, script, 'utf-8');

        const zshrc = PathUtils.join(home, '.zshrc');
        if (PathUtils.exists(zshrc)) {
          const content = fs.readFileSync(zshrc, 'utf-8');
          if (!content.includes('compinit')) {
            fs.appendFileSync(
              zshrc,
              '\n# api-smoke zsh completion\nfpath=(~/.zsh/completion $fpath)\nautoload -Uz compinit && compinit\n',
              'utf-8'
            );
          } else if (!content.includes('~/.zsh/completion')) {
            const insertLine = 'fpath=(~/.zsh/completion $fpath)';
            const newContent = content.replace(/(fpath=\()/, `${insertLine}\n$1`);
            if (newContent !== content) {
              fs.writeFileSync(zshrc, newContent, 'utf-8');
            }
          }
        }
        break;
      }
    }

    logger.info(`请重新加载 shell 配置或重启终端使 completion 生效`);
    return targetPath;
  }
}
