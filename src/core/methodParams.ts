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
  outerSender,
} from '@framework/controller/render';
import { initializeI18n, InitializeI18n } from '@framework/i18n/setup';
import { FrameworkLogger } from '@framework/toolbox/logger';
import makeUserStateService, {
  type UserStateService,
} from '@framework/service/userStateService';
import { StorageRepository } from '@framework/repository/storage';
import { getUnitedData } from '@framework/service/stateDataService';
import { goBackProcessor } from '@framework/controller/controllers';

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
  frameworkLogger,
  botConfig,
  libParams,
  storage,
}: {
  bot: TeleBot;
  frameworkLogger: FrameworkLogger;
  botConfig: BotConfig;
  libParams: LibParams;
  storage: StorageRepository;
}): ConstructedServiceParams {
  return {
    // Service params
    bot,
    frameworkLogger,
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
  frameworkLogger,
  routeName,
  actionName,
  botConfig,
  libParams,
  storage,
  isStepBack = false,
}: {
  bot: TeleBot;
  frameworkLogger: FrameworkLogger;
  routeName: RouteNames;
  // routeParams: TRoute,
  actionName?: ActionNames;
  botConfig: BotConfig;
  libParams: LibParams;
  storage: StorageRepository;
  isStepBack?: boolean;
}): Promise<ConstructedParams> {
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

  const i18n: InitializeI18n | undefined = botConfig.i18n;

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

    unitedData: getUnitedData(
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
    outerSender: outerSender(bot, mutualParams.services.userStateService),

    i18n: initializeI18n(i18n, frameworkLogger, languageCode),
  };
}
