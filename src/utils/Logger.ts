type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const PREFIX = '[PermissionManager]';

let enabled = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

/**
 * Tiny logger used throughout the library. Disabled in production by default.
 */
export const Logger = {
  setEnabled(value: boolean): void {
    enabled = value;
  },

  debug(message: string, ...args: unknown[]): void {
    log('debug', message, args);
  },

  info(message: string, ...args: unknown[]): void {
    log('info', message, args);
  },

  warn(message: string, ...args: unknown[]): void {
    log('warn', message, args);
  },

  error(message: string, ...args: unknown[]): void {
    log('error', message, args);
  },
};

function log(level: LogLevel, message: string, args: unknown[]): void {
  if (!enabled && level !== 'error') {
    return;
  }
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`${PREFIX} ${message}`, ...args);
}
