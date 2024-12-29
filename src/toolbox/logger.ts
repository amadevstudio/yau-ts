import { Logger } from "tslog";

export type TLogger = Logger<unknown>;

export default function initializeLogger(): TLogger {
  return new Logger({ name: "frameworkLogger" });
}
