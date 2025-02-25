import { defaultActionNamesMap } from 'controller/defaultRoutes';
import { FrameworkGenerics, I18n } from 'core/types';
import { BotConfig } from 'core/types';
import { InlineMarkupButton } from 'controller/types';

export const goBackType = defaultActionNamesMap.$back;

export default function makeGoBack<
  G extends FrameworkGenerics = FrameworkGenerics
>({
  getDefaultText,
  i18n,
  buildInlineMarkupButton,
}: {
  getDefaultText?: BotConfig<G>['defaultTextGetters'];
  i18n: I18n<G['AL']>;
  buildInlineMarkupButton: (p: {
    type: G['AR'];
    text: string;
  }) => InlineMarkupButton;
}) {
  const defaultText =
    getDefaultText && getDefaultText.goBack
      ? i18n.t(getDefaultText.goBack(i18n.languageCode))
      : 'Go back';

  const makeButton = (customText?: string) =>
    buildInlineMarkupButton({
      type: goBackType,
      text: customText ?? defaultText,
    });

  return {
    buildButton: makeButton,
    buildRow: (customText?: string) => [makeButton(customText)],
    buildLayout: (customText?: string) => [[makeButton(customText)]],
  };
}
