import type { HospitalLocatorAdapter } from '@/types/adapters';
import type { NearbyHospital } from '@/types/session';

/**
 * 阶段 4 预留占位适配器：保持接口完备，阶段 1–3 不引入任何地图 SDK 体积
 */
export class NoopHospitalLocatorAdapter implements HospitalLocatorAdapter {
  readonly enabled = false;

  async searchNearby(): Promise<NearbyHospital[]> {
    return [];
  }
}

export const defaultHospitalLocator = new NoopHospitalLocatorAdapter();
