import {
  MessageStructure,
  ResultMessageStructure,
  InlineMarkupButton,
} from 'controller/types';
import { Bot, Context, NextFunction, GrammyError, HttpError } from 'grammy';
import {
  Message,
  CallbackQuery,
  KeyboardButton,
  ReplyKeyboardMarkup,
  InlineKeyboardButton,
  KeyboardButtonRequestUsers,
  KeyboardButtonRequestChat,
  KeyboardButtonPollType,
  WebAppInfo,
} from 'grammy/types';
import { InitializeI18n } from 'i18n/types';
import { StorageRepository } from 'repository/storageTypes';
import { FrameworkLogger } from 'toolbox/logger';

export type I18n<AvailableLanguages extends string> = {
  t: (id: string[], params?: { num?: number; vars?: string[] }) => string;
  languageCode: AvailableLanguages;
};

export type SpecialStateKeywords = '$tp' | '$act' | '$page' | '$search';

export type ConstructedServiceParams = MutualControllerConstructedParams & {
  bot: TeleBot;
  botConfig: BotConfig;
  libParams: LibParams;
  routes: Routes;
  storage: StorageRepository;
};
export const TeleError = GrammyError;
export class TeleErrors {
  static CHAT_NOT_FOUND = 400;
}
export const TeleHttpError = HttpError;
export class TeleBot extends Bot {}
export type TeleContextBare = Context;
export type TeleContext = TeleContextBare & {
  $frameworkLogger: FrameworkLogger;
};
export type NextF = NextFunction;
export interface TeleMessage extends Message {}
export type TeleCallback = CallbackQuery;
export type TeleKeyboardButton = KeyboardButton;
export type TeleKeyboardMarkup = ReplyKeyboardMarkup;
export type TeleInlineKeyboardButton = InlineKeyboardButton;
export type TeleKeyboardButtonRequestUsers = KeyboardButtonRequestUsers;
export type TeleKeyboardButtonRequestChat = KeyboardButtonRequestChat;
export type TeleKeyboardButtonPollType = KeyboardButtonPollType;
export type TeleWebAppInfo = WebAppInfo;

export type FrameworkGenerics = {
  AR: string; // AvailableRoutes
  AA: string; // AvailableActions
  AL: string; // AvailableLanguages
};

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

export type UserStateService<AvailableRoutes extends string = string> = {
  clearUserStorage(): Promise<void>;
  getUserStates(): Promise<AvailableRoutes[]>;
  getUserCurrentState(): Promise<AvailableRoutes | null>;
  getUserPreviousState(): Promise<AvailableRoutes | null>;
  getUserPreviousAndCurrentStates(): Promise<(AvailableRoutes | undefined)[]>;
  getUserStateData(
    state: AvailableRoutes
  ): Promise<Record<string | SpecialStateKeywords, unknown>>;
  addUserState(state: AvailableRoutes): Promise<number | undefined>;
  addUserEmptyState(): Promise<number | undefined>;
  addUserStateData(
    state: AvailableRoutes,
    data: Record<string | SpecialStateKeywords, unknown>
  ): Promise<number>;
  deleteUserCurrentState(): Promise<AvailableRoutes | null>;
  deleteUserStates(): Promise<number>;
  deleteUserStateData(state: string): Promise<number>;
  deleteUserStatesData(): Promise<void>;
  getUserResendFlag(): Promise<boolean>;
  setUserResendFlag(resend?: boolean): Promise<void>;
  deleteUserResendFlag(): Promise<number>;
  getUserMessageStructures(): Promise<ResultMessageStructure[]>;
  setUserMessageStructures(
    messageStructures: ResultMessageStructure[]
  ): Promise<void>;
};

export type MutualControllerConstructedParams<
  G extends FrameworkGenerics = FrameworkGenerics
> = {
  botId: number;

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

  isMessageFromTheBot: boolean;

  services: { userStateService: UserStateService<G['AR']> };
};
export type MiddlewareConstructedParams<
  AvailableRoutes extends string = string
> = {
  chat: {
    id?: number;
  };
  user: {
    languageCode?: string;
  };

  services: { userStateService?: UserStateService<AvailableRoutes> };
};

export type ControllerConstructedParams<
  G extends FrameworkGenerics = FrameworkGenerics
> = MutualControllerConstructedParams<G> & {
  message?: TeleMessage;
  callback?: {
    message?: TeleMessage;
    id: string;
  };

  routeName: G['AR'];
  actionName: G['AA'] | undefined;
  stateBeforeInteraction: G['AR'] | null;

  unitedData: object;

  isStepForward: boolean;
  isStepBack: boolean;

  goBackAction: (d: ConstructedServiceParams) => void;

  render: RenderCurried;
  renderToChat: RenderToChatCurried;
  outerSender: OuterSenderCurried;

  components: {
    goBack: {
      buildButton: (customText?: string) => InlineMarkupButton;
      buildRow: (customText?: string) => InlineMarkupButton[];
      buildLayout: (customText?: string) => InlineMarkupButton[][];
    };

    emptyStateMessage: ({
      text,
    }: {
      text: string;
    }) => MessageStructure<G['AR'], G['AA']>[];

    inlineButtons: {
      buildState: (p: {
        type: G['AR'] | G['AA'];
        text: string;
        data?: Record<string, unknown>;
      }) => InlineMarkupButton<G['AR'] | G['AA']>;
    };

    paging: {
      buildSetup: <ResultData, ErrorType = string>(p: {
        loadPageData: (p: {
          offset: number;
          page: number;
          perPage: number;
          searchQuery?: string;
        }) => Promise<ResultData[] | { error: ErrorType }>;
        loadCount: (p: {
          searchQuery?: string;
        }) => Promise<number | { error: ErrorType }>;
        overwritePerPage?: number;
        customGoBackText?: string;
      }) => Promise<
        | {
            currentPage: number;
            pageData: ResultData[];
            helperMessage: string;
            markup: InlineMarkupButton<G['AR'], G['AA']>[][];
          }
        | {
            error: ErrorType | 'noDataFound' | 'noDataFoundInSearch';
            searchMode?: boolean;
          }
      >;
    };
  };

  i18n: I18n<G['AL']>;
};

export type Route<G extends FrameworkGenerics = FrameworkGenerics> = {
  method: (d: ControllerConstructedParams) => Promise<void | false>;
  availableFrom: ('command' | 'message' | 'callback')[];
  commands?: string[];
  routes?: G['AR'][];
  waitsForInput?: boolean;
  statesForInput?: G['AR'][]; // States for message input (for example, its own name)
  actions?: Record<
    G['AA'],
    {
      method: (d: ControllerConstructedParams) => Promise<void>;
      stateIndependent?: boolean;
    }
  >;
  validator?: (d: ControllerConstructedParams) => boolean;
  hasReplyKeyboard?: boolean;
  // isPageable?: boolean;
  // pageable?: {
  //   loadPageData: <ResultData>(p: {
  //     offset: number;
  //     perPage: number;
  //     searchText?: string;
  //   }) => Promise<ResultData>;
  //   loadCount: (p: { searchText?: string }) => Promise<number>;
  // };
};

export type DefaultRouteNames = '$empty';

export type LocalRoutes<G extends FrameworkGenerics = FrameworkGenerics> = {
  [key in G['AR']]: Route<G>;
};

export type Routes<G extends FrameworkGenerics = FrameworkGenerics> = {
  [key in G['AR'] | DefaultRouteNames]: Route<G> | null;
};

/**
 * Should
 *`await next();`
 */
export type CustomMiddleware<AvailableRoutes extends string = string> = (
  params: MiddlewareConstructedParams<AvailableRoutes>,
  next: NextF
) => Promise<void>;

type MutualTypes<G extends FrameworkGenerics = FrameworkGenerics> = {
  defaultRoute: G['AR'];

  i18n?: InitializeI18n;
  defaultTextGetters?: {
    goBack?: (languageCode?: G['AL']) => string[];
    paging?: {
      navigationHelper?: (languageCode?: G['AL']) => string[];
      clearSearch?: (languageCode?: G['AL']) => string[];
    };
  };

  paging?: {
    defaultPerPage?: number;
  };

  environment?: 'development' | 'production';
};

export type InitializeSystemConfig<
  G extends FrameworkGenerics = FrameworkGenerics
> = MutualTypes<G> & {
  initializeProject: (bot: TeleBot) => {
    routes: Routes<G>;
    middlewares?: CustomMiddleware<G['AR']>[];
  };

  testTelegram?: boolean;
};

export type BotConfig<G extends FrameworkGenerics = FrameworkGenerics> =
  MutualTypes<G> & {
    routes: Routes<G>;

    middlewares?: CustomMiddleware<G['AR']>[];
  };
