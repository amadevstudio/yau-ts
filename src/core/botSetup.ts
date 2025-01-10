import TelegramBot from 'node-telegram-bot-api';
import {
  BotConfig,
  ConstructedServiceParams,
  LibParams,
  Route,
} from '@framework/core/types';
import { TeleBot, TeleCallback } from '@framework/controller/types';
import {
  constructParams,
  constructServiceParams,
} from '@framework/core/methodParams';
import initializeLogger from '@framework/toolbox/logger';
import initStorage, { StorageRepository } from '@framework/repository/storage';
import {
  correctEmptyStateInputState,
  goBackProcessor,
} from '@framework/controller/controllers';
import {
  initializeValidateAction,
  initializeValidateCallback,
  initializeValidateCommands,
  initializeValidateMessages,
  validateGoBack,
} from './validators';
import { makeUsersStateService } from '@framework/service/userStateService';

// Curry service controllers
function makeServiceProcessQuery(
  bot: TeleBot,
  botConfig: BotConfig,
  storage: StorageRepository
) {
  return async function (
    processor:
      | ((serviceParams: ConstructedServiceParams) => Promise<void>)
      | ((
          serviceParams: ConstructedServiceParams
        ) => Promise<boolean | undefined>),
    libParams: LibParams
  ) {
    const csp = constructServiceParams({
      bot,
      botConfig,
      libParams,
      storage,
    });
    await processor(csp);
  };
}

// Init service controllers
function serviceControllers(
  bot: TeleBot,
  serviceProcessQuery: ReturnType<typeof makeServiceProcessQuery>
) {
  // GoBack module
  bot.on('callback_query', (callback: TeleCallback) => {
    if (validateGoBack(callback))
      serviceProcessQuery(goBackProcessor, {
        callback,
        logger: initializeLogger(),
      });
  });

  // TODO: Catch all message when under maintenance and show maintenance message and return false
  return true;
}

// Curry controllers
function makeProcessQuery(
  bot: TeleBot,
  routeName: string,
  routeParams: Route,
  botConfig: BotConfig,
  storage: StorageRepository
) {
  const actions = Object.values(botConfig.routes).flatMap((route) =>
    route?.actions ? Object.keys(route?.actions) : []
  );

  return async function (libParams: LibParams) {
    const cp = await constructParams<
      keyof typeof botConfig.routes,
      (typeof actions)[number]
    >({
      bot,
      routeName,
      botConfig,
      libParams,
      storage,
    });

    if (botConfig.environment === 'development') {
      libParams.logger.debug(
        'States before interaction:',
        await cp.services.userStateService.getUserStates()
      );
    }

    // If step forward, delete state data
    if (cp.isStepForward && cp.routeName !== undefined) {
      await cp.services.userStateService.deleteUserStateData(cp.routeName);
    }

    if (cp.callback === undefined && cp.message !== undefined) {
      // Clear state on commands and set parent state as default route
      if (cp.isCommand) {
        await cp.services.userStateService.clearUserStorage();
        await cp.services.userStateService.addUserState(botConfig.defaultRoute);
      }
      // Set resend on message
      await cp.services.userStateService.setUserResendFlag();
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
        libParams.logger.debug('Changing state to', cp.routeName);
      }
    }

    if (botConfig.environment === 'development') {
      libParams.logger.debug(
        'States after interaction:',
        await cp.services.userStateService.getUserStates()
      );
    }
  };
}

function makeProcessAction(
  bot: TeleBot,
  routeName: string,
  routeParams: Route,
  actionName: string,
  botConfig: BotConfig,
  storage: StorageRepository
) {
  const actions = Object.values(botConfig.routes).flatMap((route) =>
    route?.actions ? Object.keys(route?.actions) : []
  );

  return async function (libParams: LibParams) {
    const cp = await constructParams<
      keyof typeof botConfig.routes,
      (typeof actions)[number]
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
async function initializeRoutes({
  bot,
  botConfig,
  storage,
}: {
  bot: TeleBot;
  botConfig: BotConfig;
  storage: StorageRepository;
}) {
  const serviceProcessQuery = makeServiceProcessQuery(bot, botConfig, storage);
  const shouldProcess = serviceControllers(bot, serviceProcessQuery);
  // Block processing on bot init
  if (!shouldProcess) {
    return;
  }

  type AvailableRoutes = keyof typeof botConfig.routes;

  const usersStateService = makeUsersStateService<AvailableRoutes>(storage);

  // Initialize routes
  for (const [routeName, routeParams] of Object.entries(botConfig.routes)) {
    // System routes
    if (routeParams === null) {
      continue;
    }

    const processQuery = makeProcessQuery(
      bot,
      routeName,
      routeParams,
      botConfig,
      storage
    );

    // Command section
    if (routeParams.availableFrom.includes('command')) {
      const validateCommands = initializeValidateCommands(
        routeParams.commands ?? [routeName]
      );

      bot.on('message', async (message, metadata) => {
        // Validate, if config have the route
        if (
          message.text !== undefined &&
          validateCommands(message.text.substring(1))
        ) {
          await processQuery({
            message,
            metadata,
            isCommand: true,
            logger: initializeLogger(),
          });
        }
      });
    }

    // Message section
    if (routeParams.availableFrom.includes('message')) {
      const validateMessage = initializeValidateMessages<AvailableRoutes>(
        routeParams.statesForInput ?? [routeName],
        usersStateService
      );

      bot.on('message', async (message, metadata) => {
        if (message !== undefined && (await validateMessage(message))) {
          // If status is 'empty' and previous waits for text, "goBack" to previously and process

          await serviceProcessQuery(correctEmptyStateInputState, {
            message,
            metadata,
            logger: initializeLogger(),
          });

          await processQuery({ message, metadata, logger: initializeLogger() });
        }
      });
    }

    // Callback section
    if (routeParams.availableFrom.includes('callback')) {
      const validateCallback = initializeValidateCallback(routeName);

      bot.on('callback_query', async (callback) => {
        if (validateCallback(callback)) {
          await processQuery({ callback, logger: initializeLogger() });
        }
      });
    }

    // Actions section
    if (routeParams.actions) {
      for (const actionName in routeParams.actions) {
        const processAction = makeProcessAction(
          bot,
          routeName,
          routeParams,
          actionName,
          botConfig,
          storage
        );
        const validateAction = initializeValidateAction(
          routeName,
          routeParams,
          actionName,
          usersStateService
        );

        bot.on('callback_query', async (callback) => {
          if (await validateAction(callback)) {
            await processAction({ callback, logger: initializeLogger() });
          }
        });
      }
    }
  }
}

// Framework entrypoint
export default async function initializeBot(
  token: string,
  storageUrl: string,
  botConfig: BotConfig
) {
  const augmentedBotConfig = {
    testTelegram: false,
    environment: 'development' as const,
    ...botConfig,
  };

  const bot: TeleBot = new TelegramBot(token, {
    polling: true,
    testEnvironment: augmentedBotConfig.testTelegram,
  });

  const storage = await initStorage(storageUrl);

  await initializeRoutes({ bot, botConfig: augmentedBotConfig, storage });

  return bot;
}
