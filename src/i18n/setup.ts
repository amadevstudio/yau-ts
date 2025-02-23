import { z } from 'zod';
import { FrameworkLogger } from 'toolbox/logger';
import {
  DefaultAvailableLanguages,
  Dictionary,
  InitializeI18n,
  NumeralAll,
  Numerals,
  TranslationEmpty,
  UniteNumeral,
} from './types';
import { I18n } from 'core/types';

const FinalTranslationMapSchema = z.record(z.string(), z.string());

function getNumericType(num: number): Numerals {
  const db100 = num % 100;
  if (11 <= db100 && db100 <= 14) return 'many';

  const db10 = num % 10;
  if (db10 == 1) return 'singular';

  if (2 <= db10 && db10 <= 4) return 'few';

  return 'many';
}

function uniteSafe<Languages extends string = DefaultAvailableLanguages>(
  entity: NumeralAll<Languages>,
  languageCode: Languages,
  numeralType: Numerals
): string | undefined {
  if (!(languageCode in entity[numeralType]!)) {
    return (entity as UniteNumeral<Languages>)?.unite?.[languageCode];
  }

  return entity[numeralType]?.[languageCode];
}

function insertVars(template: string, vars?: string[]) {
  if (vars === undefined) {
    return template;
  }

  let result = template;

  for (let i = 0; i < vars.length; i++) {
    result = result.replace(`{${i}}`, vars[i]);
  }

  return result;
}

export function setupI18n<Languages extends string = DefaultAvailableLanguages>(
  dictionary: Dictionary<Languages>,
  initialParams: { fallbackLanguageCode?: Languages } = {}
): InitializeI18n {
  return {
    t:
      (frameworkLogger: FrameworkLogger, languageCode: string) =>
      (
        id: string[],
        params: { num?: number; vars?: string[] } = {}
      ): string => {
        try {
          let currMap: { [k: string]: string } | undefined = undefined;
          for (const k of id) {
            if (!FinalTranslationMapSchema.safeParse(dictionary[k]).success) {
              currMap = (currMap ?? dictionary)[k] as unknown as {
                [k: string]: string;
              };
            }
          }

          if (currMap === undefined) {
            frameworkLogger.error('Curr map is undefined', id.join('.'));
            return id.join('.');
          }

          const translationEmptyString = () =>
            `Translation is undefined for id [${id.join(
              ' '
            )}], lang ${languageCode}, params ${JSON.stringify(params)}`;

          const postProcess = (result: string) =>
            insertVars(result, params.vars);

          // Numeric translation
          if (params.num !== undefined) {
            const numericType = getNumericType(params.num);

            const translation = uniteSafe(
              currMap as unknown as UniteNumeral<Languages>,
              languageCode as Languages,
              numericType
            );
            if (translation !== undefined) return postProcess(translation);

            if (initialParams.fallbackLanguageCode !== undefined) {
              const fallbackTranslation = uniteSafe(
                currMap as unknown as UniteNumeral<Languages>,
                initialParams.fallbackLanguageCode as Languages,
                numericType
              );
              if (fallbackTranslation !== undefined)
                return postProcess(fallbackTranslation);
            }

            throw new TranslationEmpty(translationEmptyString());
          }

          // Non-numeric translation
          return (() => {
            const schema = FinalTranslationMapSchema.parse(currMap);
            if (languageCode in schema) {
              return postProcess(schema[languageCode]);
            }

            if (
              initialParams.fallbackLanguageCode !== undefined &&
              initialParams.fallbackLanguageCode in schema
            ) {
              return postProcess(schema[initialParams.fallbackLanguageCode]);
            }

            throw new TranslationEmpty(translationEmptyString());
          })();
        } catch (error) {
          frameworkLogger.error(error);
          return id.join('.');
        }
      },
  };
}

const fallbackT = (id: string[]) => {
  return id.join('.');
};

export function initializeI18n<AvailableLanguages extends string>(
  i18n: InitializeI18n | undefined,
  frameworkLogger: FrameworkLogger,
  languageCode: AvailableLanguages
): I18n<AvailableLanguages> {
  return {
    t: i18n === undefined ? fallbackT : i18n.t(frameworkLogger, languageCode),
    languageCode: languageCode,
  };
}
