# yau

Alpha version, can render messages and use state, see the demo below

Using asdf plugin manager
`asdf install nodejs`

You must have Redis to keep user state

Simple demo example:

- packages.json

```json
"dependencies": {
  "yau": "git+https://github.com/amadevstudio/yau"
}
```

- main.ts

```ts
import dotenv from "dotenv";
import path from "path";
import ENV from "./env";

import initializeBot from "yau/src/core/botSetup";
import type { BotConfig } from "yau/src/core/types";
import { type AvailableRoutes, routes } from "./controller/routes";
import setupI18n from "yau/src/i18n/setup";

import configureI18n from "./public/i18n";

const dirname = path.resolve();
dotenv.config({ path: path.join(dirname, ".env") });

const i18n = setupI18n(
  configureI18n({ appName: ENV.APP_NAME }),
  { fallbackLanguageCode: "ru" });

const botConfig: BotConfig<AvailableRoutes> = {
  defaultRoute: 'menu',
  routes,
  testTelegram: ENV.TEST_TELEGRAM === "true",
  environment: ENV.ENVIRONMENT,
  i18n
};

initializeBot(ENV.BOT_TOKEN, ENV.REDIS_URL, botConfig);
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
import type { Routes } from "yau/src/core/types";
import { start, menu, deepMethod } from "./user/entry";
import {
  buildAvailableRoutes,
  buildRoutes,
} from "yau/src/controller/defaultRoutes";

const localRoutes: Routes = {
  start: {
    method: start,
    availableFrom: ["command"],
    routes: ["menu"],
  },
  menu: {
    method: menu,
    availableFrom: ["command", "callback"],
  },
  deepMethod: {
    method: deepMethod,
    availableFrom: ["callback"],
  },
};

const availableRoutes = buildAvailableRoutes<keyof typeof localRoutes>(
  Object.keys(localRoutes) as (keyof typeof localRoutes)[]
);

export type AvailableRoutes = (typeof availableRoutes)[number];

export const routes: Routes<AvailableRoutes> = buildRoutes(localRoutes);
```

- start.ts

```ts
import type { MessageStructure } from "yau/src/controller/types";
import type { ConstructedParams } from "yau/src/core/types";

export async function start(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: d.i18n.t(["start", "s", "message"]),
      inlineMarkup: [
        [{ text: "Open menu", data: { tp: "menu" } }],
        [{ text: "Or go deeper", data: { tp: "deepMethod" } }],
      ],
    },
  ];

  d.render(messages, { resending: d.isCommand });
}

export async function menu(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: "Hello there",
      inlineMarkup: [[{ text: "Deeper", data: { tp: "deepMethod" } }]],
    },
    {
      type: "text",
      text: "And there",
      inlineMarkup: [
        [
          {
            text: "Go back",
            data: { tp: "bck" },
          },
        ],
      ],
    },
  ];
  d.render(messages, { resending: d.isCommand });
}

export async function deepMethod(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: "Just goBack state",
      inlineMarkup: [[{ text: "Go back", data: { tp: "bck" } }]],
    },
  ];
  d.render(messages);
}

```
