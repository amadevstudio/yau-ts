import { Bot } from 'grammy';
import {
  actionFieldName,
  BotConfig,
  ConstructedServiceParams,
  LibParams,
  Route,
  typeFieldName,
} from '@framework/core/types';
import {
  FrameworkGenerics,
  TeleBot,
  TeleContext,
} from '@framework/controller/types';
import {
  constructParams,
  constructServiceParams,
} from '@framework/core/methodParams';
import initStorage, { StorageRepository } from '@framework/repository/storage';
import {
  correctEmptyStateInputState,
  goBackProcessor,
} from '@framework/controller/controllers';
import {
  initializeValidateAction,
  initializeValidateMessages,
  validateGoBack,
} from './validators';
import { makeUsersStateService } from '@framework/service/userStateService';
import {
  catchMiddlewaresError,
  setupCustomMiddlewares,
  setupServiceMiddlewares,
} from './middlewares';
import { goBackType } from '@framework/components/goBack';
import { escapeSpecialCharacters } from '@framework/toolbox/regex';

// Curry service controllers
function makeServiceProcessQuery<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>(
  bot: TeleBot,
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>,
  storage: StorageRepository
) {
  return async function (
    processor:
      | ((
          serviceParams: ConstructedServiceParams<
            AvailableRoutes,
            AvailableActions,
            AvailableLanguages
          >
        ) => Promise<void>)
      | ((
          serviceParams: ConstructedServiceParams<
            AvailableRoutes,
            AvailableActions,
            AvailableLanguages
          >
        ) => Promise<boolean | undefined>),
    libParams: LibParams
  ) {
    const csp = constructServiceParams<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >({
      bot,
      botConfig,
      libParams,
      storage,
    });
    await processor(csp);
  };
}

function operable() {
  // TODO: Catch all message when under maintenance and show maintenance message and return false
  return true;
}

type serviceProcessQuery<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
> = ReturnType<
  typeof makeServiceProcessQuery<
    AvailableRoutes,
    AvailableActions,
    AvailableLanguages
  >
>;

// Init service controllers
function serviceControllers<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>(
  bot: TeleBot,
  serviceProcessQuery: serviceProcessQuery<
    AvailableRoutes,
    AvailableActions,
    AvailableLanguages
  >
) {
  // GoBack module
  bot.callbackQuery(
    // "$tp":"$back" hits {"$tp":"$back",...}
    new RegExp(
      `"${escapeSpecialCharacters(typeFieldName)}":"${escapeSpecialCharacters(
        goBackType
      )}"`
    ),
    async (ctx) => {
      if (validateGoBack(ctx.callbackQuery))
        serviceProcessQuery(goBackProcessor, {
          ctx: ctx as TeleContext,
        });
      await ctx.answerCallbackQuery();
    }
  );
}

// Curry controllers
function makeProcessQuery<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>(
  bot: TeleBot,
  routeName: AvailableRoutes,
  routeParams: Route<AvailableRoutes, AvailableActions, AvailableLanguages>,
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>,
  storage: StorageRepository
) {
  return async function (libParams: LibParams) {
    const cp = await constructParams<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >({
      bot,
      routeName,
      botConfig,
      libParams,
      storage,
    });

    // If step forward, delete state data
    // !!! STATE MODIFICATION
    if (cp.isStepForward && cp.routeName !== undefined) {
      await cp.services.userStateService.deleteUserStateData(cp.routeName);
    }

    // !!! STATE MODIFICATION
    if (cp.callback === undefined && cp.message !== undefined) {
      // Clear state on commands and set parent state as default route
      if (cp.isCommand) {
        console.log('CLEARING STORAGE`');
        await cp.services.userStateService.clearUserStorage();
        // But if start, ignore (can't go back from start)
        if (cp.routeName !== 'start') {
          await cp.services.userStateService.addUserState(
            botConfig.defaultRoute
          );
        }
      }
    }

    // ---
    // Inner middlewares

    // TODO: ignore channels?

    // Validators
    if (routeParams.validator !== undefined && !routeParams.validator(cp)) {
      return;
    }

    // /Inner middlewares
    /// ---

    // Run the controller
    const changeState = await routeParams.method(cp);

    // Update state
    if (changeState !== false) {
      await cp.services.userStateService.addUserState(cp.routeName);
      if (botConfig.environment === 'development') {
        libParams.ctx.$frameworkLogger.debug('Changing state to', cp.routeName);
      }
    }
  };
}

function makeProcessAction<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>(
  bot: TeleBot,
  routeName: AvailableRoutes,
  routeParams: Route<AvailableRoutes, AvailableActions, AvailableLanguages>,
  actionName: AvailableActions,
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>,
  storage: StorageRepository
) {
  return async function (libParams: LibParams) {
    const cp = await constructParams<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >({
      bot,
      routeName,
      actionName,
      botConfig,
      libParams,
      storage,
    });

    routeParams.actions![actionName].method(cp);
  };
}

// Register all routes
async function initializeRoutes<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>({
  bot,
  botConfig,
  storage,
}: {
  bot: TeleBot;
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>;
  storage: StorageRepository;
}) {
  const shouldProcess = operable();
  // Block processing on bot init
  if (!shouldProcess) {
    return;
  }

  // Service middlewares
  setupServiceMiddlewares(bot, storage, botConfig);
  // Custom middlewares
  setupCustomMiddlewares({
    bot,
    customMiddlewares: botConfig.middlewares ?? [],
    storage,
  });
  // Catch middleware errors
  catchMiddlewaresError(bot);

  const serviceProcessQuery = makeServiceProcessQuery<
    AvailableRoutes,
    AvailableActions,
    AvailableLanguages
  >(bot, botConfig, storage);
  serviceControllers(bot, serviceProcessQuery);

  const usersStateService = makeUsersStateService<AvailableRoutes>(storage);

  // Initialize routes
  for (const [routeName, routeParams] of Object.entries(botConfig.routes) as [
    AvailableRoutes,
    Route<AvailableRoutes, AvailableActions, AvailableLanguages>
  ][]) {
    // System routes
    if (routeParams === null) {
      continue;
    }

    const processQuery = makeProcessQuery<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >(bot, routeName, routeParams, botConfig, storage);

    // Command section
    if (routeParams.availableFrom.includes('command')) {
      const commands = routeParams.commands ?? [routeName];

      commands.forEach((command) => {
        bot.command(command, async (ctx) => {
          await processQuery({
            ctx,
            isCommand: true,
          } as LibParams);
        });
      });
    }

    // Message section
    if (routeParams.availableFrom.includes('message')) {
      const validateMessage = initializeValidateMessages<AvailableRoutes>(
        routeParams.statesForInput ?? [routeName],
        usersStateService
      );

      bot.on(':text', async (ctx) => {
        if (ctx.message !== undefined && (await validateMessage(ctx.message))) {
          // If status is 'empty' and previous waits for text, "goBack" to previously and process
          await serviceProcessQuery(correctEmptyStateInputState, {
            ctx,
            isMessage: true,
          } as LibParams);

          await processQuery({ ctx, isMessage: true } as LibParams);
        }
      });
    }

    // Callback section (state changing)
    if (routeParams.availableFrom.includes('callback')) {
      // Validate "$tp":"$state_name"
      bot.callbackQuery(
        new RegExp(
          `"${escapeSpecialCharacters(
            typeFieldName
          )}":"${escapeSpecialCharacters(routeName)}"`
        ),
        async (ctx) => {
          await processQuery({ ctx, isCallback: true } as LibParams);
          await ctx.answerCallbackQuery();
        }
      );
    }

    // Actions section (in-state actions)
    if (routeParams.actions) {
      for (const actionName in routeParams.actions) {
        const processAction = makeProcessAction<
          AvailableRoutes,
          AvailableActions,
          AvailableLanguages
        >(bot, routeName, routeParams, actionName, botConfig, storage);
        const validateAction = initializeValidateAction(
          routeName,
          routeParams,
          actionName,
          usersStateService
        );

        bot.callbackQuery(
          // Validate "$act":"$action_name"
          new RegExp(
            `"${escapeSpecialCharacters(
              actionFieldName
            )}":"${escapeSpecialCharacters(actionName)}"`
          ),
          async (ctx) => {
            if (await validateAction(ctx.callbackQuery)) {
              await processAction({
                ctx,
                isCallback: true,
                isAction: true,
              } as LibParams);
            }
            await ctx.answerCallbackQuery();
          }
        );
      }
    }
  }
}

// Framework entrypoint
export default async function initializeBot<G extends FrameworkGenerics>(
  token: string,
  storageUrl: string,
  botConfig: BotConfig<G>
) {
  const augmentedBotConfig = {
    testTelegram: false,
    environment: 'development' as const,
    ...botConfig,
  };

  // TODO: implement Webhooks mode: https://grammy.dev/guide/deployment-types with bun adapter

  const bot: TeleBot = new Bot(token, {
    client: {
      ...(augmentedBotConfig.testTelegram ? { environment: 'test' } : {}),
    },
  });

  const storage = await initStorage(storageUrl);

  await initializeRoutes({ bot, botConfig: augmentedBotConfig, storage });

  return bot;
}
