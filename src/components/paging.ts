import type { InlineMarkupButton } from 'controller/types';
import type {
  BotConfig,
  ControllerConstructedParams,
  FrameworkGenerics,
  I18n,
  SpecialStateKeywords,
  UserStateService,
} from 'core/types';
import type { ButtonData } from '../controller/types';

const DEFAULT_PER_PAGE = 5;

function recognizePage(
  unitedData: ButtonData | Record<string | SpecialStateKeywords, unknown>,
  messageText?: string
) {
  const pInMessage = !isNaN(Number(messageText))
    ? Number(messageText)
    : undefined;
  const p = pInMessage ?? (unitedData[pageFieldName] as number) ?? 1;
  if (p < 1) {
    return 1;
  }
  return p;
}

function recognizeSearch(
  unitedData: ButtonData | Record<string | SpecialStateKeywords, unknown>,
  messageText?: string
) {
  const sInMessage = isNaN(Number(messageText)) ? messageText : undefined;
  const s =
    sInMessage ??
    (unitedData[searchFieldName] === false ||
    unitedData[searchFieldName] === undefined
      ? undefined
      : (unitedData[searchFieldName] as string));
  return s;
}

type BuildSetup<G extends FrameworkGenerics = FrameworkGenerics> =
  ControllerConstructedParams<G>['components']['paging']['buildSetup'];

export function makePaging<G extends FrameworkGenerics = FrameworkGenerics>({
  type,
  getDefaultText,
  userStateService,
  i18n,
  unitedData,
  messageText,
  defaultPerPage,
  buildPageButton,
  buildGoBackButton,
  buildClearSearchButton,
}: {
  type: G['AR'];
  getDefaultText?: BotConfig<G>['defaultTextGetters'];
  userStateService: UserStateService<G['AR']>;
  i18n: I18n<G['AL']>;
  unitedData: ButtonData | Record<string, unknown>;
  messageText?: string;
  defaultPerPage?: number;
  buildPageButton: (p: {
    type: G['AR'];
    page: number;
    text: string;
  }) => InlineMarkupButton<G['AR'], G['AA']>;
  buildGoBackButton: (
    customText?: string
  ) => InlineMarkupButton<G['AR'], G['AA']>;
  buildClearSearchButton: (p: {
    type: G['AR'];
    text: string;
  }) => InlineMarkupButton<G['AR'], G['AA']>;
}) {
  const fs: { buildSetup: BuildSetup<G> } = {
    buildSetup: async <ResultData, ErrorType>({
      loadPageData,
      loadCount,
      overwritePerPage,
      customGoBackText,
    }: Parameters<BuildSetup<G>>[0]) => {
      // Settings
      const currentPage = recognizePage(unitedData, messageText);
      const perPage = overwritePerPage ?? defaultPerPage ?? DEFAULT_PER_PAGE;

      const searchQuery = recognizeSearch(unitedData, messageText);
      const isSearchEnabled = searchQuery !== undefined;

      // Load count and check if there is any data
      const count = await loadCount({ searchQuery: searchQuery });
      if (typeof count === 'object' && 'error' in count)
        return count as { error: ErrorType };
      if (count === 0) {
        return isSearchEnabled
          ? { error: 'noDataFoundInSearch' }
          : { error: 'noDataFound' };
      }

      // Calculate pages count and limit current page to max page
      const pagesCount = Math.ceil(count / perPage);
      const limitedCurrentPage =
        currentPage > pagesCount ? pagesCount : currentPage;

      // Calculate offset and load data
      const offset = perPage * (limitedCurrentPage - 1);
      const data = await loadPageData({
        offset,
        page: limitedCurrentPage,
        perPage,
        searchQuery,
      });
      if (typeof data === 'object' && 'error' in data)
        return data as { error: ErrorType };

      // Build helper message
      const helperMessage = getDefaultText?.paging?.navigationHelper
        ? i18n.t(getDefaultText.paging.navigationHelper(i18n.languageCode), {
            num: limitedCurrentPage,
            vars: [String(limitedCurrentPage), String(pagesCount)],
          })
        : `Page ${limitedCurrentPage} of ${pagesCount}`;
      const clearSearchText = getDefaultText?.paging?.clearSearch
        ? i18n.t(getDefaultText.paging.clearSearch(i18n.languageCode))
        : 'Clear search';

      // Build markup
      const prevPage = limitedCurrentPage - 1;
      const nextPage = limitedCurrentPage + 1;
      const markup = [
        ...(isSearchEnabled
          ? [[buildClearSearchButton({ type, text: clearSearchText })]]
          : []),
        [
          buildPageButton(
            prevPage > 0
              ? { type, page: prevPage, text: '<' }
              : { type, page: 1, text: '-' }
          ),
          buildGoBackButton(customGoBackText),
          buildPageButton(
            nextPage <= pagesCount
              ? { type, page: nextPage, text: '>' }
              : { type, page: pagesCount, text: '-' }
          ),
        ],
      ];

      // Update user state
      await userStateService.addUserStateData(type, {
        [pageFieldName]: limitedCurrentPage,
        [searchFieldName]: searchQuery,
      });

      return {
        currentPage: limitedCurrentPage,
        pageData: data as ResultData[],
        helperMessage,
        markup: markup,
      };
    },
  } as const;
  return fs;
}
