import { Logger } from '../src/utils/Logger';

/**
 * Global Jest setup executed before every test file.
 */
Logger.setEnabled(false);

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 34, select: jest.fn(obj => obj.android) },
  Alert: { alert: jest.fn() },
  AppState: {
    currentState: 'active',
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  },
  NativeModules: {},
  TurboModuleRegistry: {
    get: jest.fn(() => null),
  },
  ActivityIndicator: 'ActivityIndicator',
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (styles: unknown) => styles },
}));
