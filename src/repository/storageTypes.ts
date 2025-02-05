import { RedisClientType } from "redis";
import { createRedisRepository } from "./storage";

export type RedisRepository = {
  lrange: (key: string, start: number, stop: number) => Promise<string[]>;
  lindex: (key: string, index: number) => Promise<string | null>;
  hget: (key: string, field: string) => Promise<string | undefined>;
  hset: (key: string, field: string, value: string) => Promise<number>;
  rpush: (key: string, ...values: string[]) => Promise<number>;
  rpop: (key: string) => Promise<string | null>;
  delete: (key: string) => Promise<number>;
  hdel: (key: string, ...fields: string[]) => Promise<number>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<string | null>;
  disconnect: () => Promise<void>;
};

export type CreateRedisRepository = (
  client: RedisClientType
) => RedisRepository;// Type for the Redis Repository

export type StorageRepository = ReturnType<typeof createRedisRepository>;

