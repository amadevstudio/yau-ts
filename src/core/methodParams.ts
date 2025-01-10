import {
  BotConfig,
  ConstructedParams,
  ConstructedServiceParams,
  LibParams,
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
import makeUserStateService, {
  type UserStateService,
} from '@framework/service/userStateService';
import { StorageRepository } from '@framework/repository/storage';
import { getUnitedData } from '@framework/service/stateDataService';
import { goBackProcessor } from '@framework/controller/controllers';
import makeGoBack from '@framework/components/goBack';
import { buildInlineMarkupButton } from '@framework/components/button';

// Dig message and callback
function separateMessageAndCallback(libParams: LibParams): {
  message: TeleMessage;
  callback: TeleCallback | undefined;
} {
  if ('message' in libParams && libParams.message !== undefined) {
    return { message: libParams.message, callback: undefined };
  }

  return {
    message: libParams.callback!.message!,
    callback: libParams.callback,
  };
}

export function getChatId(libParams: LibParams) {
  const { message } = separateMessageAndCallback(libParams);

  return message.chat.id;
}

// Mutual for service and common routes
function buildMutualParams({
  libParams,
  storage,
}: {
  libParams: LibParams;
  storage: StorageRepository;
}) {
  const { message, callback } = separateMessageAndCallback(libParams);

  const chatId = message.chat.id;

  const languageCode = (message.from?.language_code ||
    callback?.from.language_code)!;

  const services: { userStateService: UserStateService } = {
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

  const i18n = initializeI18n(botConfig.i18n, libParams.logger, languageCode);

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

    isStepForward: isStepForward,
    isStepBack: isStepBack,
    isCommand: libParams.isCommand ?? false,

    goBackAction: goBackProcessor,

    render: makeRender(
      bot,
      mutualParams.services.userStateService,
      mutualParams.chat.id
    ),
    renderToChat: makeRenderToChat(bot, mutualParams.services.userStateService),
    outerSender: makeOuterSender(bot, mutualParams.services.userStateService),

    components: {
      goBack: makeGoBack({
        defaultTextKey: botConfig?.defaultTextKeys?.goBack,
        i18n,
      }),

      buildButton: buildInlineMarkupButton<RouteNames, ActionNames>,
    },

    i18n: i18n,
  };
}
