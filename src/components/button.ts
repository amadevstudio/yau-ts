import { MarkupButton } from '@framework/controller/types';

export function buildInlineMarkupButton<
  AvailableRoutes extends string,
  AvailableActions extends string
>(
  type: AvailableRoutes | AvailableActions,
  text: string,
  data?: Record<string, unknown>
): MarkupButton<AvailableRoutes, AvailableActions> {
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
