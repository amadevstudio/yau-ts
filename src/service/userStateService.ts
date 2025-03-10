import { defaultRouteNamesMap } from 'controller/defaultRoutes';
import { ResultMessageStructure } from 'controller/types';
import { UsersStateService, UserStateService } from 'core/types';
import { getAllValues } from 'lib/objects';
import { StorageRepository } from 'repository/storageTypes';

type StateFunctionChatIdParam = string | number;
type StateFunction = (chatId: StateFunctionChatIdParam) => string;

const baseKeys: {
  [key in
    | 'states'
    | 'stateData'
    | 'resendFlag'
    | 'messageStructures']: StateFunction;
} = {
  states: (chatId: StateFunctionChatIdParam) => `users:${chatId}:states`,
  stateData: (chatId: StateFunctionChatIdParam) => `users:${chatId}:stateData`,
  resendFlag: (chatId: StateFunctionChatIdParam) =>
    `users:${chatId}:resendFlag`,
  messageStructures: (chatId: StateFunctionChatIdParam) =>
    `users:${chatId}:messageStructures`,
};

function getAllBaseKeys() {
  return getAllValues(baseKeys) as StateFunction[];
}

export function makeUsersStateService<AvailableRoutes extends string = string>({
  storage,
}: {
  storage: StorageRepository;
}): UsersStateService<AvailableRoutes> {
  return {
    getUserStates: async (chatId) => {
      return storage.lrange(baseKeys.states(chatId), 0, -1) as Promise<
        AvailableRoutes[]
      >;
    },
    getUserCurrentState: async (chatId) => {
      return storage.lindex(
        baseKeys.states(chatId),
        -1
      ) as Promise<AvailableRoutes | null>;
    },
    getUserPreviousState: async (chatId) => {
      return storage.lindex(
        baseKeys.states(chatId),
        -2
      ) as Promise<AvailableRoutes | null>;
    },
    getUserPreviousAndCurrentStates: async (chatId) => {
      const [prev, curr] = await storage.lrange(
        baseKeys.states(chatId),
        -2,
        -1
      );
      if (curr === undefined) {
        return [curr, prev] as (AvailableRoutes | undefined)[]; // if current is undefined, it could be ["current", undefined]
      }

      return [prev, curr] as (AvailableRoutes | undefined)[];
    },
    deleteUserCurrentState: async (chatId) => {
      return storage.rpop(
        baseKeys.states(chatId)
      ) as Promise<AvailableRoutes | null>;
    },
    deleteUserStateData: async (chatId, state) => {
      return storage.hdel(baseKeys.stateData(chatId), state);
    },
  } as const;
}

export default function makeUserStateService<
  AvailableRoutes extends string = string
>({
  storage,
  chatId,
  currentState,
}: {
  storage: StorageRepository;
  chatId: number;
  currentState: AvailableRoutes;
}): UserStateService<AvailableRoutes> {
  const usersStateService = makeUsersStateService<AvailableRoutes>({ storage });

  const methods: UserStateService<AvailableRoutes> = {
    //  User repo remover

    clearUserStorage: async (): Promise<void> => {
      const storageKeyValues = getAllBaseKeys();

      for (const keyFunction of storageKeyValues) {
        await storage.delete(keyFunction(chatId));
      }
    },

    // User state, getters

    getUserStates: async () => {
      return usersStateService.getUserStates(chatId);
    },

    getUserCurrentState: async () => {
      return usersStateService.getUserCurrentState(chatId);
    },

    getUserPreviousState: async () => {
      return usersStateService.getUserPreviousState(chatId);
    },

    getUserPreviousAndCurrentStates: async () => {
      return usersStateService.getUserPreviousAndCurrentStates(chatId);
    },

    getUserStateData: async (
      state: string
    ): Promise<Record<string, unknown>> => {
      const stateData = await storage.hget(baseKeys.stateData(chatId), state);
      if (stateData === undefined) {
        return {};
      }

      return JSON.parse(stateData);
    },

    // User state, setters

    addUserState: async (
      state: AvailableRoutes
    ): Promise<number | undefined> => {
      const [prev, curr] = await methods.getUserPreviousAndCurrentStates();
      if (
        curr === state ||
        (curr == defaultRouteNamesMap.$empty && prev === state)
      ) {
        return;
      }

      return storage.rpush(baseKeys.states(chatId), state);
    },

    addUserEmptyState: async (): Promise<number | undefined> => {
      const curr = await methods.getUserCurrentState();
      if (curr === defaultRouteNamesMap.$empty) {
        return;
      }

      return storage.rpush(
        baseKeys.states(chatId),
        defaultRouteNamesMap.$empty
      );
    },

    addUserStateData: async (
      state: string,
      data: Record<string, unknown>
    ): Promise<number> => {
      return storage.hset(
        baseKeys.stateData(chatId),
        state,
        JSON.stringify(data)
      );
    },

    addUserCurrentStateData: async (
      data: Record<string, unknown>
    ): Promise<number> => {
      if (currentState === undefined) {
        throw new Error('Current state is undefined');
      }

      return storage.hset(
        baseKeys.stateData(chatId),
        currentState,
        JSON.stringify(data)
      );
    },

    // User state, removers

    deleteUserCurrentState: async () => {
      return usersStateService.deleteUserCurrentState(chatId);
    },

    deleteUserStates: async (): Promise<number> => {
      return storage.delete(baseKeys.states(chatId));
    },

    deleteUserStateData: async (state: string): Promise<number> => {
      return usersStateService.deleteUserStateData(chatId, state);
    },

    deleteUserStatesData: async (): Promise<void> => {
      storage.delete(baseKeys.stateData(chatId));
    },

    // Resend flag
    getUserResendFlag: async (): Promise<boolean> => {
      return (await storage.get(baseKeys.resendFlag(chatId))) === 'true';
    },
    setUserResendFlag: async (resend?: boolean): Promise<void> => {
      await storage.set(
        baseKeys.resendFlag(chatId),
        (resend ?? true).toString()
      );
    },
    deleteUserResendFlag: async (): Promise<number> => {
      return await storage.delete(baseKeys.resendFlag(chatId));
    },

    // Message structures

    getUserMessageStructures: async (): Promise<ResultMessageStructure[]> => {
      const messageStructures = await storage.get(
        baseKeys.messageStructures(chatId)
      );
      if (messageStructures === null) {
        return [];
      }

      const messageStructuresDecoded = JSON.parse(messageStructures);
      for (const messageStructure of messageStructuresDecoded) {
        messageStructure.id = parseInt(messageStructure.id, 10);
      }

      return messageStructuresDecoded;
    },

    setUserMessageStructures: async (
      messageStructures: ResultMessageStructure[]
    ): Promise<void> => {
      storage.set(
        baseKeys.messageStructures(chatId),
        JSON.stringify(messageStructures)
      );
    },
  } as const;

  return methods;
}
