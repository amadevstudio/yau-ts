import {
  BotConfig,
  ControllerConstructedParams,
  ConstructedServiceParams,
  LibParams,
  MutualControllerConstructedParams,
  MiddlewareConstructedParams,
  FrameworkGenerics,
} from 'core/types';
import {
  TeleBot,
  TeleCallback,
  TeleContext,
  TeleMessage
} from './types';
import {
  makeRender,
  makeRenderToChat,
  makeOuterSender,
} from 'controller/render';
import { initializeI18n } from 'i18n/setup';
import { StorageRepository } from 'repository/storageTypes';
import { getUnitedData } from 'service/stateDataService';
import { goBackProcessor } from 'controller/controllers';
import makeGoBack from 'components/goBack';
import { buildInlineMarkupButton } from 'components/button';
import makeUserStateService from 'service/userStateService';

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
function buildMutualParams<G extends FrameworkGenerics = FrameworkGenerics>({
  libParams,
  storage,
}: {
  libParams: LibParams;
  storage: StorageRepository;
}): MutualControllerConstructedParams<G> {
  const { message, callback } = separateMessageAndCallback(libParams);

  const chatId = libParams.ctx.chatId!;

  const languageCode = (message?.from?.language_code ||
    callback?.from.language_code)! as G['AL'];

  const services = {
    userStateService: makeUserStateService<G['AR']>(storage, chatId),
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
  G extends FrameworkGenerics = FrameworkGenerics
>({
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

    ...buildMutualParams<G>({ libParams, storage }),
  };
}

// Common params
export async function constructParams<
  G extends FrameworkGenerics = FrameworkGenerics
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
  routeName: G['AR'];
  // routeParams: TRoute,
  actionName?: G['AA'];
  botConfig: BotConfig<G>;
  libParams: LibParams;
  storage: StorageRepository;
  isStepBack?: boolean;
}): Promise<ControllerConstructedParams<G>> {
  const { message, callback } = separateMessageAndCallback(libParams);

  const mutualParams = buildMutualParams<G>({
    libParams,
    storage,
  });

  const currentState =
    await mutualParams.services.userStateService.getUserCurrentState();
  const isStepForward =
    !isStepBack && currentState !== null && routeName !== currentState;

  const languageCode = (message.from?.language_code ||
    callback?.from.language_code)! as G['AL'];

  const i18n = initializeI18n<G['AL']>(
    botConfig.i18n,
    libParams.ctx.$frameworkLogger,
    languageCode
  );

  return {
    ...mutualParams,

    message: message,
    callback: callback && {
      message: message,
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

    render: makeRender({
      bot,
      routeName,
      currentState,
      userStateService: mutualParams.services.userStateService,
      chatId: mutualParams.chat.id,
      isCommand: mutualParams.isCommand,
      isMessage: mutualParams.isMessage,
      routes: botConfig.routes,
    }),
    renderToChat: makeRenderToChat({
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

      buildButton: buildInlineMarkupButton,
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
