import { Logger } from 'tslog';
import { randomBytes } from 'crypto';

export function generateRandomId(length: number = 16): string {
  return randomBytes(length).toString('hex'); // Generates a random hex string
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
    this.logger.error(`[${this.randomId}]`, ...args);
  }

  debug(...args: unknown[]): void {
    this.logger.debug(`[${this.randomId}]`, ...args);
  }
}

export type FrameworkLogger = CustomLogger;

export default function initializeLogger(randomId?: number): FrameworkLogger {
  // TODO: generate uuid for each query
  // const randomId = generateRandomId();
  // const randomId = '';
  return new CustomLogger(randomId ?? "");
}
