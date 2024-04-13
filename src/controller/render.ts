import {
  TeleBot, TeleMessage,
  MessageStructure,
  ResultMessageStructure,
} from '@framework/controller/types';
import {boolean} from "zod";

export default (bot: TeleBot) =>
  (
    chatId: number,
    messages: MessageStructure[],
    { resending }: { resending: boolean }
  ) => {
    // TODO: get structures, get resending flag from storage,
    //  get prev state from storage, save rendered state, except errors:
    // TODO: for telegram timeout exceptions get pause or block and return
    //    else
    // messageMaster(bot, chatId, messages, { resending });
  };

export const outerSender =
  (bot: TeleBot) =>
  async (
    chatId: number,
    messages: MessageStructure[]
  ): Promise<ResultMessageStructure[]> => {
    try {
      const result = messageMaster(
        bot, chatId, messages, { resending: true });
      // TODO: set user resend flag on sent
      return await result;
    } catch (error) {
      // TODO: for telegram timeout exceptions get pause or block and return
      //    else
      throw error;
    }
  };

async function messageMaster(
  bot: TeleBot,
  chatId: number,
  messageStructures: MessageStructure[] = [],
  {
    resending,
    previousMessageStructures,
  }: {
    resending?: boolean;
    previousMessageStructures?: ResultMessageStructure[];
  } = { resending: true, previousMessageStructures: [] }
): Promise<ResultMessageStructure[]> {
  // TODO: Prepare files: file or it's id

  const messagesToDelete: ResultMessageStructure[] = []; // Old messages
  let messagesToEdit: { [key: number]: MessageStructure } = {}; // Old message id => New message structure
  let messagesToSend: MessageStructure[] = []; // New messages

  // Constructing
  let prevSpoolerIndex = 0;
  const messageStructuresLen = messageStructures.length;

  if (resending && previousMessageStructures !== undefined) {
    previousMessageStructures.forEach((prevMessage) => {
      if (prevSpoolerIndex > messageStructuresLen) {
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
    // TODO: const markup = buildMarkup(message)
    const id = parseInt(stringId);
    let resultMessage: boolean | TeleMessage;

    if (message.type === 'text') {
      resultMessage = await bot.editMessageText(message.text, {
        chat_id: chatId,
        message_id: id,
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        // TODO: reply_markup: markup
      });

      // TODO: implement other types
    } else {
      continue;
    }

    newMessageStructures.push({
      id,
      type: message.type,
      message: typeof resultMessage !== "boolean" ? resultMessage : undefined,
    });
  }

  // Send new
  for (const message of messagesToSend) {
    // TODO: const markup = buildMarkup(message)
    let resultMessage;

    if (message.type === 'text') {
      resultMessage = await bot.sendMessage(chatId, message.text, {
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        // TODO: reply_markup: markup
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
