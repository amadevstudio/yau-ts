import {
  BotConfig,
  ControllerConstructedParams,
  ConstructedServiceParams,
  LibParams,
  MutualControllerConstructedParams,
  MiddlewareConstructedParams,
} from '@framework/core/types';
import {
  TeleBot,
  TeleCallback,
  TeleContext,
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
function buildMutualParams<AvailableRoutes extends string>({
  libParams,
  storage,
}: {
  libParams: LibParams;
  storage: StorageRepository;
}): MutualControllerConstructedParams<AvailableRoutes> {
  const { message, callback } = separateMessageAndCallback(libParams);

  const chatId = libParams.ctx.chatId!;

  const languageCode = (message?.from?.language_code ||
    callback?.from.language_code)!;

  const services = {
    userStateService: makeUserStateService<AvailableRoutes>(storage, chatId),
  };

  const isCommand = libParams.isCommand ?? false;
  const isMessage = libParams.isMessage ?? false;
  const isCallback = libParams.isCallback ?? false;
  const isAction = libParams.isAction ?? false;

  return {
    chat: {
      id: chatId,
    },
    user: {
      languageCode: languageCode,
    },

    isCommand,
    isCallback,
    isAction,
    isMessage,

    services,
  };
}

// Service params
export function constructServiceParams<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>({
  bot,
  botConfig,
  libParams,
  storage,
}: {
  bot: TeleBot;
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>;
  libParams: LibParams;
  storage: StorageRepository;
}): ConstructedServiceParams<
  AvailableRoutes,
  AvailableActions,
  AvailableLanguages
> {
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
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
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
  routeName: AvailableRoutes;
  // routeParams: TRoute,
  actionName?: AvailableActions;
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>;
  libParams: LibParams;
  storage: StorageRepository;
  isStepBack?: boolean;
}): Promise<
  ControllerConstructedParams<
    AvailableRoutes,
    AvailableActions,
    AvailableLanguages
  >
> {
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

  const mutualParams = buildMutualParams<AvailableRoutes>({
    libParams,
    storage,
  });

  const currentState =
    await mutualParams.services.userStateService.getUserCurrentState();
  const isStepForward =
    !isStepBack && currentState !== null && routeName !== currentState;

  const languageCode = (message.from?.language_code ||
    callback?.from.language_code)! as AvailableLanguages;

  const i18n = initializeI18n<AvailableLanguages>(
    botConfig.i18n,
    libParams.ctx.$frameworkLogger,
    languageCode
  );

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

    goBackAction: goBackProcessor,

    render: makeRender<AvailableRoutes, AvailableActions, AvailableLanguages>({
      bot,
      routeName,
      currentState,
      userStateService: mutualParams.services.userStateService,
      chatId: mutualParams.chat.id,
      isCommand: mutualParams.isCommand,
      isMessage: mutualParams.isMessage,
      routes: botConfig.routes,
    }),
    renderToChat: makeRenderToChat<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >({
      bot,
      routeName,
      storage,
      routes: botConfig.routes,
    }),
    outerSender: makeOuterSender(bot, mutualParams.services.userStateService),

    components: {
      goBack: makeGoBack({
        getDefaultText: botConfig?.defaultTextGetters?.goBack,
        i18n,
      }),

      buildButton: buildInlineMarkupButton<AvailableRoutes, AvailableActions>,
    },

    i18n: i18n,
  };
}

export function buildMiddlewareParams<AvailableRoutes extends string>({
  ctx,
  storage,
}: {
  ctx: TeleContext;
  storage: StorageRepository;
}): MiddlewareConstructedParams<AvailableRoutes> {
  const chatId = ctx.chat?.id;
  return {
    chat: {
      id: chatId,
    },
    user: {
      languageCode: ctx.message?.from.language_code,
    },
    services: {
      userStateService: chatId
        ? makeUserStateService(storage, chatId)
        : undefined,
    },
  };
}
