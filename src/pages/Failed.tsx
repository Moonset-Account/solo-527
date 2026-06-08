import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, RotateCcw, ArrowLeft, ShieldAlert } from 'lucide-react';
import { useGameStore } from '@/stores/gameStore';

export default function Failed() {
  const navigate = useNavigate();
  const { levelId } = useParams<{ levelId: string }>();
  const { failureReason, errors } = useGameStore();

  const criticalErrors = errors.filter((e) => e.severity === 'critical');
  const hasSafetyIssue = criticalErrors.length > 0;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4"
      style={{
        background: 'linear-gradient(180deg, #0A2E36 0%, #1A0A0A 50%, #2A1010 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in-up">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4"
            style={{
              background: 'rgba(255, 68, 68, 0.15)',
              border: '2px solid var(--accent-red)',
              boxShadow: '0 0 30px rgba(255, 68, 68, 0.3)',
            }}
          >
            <AlertTriangle size={40} style={{ color: 'var(--accent-red)' }} />
          </div>
          <h1
            className="font-display text-3xl md:text-4xl tracking-wider mb-2"
            style={{ color: 'var(--accent-red)' }}
          >
            EXPERIMENT FAILED
          </h1>
          <p className="font-body text-lg" style={{ color: 'var(--text-secondary)' }}>
            实验失败
          </p>
        </div>

        <div
          className="card-base p-6 mb-4 animate-fade-in-up"
          style={{
            borderColor: 'var(--accent-red)',
            animationDelay: '200ms',
            animationFillMode: 'both',
          }}
        >
          <h3 className="font-body font-bold mb-3" style={{ color: 'var(--accent-red)' }}>
            失败原因
          </h3>
          <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
            {failureReason || '实验过程中出现了错误操作，导致实验无法继续。'}
          </p>
        </div>

        <div
          className="card-base p-6 mb-4 animate-fade-in-up"
          style={{
            animationDelay: '400ms',
            animationFillMode: 'both',
          }}
        >
          <h3 className="font-body font-bold mb-3" style={{ color: 'var(--accent-amber)' }}>
            详细说明
          </h3>
          <ul className="space-y-2">
            {errors.length > 0 ? (
              errors.map((err, i) => (
                <li key={err.id} className="flex items-start gap-2">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{
                      background:
                        err.severity === 'critical'
                          ? 'var(--accent-red)'
                          : err.severity === 'error'
                            ? 'var(--accent-amber)'
                            : 'var(--accent-blue)',
                    }}
                  />
                  <p className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {err.message}
                  </p>
                </li>
              ))
            ) : (
              <li className="font-body text-sm" style={{ color: 'var(--text-secondary)' }}>
                请按照实验步骤仔细操作，注意安全提示。
              </li>
            )}
          </ul>
        </div>

        <div
          className="rounded-xl p-4 mb-8 animate-fade-in-up"
          style={{
            background: hasSafetyIssue ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 184, 0, 0.1)',
            border: hasSafetyIssue ? '1px solid var(--accent-red)' : '1px solid var(--accent-amber)',
            animationDelay: '600ms',
            animationFillMode: 'both',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert
              size={18}
              style={{ color: hasSafetyIssue ? 'var(--accent-red)' : 'var(--accent-amber)' }}
            />
            <span
              className="font-body font-bold text-sm"
              style={{ color: hasSafetyIssue ? 'var(--accent-red)' : 'var(--accent-amber)' }}
            >
              {hasSafetyIssue ? '严重安全警告' : '安全提示'}
            </span>
          </div>
          <p className="font-body text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {hasSafetyIssue
              ? criticalErrors.map((e) => e.message).join(' ')
              : '实验操作需严格遵守安全规范，佩戴防护装备，在通风良好的环境中操作。'}
          </p>
          <div
            className="mt-3 pt-3 font-body text-xs text-center"
            style={{ borderTop: '1px solid var(--border-color)', color: 'var(--accent-red)' }}
          >
            ⚠️ 此为虚拟模拟，切勿在现实中模仿危险操作
          </div>
        </div>

        <div
          className="flex flex-col gap-3 animate-fade-in-up"
          style={{ animationDelay: '800ms', animationFillMode: 'both' }}
        >
          <button
            className="btn-danger flex items-center justify-center gap-2 w-full"
            onClick={() => navigate(`/game/${levelId}`)}
          >
            <RotateCcw size={18} />
            重试
          </button>
          <button
            className="btn-primary flex items-center justify-center gap-2 w-full"
            onClick={() => navigate('/levels')}
          >
            <ArrowLeft size={18} />
            返回关卡选择
          </button>
        </div>
      </div>
    </div>
  );
}
