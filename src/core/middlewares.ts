import {
  TeleBot,
  TeleContext,
  NextF,
  TeleContextBare,
} from '@framework/controller/types';
import { StorageRepository } from '@framework/repository/storage';
import makeUserStateService from '@framework/service/userStateService';
import initializeLogger from '@framework/toolbox/logger';
import { BotConfig } from './types';

// Inject Logger
// Dev state logger

export function serviceMiddlewares(
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
