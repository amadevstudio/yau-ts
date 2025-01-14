import {
  MessageStructure,
  ResultMessageStructure,
  TeleBot,
  MarkupButton,
  TeleContext,
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
};

export type RenderCurried = (
  messages: MessageStructure[],
  params?: { resending: boolean }
) => Promise<ResultMessageStructure[]>;

export type RenderToChatCurried = (
  chatId: number,
  messages: MessageStructure[],
  params?: { resending: boolean }
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

export type MutualConstructedParams = {
  chat: {
    id: number;
  };
  user: {
    languageCode: string;
  };

  services: { userStateService: UserStateService };
};

export type ConstructedParams<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = MutualConstructedParams & {
  message?: Message;
  callback?: {
    message?: Message;
    id: string;
  };

  routeName: string;
  actionName: string | undefined;
  stateBeforeInteraction: string | null;

  unitedData: object;

  isStepForward: boolean;
  isStepBack: boolean;
  isCommand: boolean;

  goBackAction: typeof goBackProcessor;

  render: RenderCurried;
  renderToChat: RenderToChatCurried;
  outerSender: OuterSenderCurried;

  components: {
    goBack: {
      buildButton: (customText?: string) => MarkupButton;
      buildRow: (customText?: string) => MarkupButton[];
      buildLayout: (customText?: string) => MarkupButton[][];
    };

    buildButton: (
      type: AvailableRoutes | AvailableActions,
      text: string,
      data?: Record<string, unknown>
    ) => MarkupButton<AvailableRoutes, AvailableActions>;
  };

  i18n: I18n;
};

export type Route<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  method: (
    d: ConstructedParams<AvailableRoutes, AvailableActions>
  ) => Promise<void | false>;
  availableFrom: ('command' | 'message' | 'callback')[];
  commands?: string[];
  routes?: AvailableRoutes[];
  waitsForInput?: boolean;
  statesForInput?: AvailableRoutes[]; // States for message input (for example, its own name)
  actions?: Record<
    string,
    {
      method: (
        d: ConstructedParams<AvailableRoutes, AvailableActions>
      ) => Promise<void>;
      stateIndependent?: boolean;
    }
  >;
  validator?: (
    d: ConstructedParams<AvailableRoutes, AvailableActions>
  ) => boolean;
  // TODO: hasUnderKeyboard?: boolean
};

export type LocalRoutes<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  [key in AvailableRoutes]: Route<AvailableRoutes, AvailableActions>;
};

export type Routes<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  [key in AvailableRoutes | keyof typeof defaultRoutes]: Route<
    AvailableRoutes,
    AvailableActions
  > | null;
};

export type BotConfig<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string,
  AvailableLanguages extends string = string
> = {
  routes: Routes<AvailableRoutes, AvailableActions>;
  defaultRoute: AvailableRoutes;

  i18n?: InitializeI18n;
  defaultTextGetters: {
    goBack: (languageCode: AvailableLanguages) => string;
  };

  testTelegram?: boolean;
  environment?: 'development' | 'production';
};

export type ConstructedServiceParams = MutualConstructedParams & {
  bot: TeleBot;
  botConfig: BotConfig;
  libParams: LibParams;
  routes: Routes;
  storage: StorageRepository;
};
