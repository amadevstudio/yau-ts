import {
  TeleBot,
  TeleContext,
  NextF,
  TeleContextBare,
  TeleHttpError,
  BotConfig,
} from './types';
import { StorageRepository } from 'repository/storageTypes';
import initializeLogger from 'toolbox/logger';
import { CustomMiddleware } from './types';
import { buildMiddlewareParams } from './methodParams';
import { TeleError } from './types';

export function setupServiceMiddlewares<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>(
  bot: TeleBot,
  storage: StorageRepository,
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>
) {
  const makeMiddlewareParams = (ctx: TeleContext) =>
    buildMiddlewareParams({ ctx, storage });

  // Inject logger to the context
  async function injectLogger(ctx: TeleContext, next: NextF): Promise<void> {
    ctx.$frameworkLogger = initializeLogger();
    await next();
  }
  bot.use(injectLogger as (ctx: TeleContextBare, next: NextF) => Promise<void>);

  // Log states in development
  async function logStates(ctx: TeleContext, next: NextF): Promise<void> {
    const userStateService =
      makeMiddlewareParams(ctx).services.userStateService;

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

export function setupCustomMiddlewares<AvailableRoutes extends string>({
  bot,
  customMiddlewares,
  storage,
}: {
  bot: TeleBot;
  customMiddlewares: CustomMiddleware<AvailableRoutes>[];
  storage: StorageRepository;
}) {
  for (const middleware of customMiddlewares) {
    async function processMiddleware(
      ctx: TeleContext,
      next: NextF
    ): Promise<void> {
      try {
        await middleware(buildMiddlewareParams({ ctx, storage }), next);
      } catch (err) {
        ctx.$frameworkLogger.error(
          `Error in or through custom middleware: ${middleware.name}:`,
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
    if (e instanceof TeleError) {
      ctx.$frameworkLogger.error('Error in request:', e.description);
    } else if (e instanceof TeleHttpError) {
      ctx.$frameworkLogger.error('Could not contact Telegram:', e);
    } else {
      ctx.$frameworkLogger.error('Unknown error:', e);
    }
  });
}
