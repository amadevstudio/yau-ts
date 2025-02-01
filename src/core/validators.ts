import { TeleCallback, TeleMessage } from 'controller/types';
import { getCallbackType } from 'service/stateDataService';
import { UsersStateService } from 'service/userStateService';
import { Route } from './types';
import { defaultActionNamesMap } from 'controller/defaultRoutes';

export function validateCommand(msg: string) {
  return msg[0] === '/';
}

export function validateGoBack(callback: TeleCallback) {
  return getCallbackType(callback) === defaultActionNamesMap.$back;
}

export function initializeValidateMessages<
  AvailableRoutes extends string = string
>(statesForInput: AvailableRoutes[], usersStateService: UsersStateService) {
  return async function (message: TeleMessage) {
    const currentState = (await usersStateService.getUserCurrentState(
      message.chat.id
    )) as AvailableRoutes;
    if (currentState === null) {
      return false;
    }

    return statesForInput.includes(currentState);
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
  return async function (callback: TeleCallback) {
    // TODO: get chat id without message?
    if (callback.message?.chat.id === undefined) {
      return;
    }

    return (
      // Current state
      (await usersStateService.getUserCurrentState(
        callback.message?.chat.id
      )) === routeName ||
      // or state independent action
      routeParams.actions?.[actionName]?.stateIndependent === true
    );
  };
}
