import { Routes } from '@framework/core/types';

export const defaultRoutes = {
  empty: null,
};
export const defaultRouteNames = Object.keys(
  defaultRoutes
) as (keyof typeof defaultRoutes)[];
export type DefaultRouteNames = (typeof defaultRouteNames)[number];

export function buildAvailableRoutes<AvailableRoutes extends string>(
  routeNames: AvailableRoutes[]
): (DefaultRouteNames | AvailableRoutes)[] {
  return [...routeNames, ...defaultRouteNames] as const;
}

export function buildRoutes(routes: Routes) {
  return { ...routes, ...defaultRoutes };
}

export const defaultActions = {
  bck: null,
};
export const defaultActionNames = Object.keys(
  defaultActions
) as (keyof typeof defaultActions)[];
export type DefaultActionNames = (typeof defaultActionNames)[number];
