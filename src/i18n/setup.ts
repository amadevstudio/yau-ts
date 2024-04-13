import {z} from "zod";
import {TLogger} from "@framework/toolbox/logger";

type Dictionary<AvailableLanguages extends string = string> = {
  [key in string]: Dictionary | { [key in AvailableLanguages]: string };
};

const FinalTranslationMapSchema = z.record(z.string(), z.string());

export default function <AvailableLanguages extends string = string>(
  dictionary: Dictionary<AvailableLanguages>
) {
  return {
    t: (frameworkLogger: TLogger, languageCode: AvailableLanguages) => (id: string[]): string => {
      try {
        let currMap: Dictionary<AvailableLanguages> | undefined = undefined;
        for (const k in id) {
          if (!FinalTranslationMapSchema.safeParse(dictionary[k]).success) {
            currMap = dictionary[k] as Dictionary;
          }
        }

        if (currMap === undefined) {
          throw new Error("Key don't exist:" + id.join('.'));
        }

        return (currMap as { [key in AvailableLanguages]: string })[languageCode];

      } catch(error) {
        frameworkLogger.error(error);
        return id.join('.');
      }
    },
  };
}

export function initializeI18n(i18n: TI18n | undefined, frameworkLogger: TLogger, languageCode: string): TI18nCurried {
  return {
    t: i18n?.t(frameworkLogger, languageCode),
  };
}

export type TI18n = {
  t: (frameworkLogger: TLogger, languageCode: string) => (id: string[]) => string;
};

export type TI18nCurried = {
  t: ((id: string[]) => string) | undefined;
};
