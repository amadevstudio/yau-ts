export type { UserStateService } from './service/userStateService';
export type {
  ControllerConstructedParams,
  FrameworkGenerics,
  LocalRoutes,
  Route,
  Routes,
  CustomMiddleware,
  MiddlewareConstructedParams,
  BotConfig
} from './core/types';
export {
  buildEntityNamesMap,
  buildRoutesList,
  buildRoutes,
} from './controller/defaultRoutes';
export type { MessageStructure, NextF } from './controller/types';
export { type Dictionary, setupI18n } from './i18n/setup';

export { initializeBot } from './core/botSetup';
