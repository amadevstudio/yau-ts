import TelegramBot from 'node-telegram-bot-api';
import {BotConfig, LibParams, Route} from '@framework/core/types';
import {TeleBot} from '@framework/controller/types';
import {constructParams} from '@framework/core/methodParams';
import { InitializeI18n } from "@framework/i18n/setup";
import initializeLogger from "@framework/toolbox/logger";

const frameworkLogger = initializeLogger();

function process(
  bot: TeleBot,
  routeName: string,
  routeParams: Route,
  i18n: InitializeI18n | undefined) {
  return function (
    libParams: LibParams
  ) {
    // TODO
    // 1. Validator
    // 2. Detect if command and clear storage; If message or command set resend flag

    routeParams.method(
      constructParams(
        bot,
        frameworkLogger,
        routeName,
        // routeParams,
        i18n,
        libParams,
      )
    );
  }
}

function initializeValidateCommands(commands: string[]) {
  return function (command: string) {
    return commands.includes(command);
  }
}

function initializeRoutes(bot: TeleBot, botConfig: BotConfig) {
  // TODO: std routes (e.g., goBack)

  // Initialize routes
  for (const [routeName, routeParams] of Object.entries(botConfig.routes)) {
    const processQuery = process(bot, routeName, routeParams, botConfig.i18n);

    // Command section
    if (routeParams.availableFrom.includes('command')) {
      const validateCommands = initializeValidateCommands(
        'commands' in routeParams && routeParams.commands !== undefined ? routeParams.commands : [routeName]
      );

      bot.on('message', (message, metadata) => {
        // Validate, if config have the route
        if (message.text !== undefined && validateCommands(message.text.substring(1))) {
          processQuery({message, metadata, isCommand: true});
        }
      });
    }

    // TODO: message, callback, actions sections
  }
}

export default function initializeBot(
  token: string,
  botConfig: BotConfig,
) {
  const bot: TeleBot = new TelegramBot(token, {
    polling: true,
    // @ts-ignore (constructorOptions don't have property)
    testEnvironment: botConfig.testTelegram,
  });

  initializeRoutes(bot, botConfig);

  return bot;
}
