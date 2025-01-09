import { Routes } from '@framework/core/types';

export function buildEntityNamesMap<T extends string>(
  entity: Record<T, unknown>
): { [key in T]: T } {
  const arr = Object.keys(entity) as T[];

  return arr.reduce((acc, key) => {
    acc[key] = key;
    return acc;
  }, {} as Record<T, T>);
}

// ------
// Routes

export const defaultRoutes = {
  $empty: null,
};

export type DefaultRouteNames = keyof typeof defaultRoutes;

export const defaultRouteNamesMap = buildEntityNamesMap(defaultRoutes);

export function buildRoutesList<AvailableRoutes extends string>(
  routeNames: AvailableRoutes[]
): (DefaultRouteNames | AvailableRoutes)[] {
  return [
    ...routeNames,
    ...(Object.keys(defaultRoutes) as DefaultRouteNames[]),
  ] as const;
}

export function buildRoutes(routes: Routes) {
  return { ...routes, ...defaultRoutes };
}

// -------
// Actions

export const defaultActions = {
  $back: null,
};

export type DefaultActionNames = keyof typeof defaultActions;

export const defaultActionNamesMap = buildEntityNamesMap(defaultActions);

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
