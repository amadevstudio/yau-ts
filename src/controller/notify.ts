import {
  NotifyCurried,
  RenderCurried,
  TeleBot,
  UserStateService,
} from 'core/types';
import { InlineMarkupButton } from './types';

export function makeNotify(
  bot: TeleBot,
  render: RenderCurried,
  goBackLayout: (customText?: string) => InlineMarkupButton[][],
  userStateService: UserStateService,
  callbackId?: string
): NotifyCurried {
  return async ({ message, alert = false, saveState = false }) => {
    if (callbackId !== undefined) {
      bot.api.answerCallbackQuery(callbackId, {
        text: message,
        show_alert: alert,
      });
      return;
    }

    await render(
      [
        {
          type: 'text',
          text: message,
          replyMarkup: goBackLayout(),
        },
      ],
      { resending: true }
    );
    if (!saveState) {
      userStateService.addUserEmptyState();
    }
  };
}
