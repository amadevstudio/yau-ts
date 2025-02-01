import { defaultActionNamesMap } from 'controller/defaultRoutes';
import { I18n } from '../i18n/setup';
import { buildInlineMarkupButton } from './button';
import { BotConfig } from 'core/types';

export const goBackType = defaultActionNamesMap.$back;

export default function makeGoBack<
  AvailableRoutes extends string,
  AvailableActions extends string,
  AvailableLanguages extends string
>({
  getDefaultText,
  i18n,
}: {
  getDefaultText?: BotConfig<{
    AR: AvailableRoutes;
    AA: AvailableActions;
    AL: AvailableLanguages;
  }>['defaultTextGetters']['goBack'];
  i18n: I18n<AvailableLanguages>;
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
