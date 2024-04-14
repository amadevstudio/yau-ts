import {
  TeleCallback,
  TeleMessage,
  TeleMeta,
  MessageStructure,
  ResultMessageStructure,
} from '@framework/controller/types';
import { InitializeI18n, I18n } from '@framework/i18n/setup';

export type Route<AvailableRoutes extends string = string> = {
  method: Function;
  availableFrom: ('command' | 'message' | 'call')[];
  commands?: string[];
  routes?: AvailableRoutes[];
  // TODO: implement below:
  // wait_for_input: bool
  // states_for_input: list[AvailableRoutes]  # States for message input (for example, its own name)
  // actions: Dict[str, RouteActionsInterface]
  // validator: Callable
  // have_under_keyboard: bool | None
};

export type Routes<AvailableRoutes extends string = string> = {
  [key in AvailableRoutes]: Route<AvailableRoutes>;
};

export type BotConfig<
  AvailableRoutes extends string = string
> = {
  routes: Routes<AvailableRoutes>;
  testTelegram?: boolean;
  i18n?: InitializeI18n;
};

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

type RenderCurried = (
  chatId: number,
  messages: MessageStructure[],
  { resending }: { resending: boolean }
) => void;

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

  unitedData: {};

  render: RenderCurried;
  outerSender: OuterSenderCurried;

  i18n: I18n;
};
