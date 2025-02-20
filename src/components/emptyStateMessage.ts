import { InlineMarkupButton, MessageStructure } from 'controller/types';
import { FrameworkGenerics } from 'core/types';

export default function makeEmptyStateMessage<
  G extends FrameworkGenerics = FrameworkGenerics
>({
  buildGoBackLayout,
}: {
  buildGoBackLayout: (
    customText?: string
  ) => InlineMarkupButton<G['AR'], G['AA']>[][];
}) {
  return function ({ text }: { text: string }) {
    return [
      {
        type: 'text',
        text,
        inlineMarkup: buildGoBackLayout(),
      },
    ] as MessageStructure<G['AR'], G['AA']>[];
  };
}
