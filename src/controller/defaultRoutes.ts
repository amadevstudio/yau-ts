import { Routes } from '@framework/core/types';

export function buildEntityNamesMap<AvailableRoutes extends string>(
  entity: readonly AvailableRoutes[]
): { [key in AvailableRoutes]: AvailableRoutes } {
  return entity.reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as Record<AvailableRoutes, AvailableRoutes>);
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

export const defaultRoutes = {
  $empty: null,
} as const;

export type DefaultRouteNames = keyof typeof defaultRoutes;

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
