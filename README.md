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
import ENV from "./env";

import initializeBot from "yau/src/core/botSetup";
import type { BotConfig } from "yau/src/core/types";
import {
  type AvailableActions,
  type AvailableRoutes,
  routes,
} from "./controller/routes";
import setupI18n from "yau/src/i18n/setup";

import configureI18n from "./public/i18n";

const i18n = setupI18n(configureI18n({ appName: ENV.APP_NAME }), {
  fallbackLanguageCode: "ru",
});

const botConfig: BotConfig<AvailableRoutes, AvailableActions> = {
  routes,
  defaultRoute: "start",

  i18n,
  defaultTextKeys: {
    goBack: ["navigation", "s", "goBack"],
  },

  testTelegram: ENV.TEST_TELEGRAM === "true",
  environment: ENV.ENVIRONMENT,
};

initializeBot(ENV.BOT_TOKEN, ENV.REDIS_URL, botConfig);
```

- i18n.ts

```ts
import type { Dictionary } from "yau/src/i18n/setup";

type AvailableLanguages = "ru";

const navigation = {
  s: {
    goBack: {
      en: "<< Go back",
      ru: "<< Назад",
    },
  },
};

function makeStart(appName: string) {
  return {
    s: {
      message: {
        // en: `Welcome to ${appName}! This is the /start answer`,
        ru: `Добро пожаловать в ${appName}`,
      },
    },
  };
}

export default function configureI18n({
  appName,
}: {
  appName: string;
}): Dictionary<AvailableLanguages> {
  return {
    navigation,

    start: makeStart(appName),
  };
}

```

- routes.ts

```ts
import type { Routes, LocalRoutes } from "yau/src/core/types";
import { start, menu, deepMethod } from "./user/entry";
import {
  buildRoutesList,
  buildRoutes,
  buildEntityNamesMap,
} from "yau/src/controller/defaultRoutes";

type LocalRouteNames = "start" | "menu" | "deepMethod";
type LocalActionNames = string;

const localRoutes: LocalRoutes<LocalRouteNames, LocalActionNames> = {
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

export const localRouteNameMap = buildEntityNamesMap(localRoutes);

const availableRoutes = buildRoutesList<LocalRouteNames>(
  Object.keys(localRoutes) as LocalRouteNames[]
);

console.log(availableRoutes);

export type AvailableRoutes = (typeof availableRoutes)[number];

export const routes: Routes<AvailableRoutes> = buildRoutes(localRoutes);

export type AvailableActions = LocalActionNames;
```

- start.ts

```ts
import type { MessageStructure } from "yau/src/controller/types";
import type { ConstructedParams } from "yau/src/core/types";
import { localRouteNameMap } from "../routes";

export async function start(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: d.i18n.t(["start", "s", "message"]),
      inlineMarkup: [
        [d.components.buildButton(localRouteNameMap.menu, "Open menu")],
        [
          d.components.buildButton(
            localRouteNameMap.deepMethod,
            "Or go deeper"
          ),
        ],
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
      inlineMarkup: [
        [d.components.buildButton(localRouteNameMap.deepMethod, "Deeper")],
      ],
    },
    {
      type: "text",
      text: "And there",
      inlineMarkup: d.components.goBack.buildLayout(),
    },
  ];
  d.render(messages, { resending: d.isCommand });
}

export async function deepMethod(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: "Just goBack state",
      inlineMarkup: d.components.goBack.buildLayout(),
    },
  ];
  d.render(messages);
}
```
