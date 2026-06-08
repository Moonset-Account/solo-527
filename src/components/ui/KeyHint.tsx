import { cn } from './GameButton';
import type { InputDevice, InputAction } from '../../types/config';

interface KeyHintProps {
  action: InputAction;
  device: InputDevice;
  bindings: Record<InputAction, string[]>;
  label?: string;
  className?: string;
}

const DEVICE_ICON: Record<InputDevice, string> = {
  keyboard: '⌨️', mouse: '🖱️', gamepad: '🎮', touch: '👆',
};

const KEY_DISPLAY: Record<string, string> = {
  Enter: '⏎', Space: '␣', Escape: 'Esc',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  LMB: '左键', RMB: '右键', MMB: '中键',
  ScrollUp: '⤒', ScrollDown: '⤓', 'LMB+dbl': '双击',
  A: 'A', B: 'B', X: 'X', Y: 'Y', Cross: '✕', Circle: '◯',
  Square: '□', Triangle: '△', RB: 'RB', LB: 'LB', RT: 'RT', LT: 'LT',
  Start: 'Start', Menu: 'Menu', Options: 'Opt', Back: '←',
  DpadUp: '↑', DpadDown: '↓', DpadLeft: '←', DpadRight: '→',
  Tap: '点击', LongPress: '长按', SwipeDrag: '拖拽',
  SwipeUp: '↑滑', SwipeDown: '↓滑', SwipeRight: '→滑',
  Circular: '画圈', DoubleTap: '双击', TwoFinger: '双指', TripleTap: '三击',
};

const ACTION_LABELS: Record<InputAction, string> = {
  select: '确认', cancel: '取消', drag: '拖拽',
  heat_up: '升温', cool_down: '降温', stir: '搅拌',
  pour: '倒取', menu: '菜单', pause: '暂停', help: '帮助',
};

export function KeyHint({ action, device, bindings, label, className }: KeyHintProps) {
  const keys = bindings[action] || [];
  const primary = keys.find(k => k && k.length > 0);
  if (!primary && !label) return null;
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      <span className="text-xs text-slate-400">{label || ACTION_LABELS[action]}</span>
      {primary && (
        <kbd className={cn(
          'inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-md',
          'text-xs font-semibold tabular-nums',
          'bg-slate-700/90 border border-slate-500/60 text-slate-100',
          'shadow-inner shadow-slate-900/50',
          'border-b-2',
        )}>
          {KEY_DISPLAY[primary] || primary}
        </kbd>
      )}
      <span className="text-xs opacity-40 ml-0.5">{DEVICE_ICON[device]}</span>
    </div>
  );
}
