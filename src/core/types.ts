import {
  TeleCallback,
  TeleMessage,
  TeleMeta, TMessageStructure, TResultMessageStructure
} from "@framework/controller/types";
import { TI18nCurried } from '@framework/i18n/setup';

export type TRoute<AvailableRoutes extends string = string> = {
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

export type TRoutes<AvailableRoutes extends string = string> = {
  [key in AvailableRoutes]: TRoute<AvailableRoutes>;
};

export type TBotConfig<AvailableRoutes extends string = string> = {
  routes: TRoutes<AvailableRoutes>;
  testTelegram?: boolean;
};

export type TLibParams = (
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


type TRenderCurried = (
  chat_id: number,
  messages: TMessageStructure[],
  { resending: boolean }
) => void;
type TOuterSenderCurried = (
  chat_id: number,
  messages: TMessageStructure[]
) => Promise<TResultMessageStructure[]>;

export type TMessage = {
  id: number;
  text?: string;
  from: {
    id?: number;
  };
};
export type TConstructedParams = {
  chat: {
    id: number;
  };
  user: {
    languageCode: string;
  };

  message?: TMessage;
  callback?: {
    message?: TMessage;
    id: string;
  };

  routeName: string;

  unitedData: {};

  render: TRenderCurried;
  outerSender: TOuterSenderCurried;

  i18n: TI18nCurried;
};
