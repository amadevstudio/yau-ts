import { Logger, LoggerOptions } from 'tslog';
import { randomBytes } from 'crypto';

export type FrameworkLogger = Logger<unknown>;

export function generateRandomId(length: number = 16): string {
  return randomBytes(length).toString('hex'); // Generates a random hex string
}

class CustomLogger extends Logger<unknown> {
  randomId: string | undefined;

  constructor(options?: LoggerOptions<unknown>, randomUuid?: string) {
    super(options);
    this.randomId = randomUuid;
  }

  log(...args: unknown[]): void {
    super.log(`[${this.randomId}]`, ...args);
  }

  info(...args: unknown[]): void {
    super.info(`[${this.randomId}]`, ...args);
  }

  warn(...args: unknown[]): void {
    super.warn(`[${this.randomId}]`, ...args);
  }

  error(...args: unknown[]): void {
    super.error(`[${this.randomId}]`, ...args);
  }

  debug(...args: unknown[]): void {
    super.debug(`[${this.randomId}]`, ...args);
  }
}

export default function initializeLogger(): FrameworkLogger {
  // TODO: generate uuid for each query
  // const randomId = generateRandomId();
  const randomId = '';
  return new CustomLogger({ name: 'frameworkLogger' }, randomId);
}
