import { ShieldAlert, X } from 'lucide-react';
import { useSessionStore } from '@/store/useSessionStore';

export function AttributionModal() {
  const open = useSessionStore((s) => s.attributionOpen);
  const setOpen = useSessionStore((s) => s.setAttributionOpen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        <div
          className="flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            使用说明、免责声明与开源数据署名
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <div
            className="rounded-xl border p-3"
            style={{
              backgroundColor: 'var(--warning-soft)',
              borderColor: 'var(--warning-border)',
            }}
          >
            <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--warning)' }}>
              <ShieldAlert className="h-4 w-4" />
              医疗免责声明
            </div>
            <p className="mt-1">
              本工具旨在帮助非医学背景用户通过 3D 解剖模型把“具体哪里疼、处于哪一层组织、怎么疼”表达清楚，方便与医生或 AI 沟通。<strong>本工具不提供任何医疗诊断、处方或替代面诊的结论</strong>；如遇胸痛发闷、突发剧烈头痛、呼吸困难、肢体无力等急症信号，请立即就医或拨打急救电话。
            </p>
          </div>

          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              隐私保护
            </h3>
            <p className="mt-1">
              当前版本 100% 在你的浏览器本地离线运行，你填写的疼痛与位置记录仅保存在本机 <code>localStorage</code>，不会上传至任何服务器，可随时点击顶部「清空记录」彻底删除。
            </p>
          </div>

          <div>
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
              3D 人体解剖模型开源署名
            </h3>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>
                3D 解剖网格数据包来源于开源项目 <strong>Svitylo 3D Anatomy Data</strong>（<code>@authorod/svitylo-3d-anatomy-data</code>），整合自 <strong>Z-Anatomy</strong>（CC BY-SA 4.0）、<strong>BodyParts3D</strong>（© The Database Center for Life Science, CC BY 4.0）及 <strong>Human Reference Atlas</strong>（CC BY 4.0）等公开医学解剖资源。
              </li>
              <li>
                详细原始署名与许可证全文见项目根目录 <code>ATTRIBUTION.md</code>。
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
