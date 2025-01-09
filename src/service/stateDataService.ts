import { ButtonData, TeleCallback } from '@framework/controller/types';
import { UserStateService } from './userStateService';
import { DefaultActionNames } from '@framework/controller/defaultRoutes';

function decodeCallbackData(call: TeleCallback): ButtonData {
  if (call.data === undefined) {
    return {};
  }

  try {
    const callbackData = JSON.parse(call.data);

    return {
      ...callbackData,
    };
  } catch (e) {
    return {};
  }
}

async function getLocalStateData<AvailableRoutes extends string = string>(
  userStateService: UserStateService,
  state: AvailableRoutes | undefined
) {
  if (state === undefined) {
    return {};
  }

  return userStateService.getUserStateData(state);
}

function getCallbackData<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
>(
  callback: TeleCallback | undefined,
  route: AvailableRoutes | undefined,
  action: AvailableActions | undefined
) {
  let callbackData = callback === undefined ? {} : decodeCallbackData(callback);

  // If not action (route change, back, validations)
  if (action === undefined) {
    // Then only stateData for the same route should be taken into account
    if (callbackData.$tp != route) {
      callbackData = {};
    }
  }
  // If action, mix with state (below) removing 'tp'
  else {
    delete callbackData.$tp;
  }
  return callbackData;
}

export async function getUnitedData<
  AvailableRoutes extends string = string,
  AvailableActions extends string = string
>(
  callback: TeleCallback | undefined,
  userStateService: UserStateService,
  route: AvailableRoutes | undefined,
  action: AvailableActions | undefined
) {
  // # 1. Route change: route data (empty) + call (since tp is equal to route)
  // # 2. Action: route data + call (no tp, mutation)
  // # 3. Back: route data + call (empty, since tp does not measure route)
  // # 4. Validations: route data (empty or not) + call (empty if button is not route)

  const callbackData = getCallbackData<AvailableRoutes, AvailableActions>(
    callback,
    route,
    action
  );

  const stateData = await getLocalStateData(userStateService, route);

  return { ...stateData, ...callbackData };
}

export function getCallbackType<AvailableActions extends DefaultActionNames>(
  callback: TeleCallback
): AvailableActions {
  return decodeCallbackData(callback).$tp as AvailableActions;
}
