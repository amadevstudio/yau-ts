import { TeleCallback, TeleMessage } from '@framework/controller/types';
import { getCallbackType } from '@framework/service/stateDataService';
import { UsersStateService } from '@framework/service/userStateService';
import { Route } from './types';
import { defaultActionNamesMap } from '@framework/controller/defaultRoutes';

export function validateGoBack(callback: TeleCallback) {
  return getCallbackType(callback) === defaultActionNamesMap.$back;
}

// Curry validate commands for a route
export function initializeValidateCommands<
  AvailableRoutes extends string = string
>(commands: AvailableRoutes[]) {
  return function (command: AvailableRoutes) {
    return commands.includes(command);
  };
}

export function initializeValidateMessages<
  AvailableRoutes extends string = string
>(statesForInput: AvailableRoutes[], usersStateService: UsersStateService) {
  return async function (message: TeleMessage) {
    // Return if command
    if (
      message.text !== undefined &&
      message.text !== '' &&
      message.text[0] === '/'
    ) {
      return false;
    }

    const currentState = (await usersStateService.getUserCurrentState(
      message.chat.id
    )) as AvailableRoutes;
    if (currentState === null) {
      return false;
    }

    return statesForInput.includes(currentState);
  };
}

export function initializeValidateCallback<AvailableRoutes extends string>(
  route: AvailableRoutes
) {
  return function (callback: TeleCallback) {
    return getCallbackType(callback) === route;
  };
}

export function initializeValidateAction<
  AvailableRoutes extends string,
  AvailableActions extends string
>(
  routeName: AvailableRoutes,
  routeParams: Route,
  actionName: AvailableActions,
  usersStateService: UsersStateService
) {
  const callbackValidator = initializeValidateCallback(routeName);

  return async function (callback: TeleCallback) {
    // TODO: get chat id without message?
    if (callback.message?.chat.id === undefined) {
      return;
    }

    return (
      ((await usersStateService.getUserCurrentState(
        callback.message?.chat.id
      )) === routeName ||
        routeParams.actions?.[actionName]?.stateIndependent === true) &&
      callbackValidator(callback)
    );
  };
}
