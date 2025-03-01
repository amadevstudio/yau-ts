import { InlineMarkupButton } from 'controller/types';
import {
  actionFieldName,
  ControllerConstructedParams,
  FrameworkGenerics,
  pageFieldName,
  searchFieldName,
  typeFieldName,
} from 'core/types';

export function makeBuildInlineMarkupButton<
  G extends FrameworkGenerics = FrameworkGenerics
>(): ControllerConstructedParams<G>['components']['inlineButtons'] {
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
        text,
        data: {
          ...data,
          [typeFieldName]: type,
        },
      };
    },

    buildAction: function ({
      type,
      action,
      text,
      data,
    }: {
      type: G['AR'];
      action: G['AA'];
      text: string;
      data?: Record<string, unknown>;
    }) {
      if (data === undefined) {
        data = {};
      }

      return {
        text,
        data: {
          ...data,
          [typeFieldName]: type,
          [actionFieldName]: action,
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
        text,
        data: {
          ...data,
          [typeFieldName]: type,
          [pageFieldName]: page,
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
        text,
        data: {
          ...data,
          [typeFieldName]: type,
          [pageFieldName]: 1,
          [searchFieldName]: false,
        },
      };
    },
  };
}
