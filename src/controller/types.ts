import {
  TeleKeyboardButtonRequestUsers,
  TeleKeyboardButtonRequestChat,
  TeleKeyboardButtonPollType,
  TeleWebAppInfo,
  TeleKeyboardButton,
  TeleMessage,
  typeFieldName,
  actionFieldName,
  pageFieldName,
  searchFieldName,
} from 'core/types';

type MessageTypes = 'text'; // TODO: 'image' | 'audio' ...
export type ButtonData<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  [typeFieldName]?: AvailableRoutes;
  [actionFieldName]?: AvailableActions;
  [pageFieldName]?: number;
  [searchFieldName]?: boolean;
};
export type InlineMarkupButton<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  text: string;
  data: {
    [key in string]: string | number | boolean | null;
  } & ButtonData<AvailableRoutes, AvailableActions>;
};

export type ReplyKeyboardButton = {
  text: string;
  request_users: TeleKeyboardButtonRequestUsers;
  request_chat: TeleKeyboardButtonRequestChat;
  request_contact: boolean;
  request_location: boolean;
  request_poll: TeleKeyboardButtonPollType;
  web_app: TeleWebAppInfo;
};

type BaseMessageStructure<
  AvailableRoutes extends string,
  AvailableActions extends string
> = {
  type: MessageTypes;
  // TODO: add more types
  inlineMarkup?: InlineMarkupButton<AvailableRoutes, AvailableActions>[][];
  replyMarkup?: TeleKeyboardButton[][];
  parseMode?: 'MarkdownV2' | 'HTML';
  disableWebPagePreview?: boolean;
};

type TextStructure<
  AvailableRoutes extends string,
  AvailableActions extends string
> = BaseMessageStructure<AvailableRoutes, AvailableActions> & {
  text: string;
};
export type MessageStructure<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = TextStructure<AvailableRoutes, AvailableActions>; // TODO: | Image | ...;
export type ResultMessageStructure = {
  id: number;
  type: MessageTypes;
  message?: TeleMessage;
};
