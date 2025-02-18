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
  TeleBot,
} from './core/types';
export type { MessageStructure } from './controller/types';
export { type Dictionary } from './i18n/types';

export { setupI18n } from './i18n/setup';

export {
  buildEntityNamesMap,
  buildRoutesList,
  buildRoutes,
} from './controller/defaultRoutes';

export { initializeBot } from './core/botSetup';
