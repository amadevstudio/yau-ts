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
import { InitializeI18n, I18n } from 'i18n/types';
import { StorageRepository } from 'repository/storageTypes';
import { FrameworkLogger } from 'toolbox/logger';

export type ConstructedServiceParams = MutualControllerConstructedParams & {
  bot: TeleBot;
  botConfig: BotConfig;
  libParams: LibParams;
  routes: Routes;
  storage: StorageRepository;
};
export class TeleBot extends Bot {}
export type TeleContextBare = Context;
export type TeleContext = TeleContextBare & {
  $frameworkLogger: FrameworkLogger;
};
export type NextF = NextFunction;
export const LibraryError = GrammyError;
export const LibraryHttpError = HttpError;
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
  getUserStateData(state: AvailableRoutes): Promise<Record<string, unknown>>;
  addUserState(state: AvailableRoutes): Promise<number | undefined>;
  addUserStateData(
    state: AvailableRoutes,
    data: Record<string, unknown>
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

    buildButton: (
      type: G['AR'] | G['AA'],
      text: string,
      data?: Record<string, unknown>
    ) => InlineMarkupButton<G['AR'] | G['AA']>;
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

export type BotConfig<G extends FrameworkGenerics = FrameworkGenerics> = {
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
