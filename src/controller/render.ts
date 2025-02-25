import makeUserStateService from './../service/userStateService';
import { MessageStructure, ResultMessageStructure } from 'controller/types';
import {
  TeleBot,
  TeleMessage,
  TeleInlineKeyboardButton,
  TeleKeyboardButton,
} from 'core/types';
import {
  FrameworkGenerics,
  RenderCurried,
  RenderParams,
  RenderToChatCurried,
  Routes,
  UserStateService,
} from 'core/types';
import { StorageRepository } from 'repository/storageTypes';

type MakeRenderBase<G extends FrameworkGenerics = FrameworkGenerics> = {
  bot: TeleBot;
  routeName: G['AR'];
  routes: Routes<G>;
};

type MakeRender<G extends FrameworkGenerics = FrameworkGenerics> =
  MakeRenderBase<G> & {
    isCommand: boolean;
    isMessage: boolean;
    currentState: G['AR'] | null;
    userStateService: UserStateService<G['AR']>;
    chatId: number;
  };

type MakeRenderToChat<G extends FrameworkGenerics = FrameworkGenerics> =
  MakeRenderBase<G> & {
    storage: StorageRepository;
  };

type DecideShouldRemoveReplyKeyboardParams<G extends FrameworkGenerics> = {
  routeName?: G['AR'];
  currentState: G['AR'] | null;
  routes: Routes<G>;
};

async function decideShouldRemoveReplyKeyboard<
  G extends FrameworkGenerics = FrameworkGenerics
>({
  routes,
  routeName,
  currentState,
}: DecideShouldRemoveReplyKeyboardParams<G>) {
  const newStateHasReplyKeyboard = routes[routeName]?.hasReplyKeyboard === true;
  // If new state has reply keyboard, don't remove
  if (newStateHasReplyKeyboard) return false;

  // If unknown, remove to be sure
  const unknownCurrentState = currentState === null;
  if (unknownCurrentState) return true;

  // If known, decide on params
  const prevStateHasReplyKeyboard =
    routes[currentState]?.hasReplyKeyboard === true;
  if (prevStateHasReplyKeyboard) return true;

  return false;
  // DRAFT
  // return (
  //   (await userStateService.getUserResendFlag()) ||
  //   (isCallback && !isStepBack)
  // );
}

// Render to the chat.
export function makeRender<G extends FrameworkGenerics = FrameworkGenerics>({
  bot,
  routeName,
  currentState,
  userStateService,
  chatId,
  isCommand,
  isMessage,
  routes,
}: MakeRender<G>): RenderCurried {
  return async (messages: MessageStructure[], params?: RenderParams) => {
    return render(bot, userStateService, chatId, messages, {
      ...params,
      resending: isCommand || isMessage,
      routes,
      routeName,
      currentState,
    });
  };
}

// Render to another chat.
export function makeRenderToChat<
  G extends FrameworkGenerics = FrameworkGenerics
>({
  bot,
  routeName,
  storage,
  routes,
}: MakeRenderToChat<G>): RenderToChatCurried {
  return async (
    chatId: number,
    messages: MessageStructure[],
    params?: RenderParams
  ) => {
    const userStateService = makeUserStateService<G['AR']>(storage, chatId);

    return render<G>(bot, userStateService, chatId, messages, {
      ...params,
      routes,
      routeName,
      currentState: await userStateService.getUserCurrentState(),
    });
  };
}

export type InnerRenderParams<G extends FrameworkGenerics = FrameworkGenerics> =
  {
    resending?: boolean;
    routes: Routes<G>;
    routeName: G['AR'];
    currentState: G['AR'] | null;
  };

async function render<G extends FrameworkGenerics = FrameworkGenerics>(
  bot: TeleBot,
  userStateService: UserStateService<G['AR']>,
  chatId: number,
  messages: MessageStructure[],
  params: InnerRenderParams<G>
): Promise<ResultMessageStructure[]> {
  const resending =
    params.resending === true || (await userStateService.getUserResendFlag());

  const shouldRemoveReplyKeyboard = await decideShouldRemoveReplyKeyboard<G>({
    routes: params.routes,
    routeName: params.routeName,
    currentState: params.currentState,
  });

  const shouldSendReplyKeyboard =
    params.routes[params.routeName]?.hasReplyKeyboard === true; // Should resend as editing doesn't allow set reply keyboard

  // Get from memory previous messages
  const previousMessageStructures = !resending
    ? await userStateService.getUserMessageStructures()
    : [];

  // Render
  const newMessageStructures = await messageMaster(bot, chatId, messages, {
    resending,
    previousMessageStructures,
    shouldRemoveReplyKeyboard,
    shouldSendReplyKeyboard,
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

export function makeOuterSender<AvailableRoutes extends string>(
  bot: TeleBot,
  userStateService: UserStateService<AvailableRoutes>
) {
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

// TODO
export function makeDelete() {}

// Processors

async function messageMaster(
  bot: TeleBot,
  chatId: number,
  messageStructures: MessageStructure[] = [],
  {
    resending,
    previousMessageStructures,
    shouldRemoveReplyKeyboard,
    shouldSendReplyKeyboard,
  }: {
    resending: boolean;
    previousMessageStructures?: ResultMessageStructure[];
    shouldRemoveReplyKeyboard?: boolean;
    shouldSendReplyKeyboard?: boolean;
  } = { resending: true, previousMessageStructures: [] }
): Promise<ResultMessageStructure[]> {
  // TODO: Prepare files: file or it's id

  function prepareMarkup(message: MessageStructure): {
    inline_keyboard: TeleInlineKeyboardButton[][];
    keyboard?: TeleKeyboardButton[][];
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
      ...(message.replyMarkup !== undefined
        ? {
            keyboard: message.replyMarkup.map((line) =>
              line.map((button) => button)
            ),
          }
        : {}),
    };
  }

  const messagesToDelete: ResultMessageStructure[] = []; // Old messages
  let messagesToEdit: { [key: number]: MessageStructure } = {}; // Old message id => New message structure
  let messagesToSend: MessageStructure[] = []; // New messages

  if (resending) {
    previousMessageStructures = [];
  }

  if (shouldRemoveReplyKeyboard) {
    const resultMessage = await bot.api.sendMessage(chatId, '...', {
      reply_markup: { remove_keyboard: true },
    });
    await bot.api.deleteMessage(chatId, resultMessage.message_id);
  }

  // Constructing
  if (shouldSendReplyKeyboard) {
    messagesToDelete.push(...(previousMessageStructures ?? []));
    messagesToSend.push(...messageStructures);
  } else {
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
  }

  const newMessageStructures: ResultMessageStructure[] = [];

  // Delete unwanted
  for (const message of messagesToDelete) {
    try {
      await bot.api.deleteMessage(chatId, message.id);
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
      const markup = {
        inline_keyboard: prepareMarkup(message).inline_keyboard,
      };

      resultMessage = await bot.api.editMessageText(chatId, id, message.text, {
        parse_mode: message.parseMode,
        link_preview_options: { is_disabled: message.disableWebPagePreview },
        reply_markup: markup,
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
      resultMessage = await bot.api.sendMessage(chatId, message.text, {
        parse_mode: message.parseMode,
        link_preview_options: { is_disabled: message.disableWebPagePreview },
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
