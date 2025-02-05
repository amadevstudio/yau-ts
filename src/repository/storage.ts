import { createClient, RedisClientType } from 'redis';
import { CreateRedisRepository, StorageRepository } from './storageTypes';

// Create a Redis client and connect to the Redis instance
async function createStorageClient(redisUrl: string): Promise<RedisClientType> {
  return createClient({ url: redisUrl })
    .on('error', (err: Error) => console.error('Redis Client Error', err))
    .connect() as Promise<RedisClientType>;
}

// Redis Repository Functions
export const createRedisRepository: CreateRedisRepository = (client) => {
  // // Helper function to convert Buffer to string
  // const bufferToString = (data: Buffer | string | null): string | null => {
  //   if (data instanceof Buffer) {
  //     return data.toString('utf-8');
  //   }
  //   return data;
  // };

  // // Helper function to convert string to Buffer
  // const stringToBuffer = (data: string): Buffer => {
  //   return Buffer.from(data, 'utf-8');
  // };

  return {
    // // Get a range of elements from a list (always returns strings)
    // lrange: async (
    //   key: string,
    //   start: number,
    //   stop: number
    // ): Promise<string[]> => {
    //   const result = await client.lRange(key, start, stop, { asBuffer: true });
    //   return result.map(bufferToString) as string[];
    // },
    lrange: async (
      key: string,
      start: number,
      stop: number
    ): Promise<string[]> => {
      return client.lRange(key, start, stop);
    },

    // Get an element from a list by its index (always returns a string)
    lindex: async (key: string, index: number): Promise<string | null> => {
      return client.lIndex(key, index);
    },

    // Get the value of a hash field (always returns a string)
    hget: async (key: string, field: string): Promise<string | undefined> => {
      return client.hGet(key, field);
    },

    // Set the value of a hash field (accepts strings, converts to Buffer internally)
    hset: async (
      key: string,
      field: string,
      value: string
    ): Promise<number> => {
      return client.hSet(key, field, value);
    },

    // Append one or multiple values to a list (accepts strings, converts to Buffer internally)
    rpush: async (key: string, ...values: string[]): Promise<number> => {
      return client.rPush(key, values);
    },

    // Remove and get the last element in a list (always returns a string)
    rpop: async (key: string): Promise<string | null> => {
      return client.rPop(key);
    },

    // Delete a key
    delete: async (key: string): Promise<number> => {
      return client.del(key);
    },

    // Delete one or more hash fields
    hdel: async (key: string, ...fields: string[]): Promise<number> => {
      return client.hDel(key, fields);
    },

    // Get the value of a key (always returns a string)
    get: async (key: string): Promise<string | null> => {
      return client.get(key);
    },

    // Set the value of a key (accepts strings, converts to Buffer internally)
    set: async (key: string, value: string): Promise<string | null> => {
      return client.set(key, value);
    },

    // Close the Redis connection
    disconnect: async (): Promise<void> => {
      await client.quit();
    },
  };
};

// Initialize the Redis Repository
const initStorage = async (redisUrl: string): Promise<StorageRepository> => {
  const client = await createStorageClient(redisUrl);
  return createRedisRepository(client);
};

export default initStorage;
