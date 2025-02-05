import { DefaultRouteNames, Routes } from 'core/types';

export const defaultRoutes = {
  $empty: null,
} as const;

export function buildEntityNamesMap<AvailableRoutes extends string>(
  entity: readonly AvailableRoutes[]
): {
  [key in DefaultRouteNames | AvailableRoutes]: key;
} {
  const defaultRouteKeys = Object.keys(defaultRoutes) as DefaultRouteNames[];
  const allKeys = [...entity, ...defaultRouteKeys] as (
    | AvailableRoutes
    | DefaultRouteNames
  )[];

  // Build the object with a broader type, then assert the final type
  const result = allKeys.reduce((acc, key) => {
    acc[key] = key; // No type error here
    return acc;
  }, {} as Record<string, string>);

  // Assert the final result to the correct mapped type
  return result as { [key in DefaultRouteNames | AvailableRoutes]: key };
}

export function buildRoutesList<AvailableRoutes extends string>(
  routeNames: readonly AvailableRoutes[]
): (DefaultRouteNames | AvailableRoutes)[] {
  return [
    ...routeNames,
    ...(Object.keys(defaultRoutes) as DefaultRouteNames[]),
  ] as const;
}

// ------
// Routes

export const defaultRouteNamesMap = buildEntityNamesMap(
  Object.keys(defaultRoutes) as DefaultRouteNames[]
);

export function buildRoutes(routes: Routes) {
  return { ...routes, ...defaultRoutes };
}

// -------
// Actions

export const defaultActions = {
  $back: null,
};

export type DefaultActionNames = keyof typeof defaultActions;

export const defaultActionNamesMap = buildEntityNamesMap(
  Object.keys(defaultActions) as DefaultActionNames[]
);

export function buildActionsList<AvailableActions extends string>(
  actionNames: AvailableActions[]
): (DefaultActionNames | AvailableActions)[] {
  return [
    ...actionNames,
    ...(Object.keys(defaultActions) as DefaultActionNames[]),
  ] as const;
}

export function buildActions(routes: Routes) {
  const actions = Object.values(routes)
    .map((route) => route?.actions ?? [])
    .flat();

  return { ...actions, ...defaultActions };
}
