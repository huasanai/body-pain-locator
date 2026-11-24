import { useCallback, useEffect, useState } from 'react';
import { AnatomyViewport } from '@/components/AnatomyViewport';
import { AttributionModal } from '@/components/AttributionModal';
import { DepthPickPopover } from '@/components/DepthPickPopover';
import { ExportModal } from '@/components/ExportModal';
import { HoverTooltip } from '@/components/HoverTooltip';
import { LeftRegionRail } from '@/components/LeftRegionRail';
import { RightSymptomPanel } from '@/components/RightSymptomPanel';
import { TopBar } from '@/components/TopBar';
import { useSessionStore } from '@/store/useSessionStore';
import type { AnatomyBridge } from '@/types/bridge';

export function App() {
  const [bridge, setBridge] = useState<AnatomyBridge | null>(null);
  const theme = useSessionStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleBridgeReady = useCallback((instance: AnatomyBridge | null) => {
    setBridge(instance);
  }, []);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <TopBar bridge={bridge} />

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <LeftRegionRail bridge={bridge} />
        <AnatomyViewport onBridgeReady={handleBridgeReady} />
        <RightSymptomPanel bridge={bridge} />
      </main>

      <HoverTooltip />
      <DepthPickPopover bridge={bridge} />
      <ExportModal bridge={bridge} />
      <AttributionModal />
    </div>
  );
}
