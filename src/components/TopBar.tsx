import { Info, Moon, RotateCcw, Sun, Trash2 } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';
import type { AnatomyBridge } from '@/types/bridge';

interface TopBarProps {
  bridge: AnatomyBridge | null;
}

export function TopBar({ bridge }: TopBarProps) {
  const theme = useSessionStore((s) => s.theme);
  const toggleTheme = useSessionStore((s) => s.toggleTheme);
  const resetSession = useSessionStore((s) => s.resetSession);
  const clearActiveRegion = useSessionStore((s) => s.clearActiveRegion);
  const resetLayers = useSessionStore((s) => s.resetLayers);
  const setAttributionOpen = useSessionStore((s) => s.setAttributionOpen);
  const pointCount = useSessionStore((s) => s.session.painPoints.length);

  const handleResetView = () => {
    clearActiveRegion();
    resetLayers();
    bridge?.restoreAllPeeled();
    bridge?.resetCamera();
  };

  return (
    <header
      className="flex h-13 shrink-0 items-center justify-between border-b px-4"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)',
          }}
        >
          3D
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
            人体不适定位表达助手
          </h1>
          <p className="hidden text-[11px] sm:block" style={{ color: 'var(--text-muted)' }}>
            指清肌肉 / 韧带 / 骨骼 / 脏器位置，帮医生和 AI 一下听懂你哪里疼
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleResetView}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:opacity-85"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-2)',
            color: 'var(--text-secondary)',
          }}
          title="恢复全身默认视角与图层"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">复位视图</span>
        </button>

        {pointCount > 0 && (
          <button
            type="button"
            onClick={() => {
              resetSession();
              bridge?.clearHighlights();
            }}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:opacity-85"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-2)',
              color: 'var(--danger)',
            }}
            title="清空当前标注与问卷"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">清空记录</span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:opacity-85"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-2)',
            color: 'var(--text-primary)',
          }}
          title="切换医疗清爽浅色 / 深色科技主题"
        >
          {theme === 'clinical-light' ? (
            <>
              <Moon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">深色科技</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">医疗浅色</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAttributionOpen(true)}
          className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:opacity-85"
          style={{
            borderColor: 'var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-2)',
            color: 'var(--text-muted)',
          }}
          title="免责声明与开源解剖数据署名"
        >
          <Info className="h-3.5 w-3.5" />
          <span className="hidden md:inline">说明与署名</span>
        </button>
      </div>
    </header>
  );
}
