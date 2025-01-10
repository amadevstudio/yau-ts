import { constructParams } from '@framework/core/methodParams';
import { ConstructedServiceParams } from '@framework/core/types';
import { DefaultRouteNames, defaultRouteNamesMap } from './defaultRoutes';

export async function correctEmptyStateInputState(d: ConstructedServiceParams) {
  const [prev, curr] =
    (await d.services.userStateService.getUserPreviousAndCurrentStates()) as DefaultRouteNames[];
  if (prev === undefined) {
    return;
  }

  let someoneHasStateForInput: boolean = false;

  for (const [, routeParams] of Object.entries(d.routes)) {
    if (routeParams === null) {
      continue;
    }

    if (routeParams.statesForInput?.includes(prev)) {
      someoneHasStateForInput = true;
      break;
    }
  }

  // (Prev waits for input or someone waits for input when prev is active) and empty is curr
  if (
    (d.routes[prev]?.waitsForInput || someoneHasStateForInput) &&
    curr === defaultRouteNamesMap.$empty
  ) {
    if (d.botConfig.environment === 'development') {
      d.libParams.logger.debug(
        `States before state correction`,
        await d.services.userStateService.getUserStates()
      );
    }

    await d.services.userStateService.deleteUserCurrentState();

    if (d.botConfig.environment === 'development') {
      d.libParams.logger.debug(
        `States after state correction`,
        await d.services.userStateService.getUserStates()
      );
    }
  }
}

export async function goBackProcessor(d: ConstructedServiceParams) {
  if (d.botConfig.environment === 'development') {
    d.libParams.logger.debug(
      `States before goBack`,
      await d.services.userStateService.getUserStates()
    );
  }

  const prev = await d.services.userStateService.getUserPreviousState();

  // TODO: const activePrev = customPrev === undefined ? prev : customPrev;
  const activePrev = prev;

  if (activePrev === null) {
    // TODO: show an error?
    return;
  }

  const method = d.routes[activePrev]?.method;
  if (method === undefined) {
    // TODO: show an error?
    return;
  }

  // Run the method
  method(
    await constructParams({
      bot: d.bot,
      routeName: activePrev,
      botConfig: d.botConfig,
      libParams: d.libParams,
      storage: d.storage,
      isStepBack: true,
    })
  );

  // Clean state to new current
  const allStates = await d.services.userStateService.getUserStates();
  for (const state of allStates.reverse()) {
    if (state === activePrev) {
      break;
    }
    await d.services.userStateService.deleteUserCurrentState();
  }

  // Clean state data of unrelated previous states
  for (const childRoute of d.routes[activePrev]?.routes ?? []) {
    await d.services.userStateService.deleteUserStateData(childRoute);
  }

  if (d.botConfig.environment === 'development') {
    d.libParams.logger.debug(
      `States after goBack`,
      await d.services.userStateService.getUserStates()
    );
  }
}
