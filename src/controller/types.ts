import TelegramBot from 'node-telegram-bot-api';

export class TeleBot extends TelegramBot {}
export type TeleMessage = TelegramBot.Message;
export type TeleCallback = TelegramBot.CallbackQuery;
export type TeleMeta = TelegramBot.Metadata;

type TMessageTypes = 'text'; // TODO: 'image' | 'audio' ...
type TButtonData<AvailableRoutes extends string> = {
  tp: AvailableRoutes;
};
type TMarkupButton = {
  text: string;
  data: { string: string | number | null } & TButtonData<string>;
};
type TBase = {
  type: TMessageTypes;
  markupType?: 'inline'; // TODO
  markup?: TMarkupButton[][];
  parseMode?: 'MarkdownV2' | 'HTML';
  disableWebPagePreview?: boolean;
};
type TTextStructure = TBase & {
  text: string;
};
export type TMessageStructure = TTextStructure; // TODO: | Image | ...;
export type TResultMessageStructure = {
  id: number;
  type: TMessageTypes;
  message: TeleMessage;
};
