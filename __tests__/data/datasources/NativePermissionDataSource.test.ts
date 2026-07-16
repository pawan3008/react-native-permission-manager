import { NativePermissionDataSource } from '../../../src/data/datasources/NativePermissionDataSource';
import type { Spec } from '../../../src/native/NativePermissionManager';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => {
    resolve = res;
  });
  return { promise, resolve };
}

function createSpyModule(): {
  module: Spec;
  checkCalls: number;
  requestCalls: number;
  requestMultipleCalls: number;
} {
  const counts = { checkCalls: 0, requestCalls: 0, requestMultipleCalls: 0 };
  const module: Spec = {
    check: (_permission: string) => {
      counts.checkCalls += 1;
      return Promise.resolve('granted');
    },
    request: (_permission: string) => {
      counts.requestCalls += 1;
      return Promise.resolve('granted');
    },
    requestMultiple: (_permissions: string[]) => {
      counts.requestMultipleCalls += 1;
      return Promise.resolve({});
    },
    shouldShowRequestPermissionRationale: (_permission: string) => Promise.resolve(false),
    openSettings: () => Promise.resolve(),
  } as unknown as Spec;
  return {
    module,
    get checkCalls() {
      return counts.checkCalls;
    },
    get requestCalls() {
      return counts.requestCalls;
    },
    get requestMultipleCalls() {
      return counts.requestMultipleCalls;
    },
  };
}

describe('NativePermissionDataSource — concurrent call coalescing', () => {
  it('coalesces concurrent request() calls for the same permission into one native call', async () => {
    const pending = deferred<string>();
    let requestCalls = 0;
    const module: Spec = {
      check: () => Promise.resolve('granted'),
      request: () => {
        requestCalls += 1;
        return pending.promise;
      },
      requestMultiple: () => Promise.resolve({}),
      shouldShowRequestPermissionRationale: () => Promise.resolve(false),
      openSettings: () => Promise.resolve(),
    } as unknown as Spec;
    const ds = new NativePermissionDataSource(module);

    const first = ds.request('android.permission.CAMERA');
    const second = ds.request('android.permission.CAMERA');

    expect(requestCalls).toBe(1);
    pending.resolve('granted');

    await expect(first).resolves.toBe('granted');
    await expect(second).resolves.toBe('granted');
    expect(first).toBe(second);
  });

  it('allows a new native call once the in-flight request settles', async () => {
    const spy = createSpyModule();
    const ds = new NativePermissionDataSource(spy.module);

    await ds.request('android.permission.CAMERA');
    await ds.request('android.permission.CAMERA');

    expect(spy.requestCalls).toBe(2);
  });

  it('does not coalesce concurrent requests for different permissions', async () => {
    const spy = createSpyModule();
    const ds = new NativePermissionDataSource(spy.module);

    await Promise.all([
      ds.request('android.permission.CAMERA'),
      ds.request('android.permission.RECORD_AUDIO'),
    ]);

    expect(spy.requestCalls).toBe(2);
  });

  it('coalesces concurrent requestMultiple() calls for the same key set regardless of order', async () => {
    const pending = deferred<Record<string, string>>();
    let batchCalls = 0;
    const module: Spec = {
      check: () => Promise.resolve('granted'),
      request: () => Promise.resolve('granted'),
      requestMultiple: () => {
        batchCalls += 1;
        return pending.promise;
      },
      shouldShowRequestPermissionRationale: () => Promise.resolve(false),
      openSettings: () => Promise.resolve(),
    } as unknown as Spec;
    const ds = new NativePermissionDataSource(module);

    const first = ds.requestMultiple([
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
    ]);
    const second = ds.requestMultiple([
      'android.permission.RECORD_AUDIO',
      'android.permission.CAMERA',
    ]);

    expect(batchCalls).toBe(1);
    pending.resolve({
      'android.permission.CAMERA': 'granted',
      'android.permission.RECORD_AUDIO': 'granted',
    });

    await expect(first).resolves.toEqual(await second);
  });

  it('rejects all coalesced callers when the underlying native call fails', async () => {
    const module: Spec = {
      check: () => Promise.resolve('granted'),
      request: () => Promise.reject(new Error('native failure')),
      requestMultiple: () => Promise.resolve({}),
      shouldShowRequestPermissionRationale: () => Promise.resolve(false),
      openSettings: () => Promise.resolve(),
    } as unknown as Spec;
    const ds = new NativePermissionDataSource(module);

    const first = ds.request('android.permission.CAMERA');
    const second = ds.request('android.permission.CAMERA');

    await expect(first).rejects.toThrow('native failure');
    await expect(second).rejects.toThrow('native failure');
  });
});
