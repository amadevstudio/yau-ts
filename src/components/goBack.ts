import { defaultActionNamesMap } from '@framework/controller/defaultRoutes';
import { I18n } from '../i18n/setup';
import { buildInlineMarkupButton } from './button';
import { MarkupButton } from '@framework/controller/types';

const goBackType = defaultActionNamesMap.$back;

export default function makeGoBack({
  defaultTextKey,
  i18n,
}: {
  defaultTextKey?: string[];
  i18n: I18n;
}) {
  const defaultText = defaultTextKey ? i18n.t(defaultTextKey) : "Go back";

  function makeButton(customText?: string): MarkupButton {
    return buildInlineMarkupButton(goBackType, customText ?? defaultText);
  }

  return {
    buildButton: makeButton,
    buildRow: (customText?: string) => [makeButton(customText)],
    buildLayout: (customText?: string) => [[makeButton(customText)]],
  };
}
