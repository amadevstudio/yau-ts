import {
  TeleBot,
  TMessageStructure,
  TResultMessageStructure,
} from '@framework/controller/types';

export default (bot: TeleBot) =>
  (
    chat_id: number,
    messages: TMessageStructure[],
    { resending }: { resending: boolean }
  ) => {
    // TODO: get structures, get resending flag from storage,
    //  get prev state from storage, save rendered state, except errors:
    // TODO: for telegram timeout exceptions get pause or block and return
    //    else
    // messageMaster(bot, chat_id, messages, { resending });
  };

export const outerSender =
  (bot: TeleBot) =>
  async (
    chat_id: number,
    messages: TMessageStructure[]
  ): Promise<TResultMessageStructure[]> => {
    try {
      const result = messageMaster(bot, chat_id, messages, { resending: true });
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
  messageStructures: TMessageStructure[] = [],
  {
    resending,
    previousMessageStructures,
  }: {
    resending?: boolean;
    previousMessageStructures?: TResultMessageStructure[];
  } = { resending: true, previousMessageStructures: [] }
): Promise<TResultMessageStructure[]> {
  // TODO: Prepare files: file or it's id

  const messagesToDelete: TResultMessageStructure[] = []; // Old messages
  let messagesToEdit: { [key: number]: TMessageStructure } = {}; // Old message id => New message structure
  let messagesToSend: TMessageStructure[] = []; // New messages

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

  const newMessageStructures: TResultMessageStructure[] = [];

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
    let resultMessage;

    if (message.type === 'text') {
      resultMessage = await bot.editMessageText(message.text, {
        chatId,
        message_id: id,
        parse_mode: message.parseMode,
        disable_web_page_preview: message.disableWebPagePreview,
        // TODO: reply_markup: markup
      });

      // TODO: implement another types
    } else {
      continue;
    }

    newMessageStructures.push({
      id,
      type: message.type,
      message: resultMessage,
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

      // TODO: implement another types
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
