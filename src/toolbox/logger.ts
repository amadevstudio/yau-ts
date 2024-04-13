import { Logger } from "tslog";

export type TLogger = Logger<any>;

export default function initializeLogger(): TLogger {
  return new Logger({ name: "frameworkLogger" });
}
