export type {
  ControllerConstructedParams,
  FrameworkGenerics,
  LocalRoutes,
  Route,
  Routes,
  CustomMiddleware,
  MiddlewareConstructedParams,
  BotConfig,
} from './core/types';
export type { MessageStructure, NextF } from './controller/types';
export { type Dictionary } from './i18n/setup';

export { setupI18n } from './i18n/setup';

export {
  buildEntityNamesMap,
  buildRoutesList,
  buildRoutes,
} from './controller/defaultRoutes';

export { initializeBot } from './core/botSetup';
