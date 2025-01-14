import { defaultActionNamesMap } from '@framework/controller/defaultRoutes';
import { I18n } from '../i18n/setup';
import { buildInlineMarkupButton } from './button';
import { BotConfig } from '@framework/core/types';

export const goBackType = defaultActionNamesMap.$back;

export default function makeGoBack({
  getDefaultText: getDefaultText,
  i18n,
}: {
  getDefaultText?: BotConfig['defaultTextGetters']['goBack'];
  i18n: I18n;
}) {
  const defaultText = getDefaultText
    ? getDefaultText(i18n.languageCode)
    : 'Go back';

  const makeButton = (customText?: string) =>
    buildInlineMarkupButton(goBackType, customText ?? defaultText);

  return {
    buildButton: makeButton,
    buildRow: (customText?: string) => [makeButton(customText)],
    buildLayout: (customText?: string) => [[makeButton(customText)]],
  };
}
