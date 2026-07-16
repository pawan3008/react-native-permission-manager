import type { IPermissionDataSource } from '../../src/data/datasources/IPermissionDataSource';

/**
 * In-memory fake native module used by unit tests.
 */
export function createFakeDataSource(
  initial: Record<string, string> = {},
): IPermissionDataSource & {
  store: Record<string, string>;
} {
  const store: Record<string, string> = { ...initial };

  return {
    store,
    async check(key: string) {
      const members = key.split(',');
      if (members.length === 1) {
        return store[key] ?? 'denied';
      }
      const order = ['unavailable', 'blocked', 'denied', 'not_determined', 'limited', 'granted'];
      return members
        .map(m => store[m] ?? 'denied')
        .sort((a, b) => order.indexOf(a) - order.indexOf(b))[0]!;
    },
    async request(key: string) {
      const members = key.split(',');
      for (const m of members) {
        store[m] = 'granted';
      }
      return 'granted';
    },
    async requestMultiple(keys: string[]) {
      const result: Record<string, string> = {};
      for (const key of keys) {
        const status = await this.request(key);
        result[key] = status;
        for (const m of key.split(',')) {
          result[m] = store[m] ?? status;
        }
      }
      return result;
    },
    async shouldShowRationale(key: string) {
      return (store[key] ?? 'denied') === 'denied';
    },
    async openAppSettings() {
      // no-op in tests
    },
  };
}
