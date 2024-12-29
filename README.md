# yau

Deep alpha version, can only send messages  

Using asdf plugin manager  
`asdf install nodejs`

Simple example

- main.ts

```ts
import dotenv from 'dotenv';
import path from 'path';

const dirname = path.resolve();
dotenv.config({ path: path.join(dirname, '.env') });

import ENV from './env';

import initializeBot from '@framework/core/botSetup';
import { BotConfig } from '@framework/core/types';
import { routes, AvailableRoutes } from './pkg/controller/routes';
import setupI18n from '@framework/i18n/setup';

import configureI18n from './public/i18n';

const i18n = setupI18n(
  configureI18n<'en'>({ appName: ENV.APP_NAME })
);

const botConfig: BotConfig<AvailableRoutes> = {
  routes,
  testTelegram: ENV.TEST_TELEGRAM === 'true',
  i18n,
};

initializeBot(ENV.BOT_TOKEN, botConfig);
```

- i18n.ts

```ts
import { Dictionary } from '@framework/i18n/setup';

export default function <AvailableLanguages extends string = string>({
                                                                       appName,
                                                                     }: {
  appName: string;
}): Dictionary<AvailableLanguages> {
  return {
    start: {
      s: {
        message: {
          en: `Welcome to ${appName}! This is the /start answer. We have `,
        },
      },
      n: {
        message: {
          singular: {
            en: '{0} star',
          },
          unite: {
            en: '{0} stars'
          }
        }
      }
    },
  };
}
```

- routes.ts

```ts
import { Routes } from '@framework/core/types';
import start from './user/start';

const availableRoutes = ['start'] as const;
export type AvailableRoutes = (typeof availableRoutes)[number];
export const routes: Routes<AvailableRoutes> = {
  start: {
    method: start,
    availableFrom: ['command'],
    routes: ['start'],
  },
};
```

- start.ts

```ts
import { ConstructedParams } from "@framework/core/types";

export default async function start(d: ConstructedParams) {
  await d.outerSender(d.chat.id, [{
    type: 'text',
    text: d.i18n.t(['start', 's', 'message']) + d.i18n.t(['start', 'n', 'message'], { num: 2, vars: ["2"] })
  }]);
}
```
