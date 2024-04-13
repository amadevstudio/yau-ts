import curry from '@framework/toolbox/curry';

type TDictionary<AvailableLanguages extends string = string> = {
  [key in string]: TDictionary | { [key in AvailableLanguages]: string };
};

export default function <AvailableLanguages>(
  dictionary: TDictionary<AvailableLanguages>
) {
  return {
    t: (languageCode: AvailableLanguages, id: string[]): string => {
      try {
        let currMap: TDictionary<AvailableLanguages>;
        for (const k in id) {
          currMap = dictionary[k];
        }
        return currMap[languageCode];
      } catch {
        return id.join('.');
      }
    },
  };
}

export function curryI18n(i18n: TI18n, languageCode: string): TI18nCurried {
  return {
    t: curry(i18n.t)(languageCode),
  };
}

export type TI18n = {
  t: (languageCode: string, id: string[]) => string;
};

export type TI18nCurried = {
  t: (id: string[]) => string;
};
