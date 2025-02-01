import { InlineMarkupButton } from '@framework/controller/types';

export function buildInlineMarkupButton<
  AvailableRoutes extends string,
  AvailableActions extends string
>(
  type: AvailableRoutes | AvailableActions,
  text: string,
  data?: Record<string, unknown>
): InlineMarkupButton<AvailableRoutes, AvailableActions> {
  if (data === undefined) {
    data = {};
  }

  return {
    text: text,
    data: {
      ...data,
      $tp: type,
    },
  };
}
