import { AlertOctagon, AlertTriangle } from 'lucide-react';
import type { RedFlagAlert } from '@/types/session';

interface RedFlagBannerProps {
  alerts: RedFlagAlert[];
}

export function RedFlagBanner({ alerts }: RedFlagBannerProps) {
  if (alerts.length === 0) return null;

  const isEmergency = alerts.some((a) => a.level === 'emergency');

  return (
    <div
      className="rounded-xl border p-3"
      style={{
        backgroundColor: isEmergency ? 'var(--danger-soft)' : 'var(--warning-soft)',
        borderColor: isEmergency ? 'var(--danger-border)' : 'var(--warning-border)',
      }}
      role="alert"
    >
      <div
        className="flex items-center gap-1.5 text-xs font-bold"
        style={{ color: isEmergency ? 'var(--danger)' : 'var(--warning)' }}
      >
        {isEmergency ? (
          <AlertOctagon className="h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0" />
        )}
        <span>{isEmergency ? '高危急症提醒 · 建议优先急诊就医' : '重点就医提示'}</span>
      </div>
      <div className="mt-2 space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="text-[11px] leading-relaxed">
            <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {alert.title}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>{alert.reason}</div>
            <div
              className="mt-0.5 font-medium"
              style={{ color: alert.level === 'emergency' ? 'var(--danger)' : 'var(--warning)' }}
            >
              建议：{alert.actionAdvice}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
