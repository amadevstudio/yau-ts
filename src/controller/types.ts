import TelegramBot, { InlineKeyboardButton } from 'node-telegram-bot-api';

export class TeleBot extends TelegramBot {}
export type TeleMessage = TelegramBot.Message;
export type TeleCallback = TelegramBot.CallbackQuery;
export type TeleMeta = TelegramBot.Metadata;
export type TeleInlineKeyboardButton = InlineKeyboardButton;

type MessageTypes = 'text'; // TODO: 'image' | 'audio' ...
export type ButtonData<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  $tp?: AvailableRoutes | AvailableActions;
};
export type MarkupButton<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  text: string;
  data: {
    [key in string]: string | number | null;
  } & ButtonData<AvailableRoutes, AvailableActions>;
};
type BaseMessageStructure<
  AvailableRoutes extends string,
  AvailableActions extends string
> = {
  type: MessageTypes;
  // TODO: add more types
  inlineMarkup?: MarkupButton<AvailableRoutes, AvailableActions>[][];
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
