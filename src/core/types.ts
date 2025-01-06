import {
  TeleCallback,
  TeleMessage,
  TeleMeta,
  MessageStructure,
  ResultMessageStructure,
  TeleBot,
} from '@framework/controller/types';
import { InitializeI18n, I18n } from '@framework/i18n/setup';
import { UserStateService } from '@framework/service/userStateService';
import { defaultRoutes } from '../controller/defaultRoutes';
import { FrameworkLogger } from '@framework/toolbox/logger';
import { StorageRepository } from '@framework/repository/storage';
import { goBackProcessor } from '@framework/controller/controllers';

export type LibParams = (
  | {
      message: TeleMessage;
      callback?: TeleCallback;
    }
  | {
      message?: TeleMessage;
      callback: TeleCallback;
    }
) & {
  isCommand?: boolean;
  metadata?: TeleMeta;
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

export type ConstructedParams = {
  chat: {
    id: number;
  };
  user: {
    languageCode: string;
  };

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

  i18n: I18n;

  services: { userStateService: UserStateService };
};

export type Route<AvailableRoutes extends string = string> = {
  method: (d: ConstructedParams) => Promise<void | false>;
  availableFrom: ('command' | 'message' | 'callback')[];
  commands?: string[];
  routes?: AvailableRoutes[];
  waitsForInput?: boolean;
  statesForInput?: AvailableRoutes[]; // States for message input (for example, its own name)
  // TODO: implement below:
  actions?: Record<
    string,
    {
      method: (d: ConstructedParams) => Promise<void>;
      stateIndependent?: boolean;
    }
  >;
  validator?: (d: ConstructedParams) => boolean;
  // TODO: hasUnderKeyboard?: boolean
};

export type Routes<AvailableRoutes extends string = string> = {
  [key in
    | AvailableRoutes
    | keyof typeof defaultRoutes]: Route<AvailableRoutes> | null;
};

export type BotConfig<AvailableRoutes extends string = string> = {
  routes: Routes<AvailableRoutes>;
  defaultRoute: AvailableRoutes;
  testTelegram?: boolean;
  i18n?: InitializeI18n;
  environment?: 'development' | 'production';
};

export type ConstructedServiceParams = {
  bot: TeleBot;
  frameworkLogger: FrameworkLogger;
  botConfig: BotConfig;
  libParams: LibParams;
  routes: Routes;
  storage: StorageRepository;

  chat: {
    id: number;
  };
  user: {
    languageCode: string;
  };

  services: {
    userStateService: UserStateService;
  };
};
