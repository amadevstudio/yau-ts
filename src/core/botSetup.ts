import TelegramBot from 'node-telegram-bot-api';
import { TBotConfig, TLibParams, TRoute } from '@framework/core/types';
import curry from '@framework/toolbox/curry';
import { TeleBot } from '@framework/controller/types';
import { constructParams } from '@framework/core/methodParams';
import { TI18n } from "@framework/i18n/setup";

function processor(
  bot: TeleBot,
  routeName: string,
  routeParams: TRoute,
  i18n: TI18n,
  libParams: TLibParams
) {
  // TODO
  // 1. Validator
  // 2. Detect if command and clear storage; If message or command set resend flag

  routeParams.method.call(
    constructParams(
      bot,
      routeName,
      // routeParams,
      i18n,
      libParams
    )
  );
}

function commandsListValidator(commands: string[], command: string) {
  return commands.includes(command);
}

function initializeRoutes(bot: TeleBot, botConfig: TBotConfig, i18n: TI18n) {
  // TODO: std routes (e.g., goBack)

  // Initialize routes
  for (const [routeName, routeParams] of Object.entries(botConfig.routes)) {
    const handlerCurry = curry(processor)(bot, routeName, routeParams, i18n);

    // Command section
    if (routeParams.availableFrom.includes('command')) {
      const commandsListValidatorPartial = curry(commandsListValidator)(
        'commands' in routeParams ? routeParams.commands : [routeName]
      );

      bot.on('message', (message, metadata) => {
        // Validate, if config have the route
        if (commandsListValidatorPartial(message.text?.substring(1))) {
          handlerCurry({ message, metadata, isCommand: true });
        }
      });
    }

    // TODO: message, callback, actions sections
  }
}

export default function initializeBot(
  token: string,
  botConfig: TBotConfig,
  i18n: TI18n,
) {
  const bot: TeleBot = new TelegramBot(token, {
    polling: true,
    // @ts-ignore
    testEnvironment: botConfig.testTelegram,
  });

  initializeRoutes(bot, botConfig, i18n);

  return bot;
}
