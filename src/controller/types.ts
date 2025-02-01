import { FrameworkLogger } from '@framework/toolbox/logger';
import { Bot, Context, GrammyError, HttpError, NextFunction } from 'grammy';
import {
  CallbackQuery,
  InlineKeyboardButton,
  KeyboardButton,
  KeyboardButtonPollType,
  KeyboardButtonRequestChat,
  KeyboardButtonRequestUsers,
  Message,
  ReplyKeyboardMarkup,
  WebAppInfo,
} from 'grammy/types';

export type FrameworkGenerics = {
  AR: string; // AvailableRoutes
  AA: string; // AvailableActions
  AL: string; // AvailableLanguages
}

export class TeleBot extends Bot {}
export type TeleContextBare = Context;
export type TeleContext = TeleContextBare & {
  $frameworkLogger: FrameworkLogger;
};
export type NextF = NextFunction;
export const LibraryError = GrammyError;
export const LibraryHttpError = HttpError;
export type TeleMessage = Message;
export type TeleCallback = CallbackQuery;
export type TeleKeyboardButton = KeyboardButton;
export type TeleKeyboardMarkup = ReplyKeyboardMarkup;
export type TeleInlineKeyboardButton = InlineKeyboardButton;
export type TeleKeyboardButtonRequestUsers = KeyboardButtonRequestUsers;
export type TeleKeyboardButtonRequestChat = KeyboardButtonRequestChat;
export type TeleKeyboardButtonPollType = KeyboardButtonPollType;
export type TeleWebAppInfo = WebAppInfo;

type MessageTypes = 'text'; // TODO: 'image' | 'audio' ...
export type ButtonData<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  $tp?: AvailableRoutes | AvailableActions;
};
export type InlineMarkupButton<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
> = {
  text: string;
  data: {
    [key in string]: string | number | null;
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
