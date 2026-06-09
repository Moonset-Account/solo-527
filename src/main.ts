import { GameApp } from './GameApp';
import { createLogger } from './utils/logger';

const logger = createLogger('main');

function boot(): void {
  try {
    const app = new GameApp({
      canvasId: 'game-canvas',
      uiRootId: 'ui-root',
    });

    (window as any).__gameApp = app;

    app.start();

    logger.info('Circuit Sandbox started successfully');
    logger.info(`Version: 0.1.0-beta | Mode: Education Demo`);
  } catch (err) {
    logger.error('Failed to boot game app:', err);

    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = `
        <div style="
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background: #0F172A; color: #f87171;
          font-family: 'JetBrains Mono', monospace;
          padding: 24px; text-align: center;
        ">
          <div style="max-width: 500px;">
            <h2 style="color: #fca5a5; margin-bottom: 16px;">启动失败</h2>
            <pre style="
              background: rgba(239,68,68,0.1);
              border: 1px solid rgba(239,68,68,0.3);
              border-radius: 8px; padding: 16px;
              text-align: left; font-size: 12px;
              overflow-x: auto;
            ">${err instanceof Error ? err.stack ?? err.message : String(err)}</pre>
          </div>
        </div>
      `;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
