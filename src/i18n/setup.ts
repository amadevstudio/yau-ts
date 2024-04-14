import { z } from 'zod';
import { TLogger } from '@framework/toolbox/logger';

export type Dictionary<AvailableLanguages extends string = string> = {
  [key in string]: Dictionary | { [key in AvailableLanguages]: string };
};

const FinalTranslationMapSchema = z.record(z.string(), z.string());

export default function (dictionary: Dictionary): InitializeI18n {
  return {
    t:
      (frameworkLogger: TLogger, languageCode: string) =>
      (id: string[]): string => {
        try {
          let currMap: Dictionary | undefined = undefined;
          for (const k of id) {
            if (!FinalTranslationMapSchema.safeParse(dictionary[k]).success) {
              currMap = (currMap ?? dictionary)[k] as Dictionary;
            }
          }

          if (currMap === undefined) {
            frameworkLogger.error("Curr map is undefined", id.join('.'));
            return id.join('.');
          }

          return FinalTranslationMapSchema.parse(currMap)[languageCode];
        } catch (error) {
          frameworkLogger.error(error, id.join('.'));
          return id.join('.');
        }
      },
  };
}

const fallbackT = (id: string[]) => {
  return id.join('.');
};

export function initializeI18n(
  i18n: InitializeI18n | undefined,
  frameworkLogger: TLogger,
  languageCode: string
): I18n {
  return {
    t: i18n === undefined ? fallbackT : i18n.t(frameworkLogger, languageCode),
  };
}

export type InitializeI18n = {
  t: (
    frameworkLogger: TLogger,
    languageCode: string
  ) => (id: string[]) => string;
};

export type I18n = {
  t: (id: string[]) => string;
};
