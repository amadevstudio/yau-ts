import { TConstructedParams, TLibParams } from "@framework/core/types";
import TelegramBot from 'node-telegram-bot-api';
import { TeleBot } from '@framework/controller/types';
import curry from '@framework/toolbox/curry';
import render, { outerSender } from '@framework/controller/render';
import { curryI18n, TI18n } from "@framework/i18n/setup";

export function constructParams(
  bot: TeleBot,
  routeName: string,
  // routeParams: TRoute,
  i18n: TI18n,
  libParams: TLibParams
): TConstructedParams {
  const messageData = (msg: TelegramBot.Message | undefined) => {
    return (
      msg && {
        id: msg.message_id,
        text: msg.text,
        from: {
          id: msg.from?.id,
        },
      }
    );
  };

  const languageCode = (libParams.message?.from?.language_code ||
    libParams.callback?.from.language_code)!;

  return {
    chat: {
      id: (libParams.message?.chat.id || libParams.callback?.message?.chat.id)!,
    },
    user: {
      languageCode: languageCode,
    },

    message: messageData(libParams.message),
    callback: libParams.callback && {
      message: messageData(libParams.callback.message),
      id: libParams.callback?.id!,
    },

    routeName: routeName,
    // TODO: action_name: actionName,

    // TODO: united_data: get_united_data(callback, chat_id, route_name, action_name),
    unitedData: {},

    // TODO
    // is_step_forward: is_step_forward,
    // is_step_back: is_step_back,
    // is_command: callback is None and message is not None and router_tools.is_command(message.text),
    //
    // go_back_action: goBackModule.go_back,

    render: curry(render)(bot),
    outerSender: curry(outerSender)(bot),

    i18n: curryI18n(i18n, languageCode),
  };
}
