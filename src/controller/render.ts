import {
  TeleBot,
  TeleMessage,
  MessageStructure,
  ResultMessageStructure,
  TeleInlineKeyboardButton,
} from '@framework/controller/types';
import { RenderCurried, RenderToChatCurried } from '@framework/core/types';
import { UserStateService } from '@framework/service/userStateService';

type RenderParams = { resending: boolean };

export function makeRender(
  bot: TeleBot,
  userStateService: UserStateService,
  chatId: number
): RenderCurried {
  return async (messages: MessageStructure[], params?: RenderParams) => {
    return render(bot, userStateService, chatId, messages, params);
  };
}

export function makeRenderToChat(
  bot: TeleBot,
  userStateService: UserStateService
): RenderToChatCurried {
  return async (
    chatId: number,
    messages: MessageStructure[],
    params?: RenderParams
  ) => {
    return render(bot, userStateService, chatId, messages, params);
  };
}

async function render(
  bot: TeleBot,
  userStateService: UserStateService,
  chatId: number,
  messages: MessageStructure[],
  params: RenderParams = { resending: false }
): Promise<ResultMessageStructure[]> {
  const resending =
    params.resending || (await userStateService.getUserResendFlag());

  // Get from memory previous messages
  const previousMessageStructures = !resending
    ? await userStateService.getUserMessageStructures()
    : [];

  // Render
  const newMessageStructures = await messageMaster(bot, chatId, messages, {
    resending: resending,
    previousMessageStructures: previousMessageStructures,
  });

  // Save to cache new messages
  await userStateService.setUserMessageStructures(
    newMessageStructures.map((ms) => ({
      id: ms.id,
      type: ms.type,
    }))
  );
  await userStateService.deleteUserResendFlag();

  return newMessageStructures;

  // TODO: catch telegram api exceptions and react: remove user of bot blocked or timeout
}

export function makeOuterSender(bot: TeleBot, userStateService: UserStateService) {
  return async (
    chatId: number,
    messages: MessageStructure[]
  ): Promise<ResultMessageStructure[]> => {
    // try {
    const result = await messageMaster(bot, chatId, messages, {
      resending: true,
    });
    await userStateService.setUserResendFlag();
    return result;
    // } catch (error) {
    //   // TODO: for telegram timeout exceptions get pause or block and return
    //   //    else
    //   throw error;
    // }
  };
}

function prepareMarkup(message: MessageStructure): {
  inline_keyboard: TeleInlineKeyboardButton[][];
} {
  return {
    inline_keyboard:
      message.inlineMarkup === undefined
        ? []
        : message.inlineMarkup.map((line) =>
            line.map((button) => ({
              text: button.text,
              callback_data:
                typeof button.data === 'string'
                  ? button.data
                  : JSON.stringify(button.data),
            }))
          ),
  };
}

async function messageMaster(
  bot: TeleBot,
  chatId: number,
  messageStructures: MessageStructure[] = [],
  {
    resending,
    previousMessageStructures,
  }: {
    resending: boolean;
    previousMessageStructures?: ResultMessageStructure[];
  } = { resending: true, previousMessageStructures: [] }
): Promise<ResultMessageStructure[]> {
  // TODO: Prepare files: file or it's id

  const messagesToDelete: ResultMessageStructure[] = []; // Old messages
  let messagesToEdit: { [key: number]: MessageStructure } = {}; // Old message id => New message structure
  let messagesToSend: MessageStructure[] = []; // New messages

  if (resending) {
    previousMessageStructures = [];
  }

  // Constructing
  let prevSpoolerIndex = 0;
  const messageStructuresLen = messageStructures.length;

  if (previousMessageStructures !== undefined) {
    previousMessageStructures.forEach((prevMessage) => {
      if (prevSpoolerIndex >= messageStructuresLen) {
        messagesToDelete.push(prevMessage);
        return;
      }

      const newMessage = messageStructures[prevSpoolerIndex];
      if (prevMessage.type != newMessage.type) {
        messagesToDelete.push(prevMessage);
        return;
      }

      messagesToEdit[prevMessage.id] = newMessage;
      prevSpoolerIndex += 1;
    });
  }

  for (let i = prevSpoolerIndex; i < messageStructuresLen; i++) {
    messagesToSend.push(messageStructures[i]);
  }

  const newMessageStructures: ResultMessageStructure[] = [];

  // Delete unwanted
  for (const message of messagesToDelete) {
    try {
      await bot.deleteMessage(chatId, message.id);
    } catch (error) {
      messagesToEdit = {};
      messagesToSend = messageStructures;
      break;
    }
  }

  // Edit
  for (const [stringId, message] of Object.entries(messagesToEdit)) {
    const id = parseInt(stringId);
    let resultMessage: boolean | TeleMessage;

    if (message.type === 'text') {
      resultMessage = await bot.editMessageText(message.text, {
        chat_id: chatId,
        message_id: id,
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        reply_markup: prepareMarkup(message),
      });

      // TODO: implement other types
    } else {
      continue;
    }

    newMessageStructures.push({
      id,
      type: message.type,
      message: typeof resultMessage !== 'boolean' ? resultMessage : undefined,
    });
  }

  // Send new
  for (const message of messagesToSend) {
    let resultMessage;

    if (message.type === 'text') {
      resultMessage = await bot.sendMessage(chatId, message.text, {
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        reply_markup: prepareMarkup(message),
      });

      // TODO: implement other types
    } else {
      continue;
    }

    newMessageStructures.push({
      id: resultMessage.message_id,
      type: message.type,
      message: resultMessage,
    });
  }

  // TODO: cache files

  return newMessageStructures;
}
