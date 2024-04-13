# yau

Deep alpha version, can only send messages 

Using asdf plugin manager  
`asdf install nodejs`

Simple example
- main.ts
```ts
import dotenv from 'dotenv';

import ENV from './env';

import initializeBot from '@framework/core/botSetup';
import { TBotConfig } from '@framework/core/types';
import { routes, TAvailableRoutes } from './pkg/controller/routes';
import setupI18n from '@framework/i18n/setup';

import i18nConfig from './public/i18n';

dotenv.config();

const botConfig: TBotConfig<TAvailableRoutes> = {
  routes,
  testTelegram: ENV.TEST_TELEGRAM === 'true',
};

const i18n = setupI18n<'en'>(i18nConfig({ appName: ENV.APP_NAME }));

initializeBot(ENV.BOT_TOKEN, botConfig, i18n);
```
- i18n.ts
```ts
export default function ({ appName }: {appName: string}) {
  return {
    start: {
      message: {
        en: 'Welcome! This is the /start answer'
      },
    },
  };
}
```
- routes.ts
```ts
import { TRoutes } from '@framework/core/types';
import start from './user/start';

const availableRoutes = ['start'] as const;
export type TAvailableRoutes = (typeof availableRoutes)[number];
export const routes: TRoutes<TAvailableRoutes> = {
  start: {
    method: start,
    availableFrom: ['command'],
    routes: ['start'],
  },
};
```
- start.ts
```ts
import { TConstructedParams } from "@framework/core/types";

export default async function start(d: TConstructedParams) {
  await d.outerSender(d.chat.id, [{
    type: 'text',
    text: d.i18n.t(['start', 'message'])
  }]);
}
```
