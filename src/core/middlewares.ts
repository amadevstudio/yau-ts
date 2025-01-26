import {
  TeleBot,
  TeleContext,
  NextF,
  TeleContextBare,
  LibraryHttpError,
} from '@framework/controller/types';
import { StorageRepository } from '@framework/repository/storage';
import makeUserStateService from '@framework/service/userStateService';
import initializeLogger from '@framework/toolbox/logger';
import { BotConfig, CustomMiddleware } from './types';
import { buildMiddlewareParams } from './methodParams';
import { LibraryError } from '../controller/types';

export function setupServiceMiddlewares(
  bot: TeleBot,
  storage: StorageRepository,
  botConfig: BotConfig
) {
  async function injectLogger(ctx: TeleContext, next: NextF): Promise<void> {
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
      try {
        await middleware(buildMiddlewareParams(ctx), next);
      } catch (err) {
        ctx.$frameworkLogger.error(
          `Error in custom middleware: ${middleware}:`,
          err
        );
        throw err; // Rethrow to propagate to the global error handler
      }
    }

    bot.use(
      processMiddleware as (ctx: TeleContextBare, next: NextF) => Promise<void>
    );
  }
}

export function catchMiddlewaresError(bot: TeleBot) {
  bot.catch((err) => {
    const ctx = err.ctx as TeleContext;
    ctx.$frameworkLogger.error(
      `Error while handling update ${ctx.update.update_id}:`
    );
    const e = err.error;
    if (e instanceof LibraryError) {
      ctx.$frameworkLogger.error('Error in request:', e.description);
    } else if (e instanceof LibraryHttpError) {
      ctx.$frameworkLogger.error('Could not contact Telegram:', e);
    } else {
      ctx.$frameworkLogger.error('Unknown error:', e);
    }
  });
}
