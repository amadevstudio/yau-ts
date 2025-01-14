import {
  BotConfig,
  ConstructedParams,
  ConstructedServiceParams,
  LibParams,
  MutualConstructedParams,
} from '@framework/core/types';
import {
  TeleBot,
  TeleCallback,
  TeleMessage,
} from '@framework/controller/types';
import {
  makeRender,
  makeRenderToChat,
  makeOuterSender,
} from '@framework/controller/render';
import { initializeI18n } from '@framework/i18n/setup';
import { StorageRepository } from '@framework/repository/storage';
import { getUnitedData } from '@framework/service/stateDataService';
import { goBackProcessor } from '@framework/controller/controllers';
import makeGoBack from '@framework/components/goBack';
import { buildInlineMarkupButton } from '@framework/components/button';
import makeUserStateService from '@framework/service/userStateService';

// Dig message and callback
function separateMessageAndCallback(libParams: LibParams): {
  message: TeleMessage;
  callback: TeleCallback | undefined;
} {
  if (libParams.ctx.callbackQuery === undefined) {
    return { message: libParams.ctx.message!, callback: undefined };
  }

  return {
    message: libParams.ctx.callbackQuery.message!,
    callback: libParams.ctx.callbackQuery,
  };
}

// Mutual for service and common routes
function buildMutualParams({
  libParams,
  storage,
}: {
  libParams: LibParams;
  storage: StorageRepository;
}): MutualConstructedParams {
  const { message, callback } = separateMessageAndCallback(libParams);

  const chatId = libParams.ctx.chatId!;

  const languageCode = (message?.from?.language_code ||
    callback?.from.language_code)!;

  const services = {
    userStateService: makeUserStateService(storage, chatId),
  };

  return {
    chat: {
      id: chatId,
    },
    user: {
      languageCode: languageCode,
    },

    services,
  };
}

// Service params
export function constructServiceParams({
  bot,
  botConfig,
  libParams,
  storage,
}: {
  bot: TeleBot;
  botConfig: BotConfig;
  libParams: LibParams;
  storage: StorageRepository;
}): ConstructedServiceParams {
  return {
    // Service params
    bot,
    botConfig,
    libParams,
    storage,
    routes: botConfig.routes,

    ...buildMutualParams({ libParams, storage }),
  };
}

// Common params
export async function constructParams<
  RouteNames extends string,
  ActionNames extends string
>({
  bot,
  routeName,
  actionName,
  botConfig,
  libParams,
  storage,
  isStepBack = false,
}: {
  bot: TeleBot;
  routeName: RouteNames;
  // routeParams: TRoute,
  actionName?: ActionNames;
  botConfig: BotConfig;
  libParams: LibParams;
  storage: StorageRepository;
  isStepBack?: boolean;
}): Promise<ConstructedParams<RouteNames, ActionNames>> {
  const { message, callback } = separateMessageAndCallback(libParams);

  const messageData = (msg: TeleMessage | undefined) => {
    return (
      msg && {
        id: msg.message_id,
        text: msg.text,
        from: {
          id: msg.from?.id,
        },
      }
    );
  };

  const mutualParams = buildMutualParams({ libParams, storage });

  const currentState =
    await mutualParams.services.userStateService.getUserCurrentState();
  const isStepForward =
    !isStepBack && currentState !== null && routeName !== currentState;

  const languageCode = (message.from?.language_code ||
    callback?.from.language_code)!;

  const i18n = initializeI18n(
    botConfig.i18n,
    libParams.ctx.$frameworkLogger,
    languageCode
  );

  const isCommand = libParams.isCommand ?? false;

  return {
    ...mutualParams,

    message: messageData(message),
    callback: callback && {
      message: messageData(callback.message),
      id: callback?.id,
    },

    routeName,
    actionName,
    stateBeforeInteraction: currentState,

    unitedData: await getUnitedData(
      callback,
      mutualParams.services.userStateService,
      routeName,
      actionName
    ),

    isStepForward,
    isStepBack,
    isCommand,

    goBackAction: goBackProcessor,

    render: makeRender(
      bot,
      mutualParams.services.userStateService,
      mutualParams.chat.id,
      isCommand
    ),
    renderToChat: makeRenderToChat(bot, mutualParams.services.userStateService),
    outerSender: makeOuterSender(bot, mutualParams.services.userStateService),

    components: {
      goBack: makeGoBack({
        getDefaultText: botConfig?.defaultTextGetters?.goBack,
        i18n,
      }),

      buildButton: buildInlineMarkupButton<RouteNames, ActionNames>,
    },

    i18n: i18n,
  };
}
