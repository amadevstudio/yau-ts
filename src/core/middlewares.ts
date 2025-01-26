import {
  TeleBot,
  TeleContext,
  NextF,
  TeleContextBare,
} from '@framework/controller/types';
import { StorageRepository } from '@framework/repository/storage';
import makeUserStateService from '@framework/service/userStateService';
import initializeLogger from '@framework/toolbox/logger';
import { BotConfig, CustomMiddleware } from './types';
import { buildMiddlewareParams } from './methodParams';

// Inject Logger
// Dev state logger

export function setupServiceMiddlewares(
  bot: TeleBot,
  storage: StorageRepository,
  botConfig: BotConfig
) {
  async function injectLogger(
    ctx: TeleContext,
    next: NextF // аналог для: () => Promise<void>
  ): Promise<void> {
    ctx.$frameworkLogger = initializeLogger();

    await next();
  }

  bot.use(injectLogger as (ctx: TeleContextBare, next: NextF) => Promise<void>);

  async function logStates(ctx: TeleContext, next: NextF): Promise<void> {
    const chatId = ctx.chat?.id;

    const userStateService =
      chatId !== undefined ? makeUserStateService(storage, chatId) : undefined;

    if (userStateService) {
      ctx.$frameworkLogger.debug(
        'States before interaction:',
        await userStateService.getUserStates()
      );
    }

    await next();

    if (userStateService) {
      ctx.$frameworkLogger.debug(
        'States after interaction:',
        await userStateService.getUserStates()
      );
    }
  }

  if (botConfig.environment === 'development') {
    bot.use(logStates as (ctx: TeleContextBare, next: NextF) => Promise<void>);
  }
}

export function setupCustomMiddlewares(
  bot: TeleBot,
  customMiddlewares: CustomMiddleware[]
) {
  for (const middleware of customMiddlewares) {
    async function processMiddleware(
      ctx: TeleContext,
      next: NextF
    ): Promise<void> {
      middleware(buildMiddlewareParams(ctx), next);
    }

    bot.use(
      processMiddleware as (ctx: TeleContextBare, next: NextF) => Promise<void>
    );
  }
}
