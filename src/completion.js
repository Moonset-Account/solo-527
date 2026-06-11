'use strict';

const BASH_COMPLETION = `###-begin-config-merger-completion-###
_config_merger_completion() {
  local cur prev words cword
  _init_completion || return

  local opts="--base --overlay --strategy --array-strategy --schema --output --print
              --dry-run --preview --verbose --quiet --machine-readable --no-color
              --sensitive-keys --no-sensitive --mask-type --detect-conflicts --no-conflicts
              --help --version --completion --examples --config"

  local strategies="deep shallow overlay"
  local array_strategies="replace concat merge unique prepend"
  local formats="json yaml yml"
  local mask_types="default full partial hash remove"

  case $prev in
    --base|--overlay|-b|-o)
      _filedir '@(json|yaml|yml)'
      return 0
      ;;
    --schema)
      _filedir '@(json|yaml|yml)'
      return 0
      ;;
    --output)
      _filedir
      return 0
      ;;
    --strategy|-s)
      COMPREPLY=( $(compgen -W "$strategies" -- $cur) )
      return 0
      ;;
    --array-strategy|-a)
      COMPREPLY=( $(compgen -W "$array_strategies" -- $cur) )
      return 0
      ;;
    --print|-p)
      COMPREPLY=( $(compgen -W "$formats" -- $cur) )
      return 0
      ;;
    --mask-type)
      COMPREPLY=( $(compgen -W "$mask_types" -- $cur) )
      return 0
      ;;
    --config|-c)
      _filedir '@(json|yaml|yml)'
      return 0
      ;;
    --completion)
      COMPREPLY=( $(compgen -W "bash zsh fish" -- $cur) )
      return 0
      ;;
  esac

  if [[ $cur == -* ]]; then
    COMPREPLY=( $(compgen -W "$opts" -- $cur) )
    return 0
  fi

  _filedir '@(json|yaml|yml)'
} &&
complete -F _config_merger_completion config-merger
###-end-config-merger-completion-###
`;

const ZSH_COMPLETION = `#compdef config-merger

_arguments -C \\
  '(--base -b)'{--base=,-b+}'[基础配置文件]:file:_files -g "*.(json|yaml|yml)"' \\
  '(--overlay -o)'{--overlay=,-o+}'[覆盖配置文件(可多次指定)]:file:_files -g "*.(json|yaml|yml)"' \\
  '(--strategy -s)'{--strategy=,-s+}'[合并策略]:strategy:(deep shallow overlay)' \\
  '(--array-strategy -a)'{--array-strategy=,-a+}'[数组合并策略]:array:(replace concat merge unique prepend)' \\
  '--schema=[Schema校验文件]:file:_files -g "*.(json|yaml|yml)"' \\
  '(--output -O)'{--output=,-O+}'[输出文件路径]:file:_files' \\
  '(--print -p)'{--print=,-p+}'[打印输出格式]:format:(json yaml yml)' \\
  '--dry-run[试运行模式，不写入文件]' \\
  '--preview[预览合并结果及差异]' \\
  '(--verbose -v)'{--verbose,-v}'[详细模式，显示更多信息]' \\
  '(--quiet -q)'{--quiet,-q}'[安静模式，仅显示错误]' \\
  '--machine-readable[机器可读输出(JSON格式)]' \\
  '--no-color[禁用彩色输出]' \\
  '--sensitive-keys=[指定敏感键(逗号分隔)]:keys:' \\
  '--no-sensitive[禁用敏感键检测]' \\
  '--mask-type=[脱敏类型]:type:(default full partial hash remove)' \\
  '--detect-conflicts[启用冲突检测(默认)]' \\
  '--no-conflicts[禁用冲突检测]' \\
  '(--config -c)'{--config=,-c+}'[配置文件]:file:_files -g "*.(json|yaml|yml)"' \\
  '--examples[显示示例命令]' \\
  '--completion=[生成Shell补全]:shell:(bash zsh fish)' \\
  '(--help -h)'{--help,-h}'[显示帮助信息]' \\
  '(--version -V)'{--version,-V}'[显示版本号]' &&
return 0
`;

const FISH_COMPLETION = `# config-merger fish completion

function __fish_config_merger_no_subcommand
    set -l cmd (commandline -opc)
    if test (count $cmd) -eq 1
        return 0
    end
    return 1
end

function __fish_config_merger_complete_config_files
    __fish_complete_suffix .json .yaml .yml
end

# Base options
complete -c config-merger -f -l base -s b -x -a "(__fish_config_merger_complete_config_files)" -d "基础配置文件" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l overlay -s o -x -a "(__fish_config_merger_complete_config_files)" -d "覆盖配置文件(可多次指定)" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l strategy -s s -x -a "deep shallow overlay" -d "合并策略" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l array-strategy -s a -x -a "replace concat merge unique prepend" -d "数组合并策略" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l schema -x -a "(__fish_config_merger_complete_config_files)" -d "Schema校验文件" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l output -s O -r -d "输出文件路径" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l print -s p -x -a "json yaml yml" -d "打印输出格式" -n __fish_config_merger_no_subcommand

# Mode options
complete -c config-merger -f -l dry-run -d "试运行模式，不写入文件" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l preview -d "预览合并结果及差异" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l verbose -s v -d "详细模式，显示更多信息" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l quiet -s q -d "安静模式，仅显示错误" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l machine-readable -d "机器可读输出(JSON格式)" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l no-color -d "禁用彩色输出" -n __fish_config_merger_no_subcommand

# Sensitive options
complete -c config-merger -f -l sensitive-keys -x -d "指定敏感键(逗号分隔)" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l no-sensitive -d "禁用敏感键检测" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l mask-type -x -a "default full partial hash remove" -d "脱敏类型" -n __fish_config_merger_no_subcommand

# Conflict detection
complete -c config-merger -f -l detect-conflicts -d "启用冲突检测(默认)" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l no-conflicts -d "禁用冲突检测" -n __fish_config_merger_no_subcommand

# Help options
complete -c config-merger -f -l config -s c -x -a "(__fish_config_merger_complete_config_files)" -d "配置文件" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l examples -d "显示示例命令" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l completion -x -a "bash zsh fish" -d "生成Shell补全" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l help -s h -d "显示帮助信息" -n __fish_config_merger_no_subcommand
complete -c config-merger -f -l version -s V -d "显示版本号" -n __fish_config_merger_no_subcommand
`;

function getCompletion(shell) {
  switch (shell.toLowerCase()) {
    case 'bash':
      return BASH_COMPLETION;
    case 'zsh':
      return ZSH_COMPLETION;
    case 'fish':
      return FISH_COMPLETION;
    default:
      throw new Error(`不支持的 Shell: ${shell}。支持: bash, zsh, fish`);
  }
}

function detectShell() {
  const shell = process.env.SHELL || '';
  if (shell.includes('zsh')) return 'zsh';
  if (shell.includes('fish')) return 'fish';
  return 'bash';
}

function printSetupInstructions(shell) {
  const shellName = shell || detectShell();
  const instructions = {
    bash: [
      '# Bash 补全安装说明',
      '# 方式1: 直接使用 (临时)',
      'source <(config-merger --completion bash)',
      '',
      '# 方式2: 永久启用 (推荐)',
      'config-merger --completion bash > ~/.config-merger-completion.bash',
      'echo "source ~/.config-merger-completion.bash" >> ~/.bashrc',
      '',
      '# 方式3: 全局安装',
      'config-merger --completion bash | sudo tee /etc/bash_completion.d/config-merger',
    ],
    zsh: [
      '# Zsh 补全安装说明',
      '# 方式1: 直接使用 (临时)',
      'source <(config-merger --completion zsh)',
      '',
      '# 方式2: 永久启用 (推荐)',
      'mkdir -p ~/.zsh/completions',
      'config-merger --completion zsh > ~/.zsh/completions/_config-merger',
      'echo "fpath=(~/.zsh/completions \\$fpath)" >> ~/.zshrc',
      'echo "autoload -Uz compinit && compinit" >> ~/.zshrc',
    ],
    fish: [
      '# Fish 补全安装说明',
      '',
      'config-merger --completion fish > ~/.config/fish/completions/config-merger.fish',
    ]
  };

  return (instructions[shellName] || instructions.bash).join('\n');
}

module.exports = {
  BASH_COMPLETION,
  ZSH_COMPLETION,
  FISH_COMPLETION,
  getCompletion,
  detectShell,
  printSetupInstructions
};
