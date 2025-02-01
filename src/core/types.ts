import {
  MessageStructure,
  ResultMessageStructure,
  TeleBot,
  InlineMarkupButton,
  TeleContext,
  NextF,
  FrameworkGenerics,
} from '@framework/controller/types';
import { InitializeI18n, I18n } from '@framework/i18n/setup';
import { UserStateService } from '@framework/service/userStateService';
import { defaultRoutes } from '../controller/defaultRoutes';
import { StorageRepository } from '@framework/repository/storage';
import { goBackProcessor } from '@framework/controller/controllers';

export const typeFieldName = '$tp';
export const actionFieldName = '$act';

export type LibParams = {
  ctx: TeleContext;
  isCommand?: boolean;
  isMessage?: boolean;
  isCallback?: boolean;
  isAction?: boolean;
};

export type RenderParams = {
  resending?: boolean;
  removeReplyKeyboard?: boolean;
};
export type RenderCurried = (
  messages: MessageStructure[],
  params?: RenderParams
) => Promise<ResultMessageStructure[]>;

export type RenderToChatCurried = (
  chatId: number,
  messages: MessageStructure[],
  params?: RenderParams
) => Promise<ResultMessageStructure[]>;

type OuterSenderCurried = (
  chatId: number,
  messages: MessageStructure[]
) => Promise<ResultMessageStructure[]>;

export type Message = {
  id: number;
  text?: string;
  from: {
    id?: number;
  };
};

export type MutualControllerConstructedParams<AvailableRoutes extends string> =
  {
    chat: {
      id: number;
    };
    user: {
      languageCode: string;
    };

    isCommand: boolean;
    isMessage: boolean;
    isCallback: boolean;
    isAction: boolean;

    services: { userStateService: UserStateService<AvailableRoutes> };
  };
export type MiddlewareConstructedParams<AvailableRoutes extends string> = {
  chat: {
    id?: number;
  };
  user: {
    languageCode?: string;
  };

  services: { userStateService?: UserStateService<AvailableRoutes> };
};

export type ControllerConstructedParams<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
> = MutualControllerConstructedParams<AvailableRoutes> & {
  message?: Message;
  callback?: {
    message?: Message;
    id: string;
  };

  routeName: AvailableRoutes;
  actionName: AvailableActions | undefined;
  stateBeforeInteraction: string | null;

  unitedData: object;

  isStepForward: boolean;
  isStepBack: boolean;

  goBackAction: typeof goBackProcessor;

  render: RenderCurried;
  renderToChat: RenderToChatCurried;
  outerSender: OuterSenderCurried;

  components: {
    goBack: {
      buildButton: (customText?: string) => InlineMarkupButton;
      buildRow: (customText?: string) => InlineMarkupButton[];
      buildLayout: (customText?: string) => InlineMarkupButton[][];
    };

    buildButton: (
      type: AvailableRoutes | AvailableActions,
      text: string,
      data?: Record<string, unknown>
    ) => InlineMarkupButton<AvailableRoutes, AvailableActions>;
  };

  i18n: I18n<AvailableLanguages>;
};

export type Route<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
> = {
  method: (
    d: ControllerConstructedParams<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >
  ) => Promise<void | false>;
  availableFrom: ('command' | 'message' | 'callback')[];
  commands?: string[];
  routes?: AvailableRoutes[];
  waitsForInput?: boolean;
  statesForInput?: AvailableRoutes[]; // States for message input (for example, its own name)
  actions?: Record<
    AvailableActions,
    {
      method: (
        d: ControllerConstructedParams<
          AvailableRoutes,
          AvailableActions,
          AvailableLanguages
        >
      ) => Promise<void>;
      stateIndependent?: boolean;
    }
  >;
  validator?: (
    d: ControllerConstructedParams<
      AvailableRoutes,
      AvailableActions,
      AvailableLanguages
    >
  ) => boolean;
  hasReplyKeyboard?: boolean;
};

export type LocalRoutes<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
> = {
  [key in AvailableRoutes]: Route<
    AvailableRoutes,
    AvailableActions,
    AvailableLanguages
  >;
};

export type Routes<G extends FrameworkGenerics> = {
  [key in G['AR'] | keyof typeof defaultRoutes]: Route<
    G['AR'],
    G['AA'],
    G['AL']
  > | null;
};

/**
 * Should
 *`await next();`
 */
export type CustomMiddleware<AvailableRoutes extends string> = (
  params: MiddlewareConstructedParams<AvailableRoutes>,
  next: NextF
) => Promise<void>;

export type BotConfig<G extends FrameworkGenerics> = {
  routes: Routes<G>;
  defaultRoute: G['AR'];

  middlewares?: CustomMiddleware<G['AR']>[];

  i18n?: InitializeI18n;
  defaultTextGetters: {
    goBack: (languageCode: G['AL']) => string;
  };

  testTelegram?: boolean;
  environment?: 'development' | 'production';
};

export type ConstructedServiceParams<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
> = MutualControllerConstructedParams<AvailableRoutes> & {
  bot: TeleBot;
  botConfig: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>;
  libParams: LibParams;
  routes: Routes<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>;
  storage: StorageRepository;
};
