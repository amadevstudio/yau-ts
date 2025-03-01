import { constructParams } from 'core/methodParams';
import { ConstructedServiceParams } from 'core/types';
import { defaultRouteNamesMap } from './defaultRoutes';

function devLog(d: ConstructedServiceParams, ...params: unknown[]) {
  if (d.botConfig.environment === 'development') {
    d.libParams.ctx.$frameworkLogger.debug(params);
  }
}

export async function correctEmptyStateInputState(d: ConstructedServiceParams) {
  const [prev, curr] =
    await d.services.usersStateService.getUserPreviousAndCurrentStates(
      d.chat.id
    );
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
    devLog(
      d,
      `States before state correction`,
      await d.services.usersStateService.getUserStates(d.chat.id)
    );

    await d.services.usersStateService.deleteUserCurrentState(d.chat.id);

    devLog(
      d,
      `States after state correction`,
      await d.services.usersStateService.getUserStates(d.chat.id)
    );
  }
}

export async function goBackProcessor(d: ConstructedServiceParams) {
  devLog(
    d,
    `States before goBack`,
    await d.services.usersStateService.getUserStates(d.chat.id)
  );

  const prev = await d.services.usersStateService.getUserPreviousState(
    d.chat.id
  );

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
      botId: d.botId,
      routeName: activePrev,
      botConfig: d.botConfig,
      libParams: d.libParams,
      storage: d.storage,
      isStepBack: true,
    })
  );

  // Clean state to new current
  const allStates = await d.services.usersStateService.getUserStates(d.chat.id);
  devLog(
    d,
    `Active prev route is ${activePrev}.`,
    'States after route launch',
    allStates
  );

  for (const state of allStates.reverse()) {
    if (state === activePrev) {
      break;
    }
    await d.services.usersStateService.deleteUserCurrentState(d.chat.id);
  }

  // Clean state data of unrelated previous states
  for (const childRoute of d.routes[activePrev]?.routes ?? []) {
    await d.services.usersStateService.deleteUserStateData(
      d.chat.id,
      childRoute
    );
  }

  devLog(
    d,
    `States after goBack:`,
    await d.services.usersStateService.getUserStates(d.chat.id)
  );
}
