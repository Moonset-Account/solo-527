import type { Vec2 } from '@/game/types';

export type TargetKind = 'canvas' | 'component' | 'port' | 'wire';

export type ActionType =
  | {
      type: 'pointer-down';
      pos: Vec2;
      button: number;
      targetKind: TargetKind;
      targetId?: string;
      ctrl: boolean;
    }
  | {
      type: 'pointer-move';
      pos: Vec2;
      buttons: number;
    }
  | {
      type: 'pointer-up';
      pos: Vec2;
      button: number;
    }
  | {
      type: 'double-click';
      pos: Vec2;
      targetKind: TargetKind;
      targetId?: string;
    }
  | {
      type: 'key-down';
      key: string;
      ctrl: boolean;
      shift: boolean;
      alt: boolean;
    }
  | {
      type: 'wheel';
      pos: Vec2;
      deltaY: number;
      ctrl: boolean;
    }
  | {
      type: 'context-menu';
      pos: Vec2;
      targetKind: TargetKind;
      targetId?: string;
    };

type TransformCallback = (v: Vec2) => Vec2;

const DATASET_KIND = 'data-kind';
const DATASET_ID = 'data-id';

function resolveTarget(target: EventTarget | null): {
  kind: TargetKind;
  id?: string;
} {
  if (!(target instanceof Element)) {
    return { kind: 'canvas' };
  }
  let el: Element | null = target;
  while (el) {
    const kind = el.getAttribute(DATASET_KIND) as TargetKind | null;
    if (kind) {
      const id = el.getAttribute(DATASET_ID) ?? undefined;
      return { kind, id };
    }
    el = el.parentElement;
  }
  return { kind: 'canvas' };
}

export class InputMapper {
  private _target: HTMLElement;
  private _handlers: Set<(action: ActionType) => void> = new Set();
  private _transformCb: TransformCallback | null = null;
  private _listeners: Array<{
    event: string;
    handler: EventListener;
    opts?: AddEventListenerOptions;
  }> = [];
  public lastWorldPos: Vec2 = { x: 0, y: 0 };

  constructor(targetElement: HTMLElement) {
    this._target = targetElement;
    this._attachListeners();
  }

  setTransformCallback(cb: TransformCallback): void {
    this._transformCb = cb;
  }

  onAction(handler: (action: ActionType) => void): () => void {
    this._handlers.add(handler);
    return () => {
      this._handlers.delete(handler);
    };
  }

  destroy(): void {
    for (const { event, handler, opts } of this._listeners) {
      this._target.removeEventListener(event, handler, opts);
    }
    this._listeners = [];
    this._handlers.clear();
    this._transformCb = null;
  }

  private _dispatch(action: ActionType): void {
    for (const handler of this._handlers) {
      try {
        handler(action);
      } catch (err) {
        console.error('[InputMapper] handler error:', err);
      }
    }
  }

  private _canvasToWorld(canvasX: number, canvasY: number): Vec2 {
    const rect = this._target.getBoundingClientRect();
    const localX = canvasX - rect.left;
    const localY = canvasY - rect.top;
    const v: Vec2 = { x: localX, y: localY };
    if (this._transformCb) {
      return this._transformCb(v);
    }
    return v;
  }

  private _attachListeners(): void {
    const target = this._target;

    const onPointerDown = (e: Event) => {
      const evt = e as PointerEvent;
      const resolved = resolveTarget(evt.target);
      const pos = this._canvasToWorld(evt.clientX, evt.clientY);
      this.lastWorldPos = pos;
      this._dispatch({
        type: 'pointer-down',
        pos,
        button: evt.button,
        targetKind: resolved.kind,
        targetId: resolved.id,
        ctrl: evt.ctrlKey || evt.metaKey,
      });
    };

    const onPointerMove = (e: Event) => {
      const evt = e as PointerEvent;
      const pos = this._canvasToWorld(evt.clientX, evt.clientY);
      this.lastWorldPos = pos;
      this._dispatch({
        type: 'pointer-move',
        pos,
        buttons: evt.buttons,
      });
    };

    const onPointerUp = (e: Event) => {
      const evt = e as PointerEvent;
      const pos = this._canvasToWorld(evt.clientX, evt.clientY);
      this._dispatch({
        type: 'pointer-up',
        pos,
        button: evt.button,
      });
    };

    const onDblClick = (e: Event) => {
      const evt = e as MouseEvent;
      const resolved = resolveTarget(evt.target);
      const pos = this._canvasToWorld(evt.clientX, evt.clientY);
      this._dispatch({
        type: 'double-click',
        pos,
        targetKind: resolved.kind,
        targetId: resolved.id,
      });
    };

    const onKeyDown = (e: Event) => {
      const evt = e as KeyboardEvent;
      this._dispatch({
        type: 'key-down',
        key: evt.key,
        ctrl: evt.ctrlKey || evt.metaKey,
        shift: evt.shiftKey,
        alt: evt.altKey,
      });
    };

    const onWheel = (e: Event) => {
      const evt = e as WheelEvent;
      evt.preventDefault();
      const pos = this._canvasToWorld(evt.clientX, evt.clientY);
      this._dispatch({
        type: 'wheel',
        pos,
        deltaY: evt.deltaY,
        ctrl: evt.ctrlKey || evt.metaKey,
      });
    };

    const onContextMenu = (e: Event) => {
      const evt = e as MouseEvent;
      evt.preventDefault();
      const resolved = resolveTarget(evt.target);
      const pos = this._canvasToWorld(evt.clientX, evt.clientY);
      this._dispatch({
        type: 'context-menu',
        pos,
        targetKind: resolved.kind,
        targetId: resolved.id,
      });
    };

    target.addEventListener('pointerdown', onPointerDown);
    this._listeners.push({ event: 'pointerdown', handler: onPointerDown });

    window.addEventListener('pointermove', onPointerMove);
    this._listeners.push({
      event: 'pointermove',
      handler: onPointerMove as EventListener,
    });

    window.addEventListener('pointerup', onPointerUp);
    this._listeners.push({
      event: 'pointerup',
      handler: onPointerUp as EventListener,
    });

    target.addEventListener('dblclick', onDblClick);
    this._listeners.push({ event: 'dblclick', handler: onDblClick });

    window.addEventListener('keydown', onKeyDown);
    this._listeners.push({
      event: 'keydown',
      handler: onKeyDown as EventListener,
    });

    target.addEventListener('wheel', onWheel, { passive: false });
    this._listeners.push({
      event: 'wheel',
      handler: onWheel,
      opts: { passive: false },
    });

    target.addEventListener('contextmenu', onContextMenu);
    this._listeners.push({ event: 'contextmenu', handler: onContextMenu });
  }
}
