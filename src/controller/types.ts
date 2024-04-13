import TelegramBot from 'node-telegram-bot-api';

export class TeleBot extends TelegramBot {}
export type TeleMessage = TelegramBot.Message;
export type TeleCallback = TelegramBot.CallbackQuery;
export type TeleMeta = TelegramBot.Metadata;

type MessageTypes = 'text'; // TODO: 'image' | 'audio' ...
type ButtonData<AvailableRoutes extends string> = {
  tp: AvailableRoutes;
};
type MarkupButton = {
  text: string;
  data: { string: string | number | null } & ButtonData<string>;
};
type BaseMessageStructure = {
  type: MessageTypes;
  markupType?: 'inline'; // TODO
  markup?: MarkupButton[][];
  parseMode?: 'MarkdownV2' | 'HTML';
  disableWebPagePreview?: boolean;
};
type TextStructure = BaseMessageStructure & {
  text: string;
};
export type MessageStructure = TextStructure; // TODO: | Image | ...;
export type ResultMessageStructure = {
  id: number;
  type: MessageTypes;
  message?: TeleMessage;
};
