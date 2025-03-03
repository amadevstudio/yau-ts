import {
  BotConfig,
  ControllerConstructedParams,
  ConstructedServiceParams,
  LibParams,
  MutualControllerConstructedParams,
  MiddlewareConstructedParams,
  FrameworkGenerics,
} from 'core/types';
import { TeleBot, TeleCallback, TeleContext, TeleMessage } from './types';
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
import makeUserStateService, {
  makeUsersStateService,
} from 'service/userStateService';
import makeEmptyStateMessage from 'components/emptyStateMessage';
import { makePaging } from 'components/paging';
import { makeBuildInlineMarkupButton } from 'components/button';
import { makeNotify } from 'controller/notify';

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
  botId,
  libParams,
}: {
  botId: number;
  libParams: LibParams;
}): MutualControllerConstructedParams {
  const { message, callback } = separateMessageAndCallback(libParams);

  const chatId = libParams.ctx.chatId!;

  const languageCode = (message?.from?.language_code ||
    callback?.from.language_code)! as G['AL'];

  const isCommand = libParams.isCommand ?? false;
  const isMessage = libParams.isMessage ?? false;
  const isCallback = libParams.isCallback ?? false;
  const isAction = libParams.isAction ?? false;

  return {
    botId: botId,

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

    isMessageFromTheBot: message.from?.id === botId,
  };
}

// Service params
export function constructServiceParams<
  G extends FrameworkGenerics = FrameworkGenerics
>({
  bot,
  botId,
  botConfig,
  libParams,
  storage,
}: {
  bot: TeleBot;
  botId: number;
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
    services: {
      usersStateService: makeUsersStateService({ storage }),
    },

    ...buildMutualParams<G>({ botId, libParams }),
  };
}

// Common params
export async function constructParams<
  G extends FrameworkGenerics = FrameworkGenerics
>({
  bot,
  botId,
  routeName,
  actionName,
  botConfig,
  libParams,
  storage,
  isStepBack = false,
}: {
  bot: TeleBot;
  botId: number;
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
    botId,
    libParams,
  });

  const services = {
    userStateService: makeUserStateService<G['AR']>({
      storage,
      chatId: mutualParams.chat.id,
      currentState: routeName,
    }),
  };

  const currentState = await services.userStateService.getUserCurrentState();
  const isStepForward =
    !isStepBack && currentState !== null && routeName !== currentState;

  const languageCode = (message.from?.language_code ||
    callback?.from.language_code)! as G['AL'];

  const i18n = initializeI18n<G['AL']>(
    botConfig.i18n,
    libParams.ctx.$frameworkLogger,
    languageCode
  );

  const buttonBuilders = makeBuildInlineMarkupButton<G>();

  const goBackComponents = makeGoBack<G>({
    getDefaultText: botConfig?.defaultTextGetters,
    i18n,
    buildInlineMarkupButton: buttonBuilders.buildState,
  });

  const unitedData = await getUnitedData(
    callback,
    services.userStateService,
    routeName,
    actionName
  );

  const pagingComponents = makePaging({
    type: routeName,
    getDefaultText: botConfig?.defaultTextGetters,
    userStateService: services.userStateService,
    i18n,
    unitedData,
    messageText:
      !mutualParams.isCallback && !mutualParams.isCommand
        ? message.text
        : undefined,
    defaultPerPage: botConfig.paging?.defaultPerPage,
    buildPageButton: buttonBuilders.buildPage,
    buildGoBackButton: goBackComponents.buildButton,
    buildClearSearchButton: buttonBuilders.buildClearSearch,
  });

  const render = makeRender({
    bot,
    routeName,
    currentState,
    userStateService: services.userStateService,
    chatId: mutualParams.chat.id,
    isCommand: mutualParams.isCommand,
    isMessage: mutualParams.isMessage,
    routes: botConfig.routes,
  });

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

    unitedData,

    isStepForward,
    isStepBack,

    goBackAction: goBackProcessor,

    render,
    renderToChat: makeRenderToChat<G>({
      bot,
      routeName,
      storage,
      routes: botConfig.routes,
    }),
    outerSender: makeOuterSender(bot, services.userStateService),
    notify: makeNotify(
      bot,
      render,
      goBackComponents.buildLayout,
      services.userStateService,
      callback?.id
    ),

    services,

    components: {
      goBack: goBackComponents,

      emptyStateMessage: makeEmptyStateMessage<G>({
        buildGoBackLayout: goBackComponents.buildLayout,
      }),

      inlineButtons: buttonBuilders,

      paging: pagingComponents,
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
      usersStateService: makeUsersStateService({ storage }),
    },
  };
}
