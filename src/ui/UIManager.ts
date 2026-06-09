import '../styles/global.css';

type ToastType = 'info' | 'success' | 'warn' | 'error';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
  title?: string;
}

interface PanelEntry {
  id: string;
  element: HTMLElement;
  visible: boolean;
}

export class UIManager {
  readonly rootDiv: HTMLElement;
  private panels: Map<string, PanelEntry> = new Map();
  private toastContainer: HTMLElement | null = null;
  private activeToasts: Set<HTMLElement> = new Set();
  private currentModal: HTMLElement | null = null;

  constructor(rootDiv: HTMLElement) {
    this.rootDiv = rootDiv;
    this.ensureToastContainer();
  }

  private ensureToastContainer(): void {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'toast-container';
      document.body.appendChild(this.toastContainer);
    }
  }

  registerPanel(id: string, element: HTMLElement): void {
    this.panels.set(id, { id, element, visible: false });
    if (element.parentElement !== this.rootDiv) {
      this.rootDiv.appendChild(element);
    }
  }

  showPanel(id: string): void {
    const entry = this.panels.get(id);
    if (!entry) return;
    entry.element.classList.remove('hidden');
    entry.visible = true;
  }

  hidePanel(id: string): void {
    const entry = this.panels.get(id);
    if (!entry) return;
    entry.element.classList.add('hidden');
    entry.visible = false;
  }

  togglePanel(id: string): boolean {
    const entry = this.panels.get(id);
    if (!entry) return false;
    if (entry.visible) {
      this.hidePanel(id);
      return false;
    } else {
      this.showPanel(id);
      return true;
    }
  }

  isPanelVisible(id: string): boolean {
    return this.panels.get(id)?.visible ?? false;
  }

  setContent(id: string, html: string | HTMLElement): void {
    const entry = this.panels.get(id);
    if (!entry) return;
    if (typeof html === 'string') {
      entry.element.innerHTML = html;
    } else {
      entry.element.innerHTML = '';
      entry.element.appendChild(html);
    }
  }

  getPanel(id: string): HTMLElement | null {
    return this.panels.get(id)?.element ?? null;
  }

  toast(msg: string, type?: ToastType, duration?: number): void;
  toast(msg: string, options: ToastOptions): void;
  toast(msg: string, arg2?: ToastType | ToastOptions, duration?: number): void {
    const opts: ToastOptions =
      typeof arg2 === 'object' ? arg2 : { type: arg2 ?? 'info', duration };

    const { type = 'info', duration: dur = 3000, title } = opts;

    this.ensureToastContainer();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    const iconMap: Record<ToastType, string> = {
      info: 'ℹ',
      success: '✓',
      warn: '!',
      error: '✕',
    };

    el.innerHTML = `
      <div class="toast-icon">${iconMap[type]}</div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        <div>${msg}</div>
      </div>
    `;

    this.toastContainer!.appendChild(el);
    this.activeToasts.add(el);

    if (dur > 0) {
      setTimeout(() => this.dismissToast(el), dur);
    }
  }

  private dismissToast(el: HTMLElement): void {
    if (!this.activeToasts.has(el)) return;
    this.activeToasts.delete(el);
    el.classList.add('toast-out');
    setTimeout(() => {
      el.remove();
    }, 250);
  }

  clearToasts(): void {
    for (const el of Array.from(this.activeToasts)) {
      this.dismissToast(el);
    }
  }

  confirmDialog(title: string, text: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.currentModal) {
        this.currentModal.remove();
        this.currentModal = null;
      }

      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-title">${title}</div>
        <div class="modal-text">${text}</div>
        <div class="modal-actions">
          <button class="btn btn-secondary" data-action="cancel">取消</button>
          <button class="btn btn-primary" data-action="confirm">确认</button>
        </div>
      `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      this.currentModal = overlay;

      const cleanup = (result: boolean) => {
        overlay.remove();
        if (this.currentModal === overlay) {
          this.currentModal = null;
        }
        resolve(result);
      };

      modal.querySelector('[data-action="cancel"]')!.addEventListener('click', () => {
        cleanup(false);
      });
      modal.querySelector('[data-action="confirm"]')!.addEventListener('click', () => {
        cleanup(true);
      });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cleanup(false);
      });
    });
  }

  closeDialog(): void {
    if (this.currentModal) {
      this.currentModal.remove();
      this.currentModal = null;
    }
  }

  showLoading(message: string = '加载中...'): void {
    this.confirmDialog('系统提示', message).catch(() => {});
    if (this.currentModal) {
      const actions = this.currentModal.querySelector('.modal-actions');
      if (actions) {
        actions.innerHTML = `
          <div class="badge badge-info" style="font-size: 12px;">
            <span style="display:inline-block;animation:spin 0.8s linear infinite;">⟳</span>
            ${message}
          </div>
        `;
      }
    }
  }

  hideAllPanels(): void {
    for (const entry of this.panels.values()) {
      this.hidePanel(entry.id);
    }
  }

  destroy(): void {
    this.clearToasts();
    this.closeDialog();
    for (const entry of this.panels.values()) {
      entry.element.remove();
    }
    this.panels.clear();
    if (this.toastContainer) {
      this.toastContainer.remove();
      this.toastContainer = null;
    }
  }
}
