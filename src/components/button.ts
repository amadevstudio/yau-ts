import { InlineMarkupButton } from 'controller/types';
import { FrameworkGenerics } from 'core/types';

export function makeBuildInlineMarkupButton<
  G extends FrameworkGenerics = FrameworkGenerics
>() {
  return {
    buildState: function ({
      type,
      text,
      data,
    }: {
      type: G['AR'];
      text: string;
      data?: Record<string, unknown>;
    }): InlineMarkupButton<G['AR'], G['AA']> {
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
    },

    buildPage: function ({
      type,
      page,
      text,
      data,
    }: {
      type: G['AR'];
      page: number;
      text: string;
      data?: Record<string, unknown>;
    }): InlineMarkupButton<G['AR'], G['AA']> {
      if (data === undefined) {
        data = {};
      }

      return {
        text: text,
        data: {
          ...data,
          $tp: type,
          $page: page,
        },
      };
    },
    buildClearSearch: function ({
      type,
      text,
      data,
    }: {
      type: G['AR'];
      text: string;
      data?: Record<string, unknown>;
    }): InlineMarkupButton<G['AR'], G['AA']> {
      if (data === undefined) {
        data = {};
      }

      return {
        text: text,
        data: {
          ...data,
          $tp: type,
          $page: 1,
          $search: false,
        },
      };
    },
  };
}
