import { Logger } from 'tslog';
import { randomBytes } from 'crypto';

export function generateRandomId(length: number = 16): string {
  return `${Date.now()}_${randomBytes(length).toString('hex').slice(2, 9)}`;
}

class CustomLogger {
  private logger: Logger<unknown>;
  private randomId: string | number | undefined;

  constructor(randomId: string | number) {
    this.logger = new Logger<unknown>({
      // prettyLogTemplate:
      //   '{{yyyy}}-{{mm}}-{{dd}} {{hh}}:{{MM}}:{{ss}} [{{id}}] [{{logLevelName}}] ',
    });
    this.randomId = randomId;
  }

  info(...args: unknown[]): void {
    this.logger.info(`[${this.randomId}]`, ...args);
  }

  warn(...args: unknown[]): void {
    this.logger.warn(`[${this.randomId}]`, ...args);
  }

  error(...args: unknown[]): void {
    try {
      this.logger.error(`[${this.randomId}]`, ...args);
    } catch {
      this.logger.error(
        `[${this.randomId}]`,
        ...args.map((a) => (a instanceof Error ? new Error(String(a)) : a))
      );
    }
  }

  debug(...args: unknown[]): void {
    this.logger.debug(`[${this.randomId}]`, ...args);
  }
}

export type FrameworkLogger = CustomLogger;

export default function initializeLogger(): FrameworkLogger {
  const randomId = generateRandomId();
  return new CustomLogger(randomId ?? '');
}
