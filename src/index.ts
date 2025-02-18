export type {
  ControllerConstructedParams,
  FrameworkGenerics,
  LocalRoutes,
  Route,
  Routes,
  CustomMiddleware,
  MiddlewareConstructedParams,
  InitializeSystemConfig,
  NextF,
  TeleMessage,
} from './core/types';
export type { MessageStructure } from './controller/types';
export { type Dictionary } from './i18n/types';

export { setupI18n } from './i18n/setup';
export { TeleBot, TeleError, TeleErrors } from './core/types';

export {
  buildEntityNamesMap,
  buildRoutesList,
  buildRoutes,
} from './controller/defaultRoutes';

export { initializeBot } from './core/botSetup';
