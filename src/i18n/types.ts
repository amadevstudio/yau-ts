import { FrameworkLogger } from 'toolbox/logger';

export class TranslationEmpty extends Error {
  constructor(msg: string) {
    super(msg);

    // Set the prototype explicitly.
    Object.setPrototypeOf(this, TranslationEmpty.prototype);
  }
}
export type DefaultAvailableLanguages = 'en' | 'cn'; // Default available languages
type LangDict<Languages extends string> = {
  [key: string]: LangDict<Languages> | {
    [key in Languages]: string;
  };
};
export type Numerals = 'singular' | 'few' | 'many';
type UniteNumerals = 'unite';
type Numeral<Languages extends string> = Record<
  Numerals, {
    [k in Languages]: string;
  }
>;
type NumeralOptional<Languages extends string> = Record<
  Numerals, {
    [k in Languages]?: string;
  }
>;
export type UniteNumeral<Languages extends string> = {
  [k in UniteNumerals]: {
    [k in Languages]?: string;
  };
};
export type NumeralAll<Languages extends string> = Numeral<Languages> |
  (UniteNumeral<Languages> & {
    [k in Numerals]?: never;
  }) |
  (UniteNumeral<Languages> & NumeralOptional<Languages>);
type NumeralDict<Languages extends string> = {
  [key: string]: NumeralDict<Languages> | NumeralAll<Languages>;
};

export type Dictionary<
  ProjectAvailableLanguages extends string = DefaultAvailableLanguages
> = {
  [key: string]: Dictionary<ProjectAvailableLanguages> |
  ({
    s?: LangDict<ProjectAvailableLanguages>;
  } & {
    n?: NumeralDict<ProjectAvailableLanguages>;
  });
};
export type InitializeI18n = {
  t: (
    frameworkLogger: FrameworkLogger,
    languageCode: string
  ) => (id: string[], params?: { num?: number; vars?: string[]; }) => string;
};
