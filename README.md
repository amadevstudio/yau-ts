# yau-ts

## Why

The current implemented functionality already has the ability to render and a state system.

For example, imagine that you have a message sent to a user. You want to delete it and send two more. After 5 seconds, you want to delete these two and send new ones.

In telethon, aiogram, or node-telegram-bot-api, you need to write something like this:

```code
deleteMessage(id?)

id1 = sendMessage(type: "text", text: ..., markup: ..., )
id2 = sendMessage(type: "text", text: ...)

sleep(5)

// And you should save ids if it's a different handler.
deleteMessage(id1)
deleteMessage(id2)

sendMessage(type: text "", text: ...)
sendMessage(type: text "", text: ...)
```

The idea of the project is simple rendering, the previous state is processed automatically.:

```ts
d.render([
  {type: 'text', text: ..., markup: {}},
  {type: 'text', text: ...}])
sleep(5)
d.render([
  {type: 'text', text: ...},
  {type: 'text', text: ...}])
```

You don't need to know the details of the state or the telegram. You just need to declare the routes and call the render.

### Planned features

- automate media caching;
- menus, pagination;
- ability to send big files;
- and many more.

## Alpha version

Can render messages and use state, see the demo below

## Requirements

Using asdf plugin manager
`asdf install nodejs`

You must have Redis to keep user state

## Simple demo example

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

- entry.ts

```ts
import type { MessageStructure } from "yau/src/controller/types";
import type { ConstructedParams } from "yau/src/core/types";
import { localRouteNameMap } from "../routes";

type MenuData = {
  someData?: string;
};

export async function start(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: d.i18n.t(["start", "s", "message"]),
      inlineMarkup: [
        [
          d.components.buildButton(localRouteNameMap.menu, "Open menu", {
            someData: "Some data",
          } as MenuData),
        ],
        [
          d.components.buildButton(
            localRouteNameMap.deepMethod,
            "Or go deeper"
          ),
        ],
      ],
    },
  ] as const;

  return d.render(messages, { resending: d.isCommand });
}

export async function menu(d: ConstructedParams) {
  const data = d.unitedData as MenuData;

  const messages: MessageStructure[] = [
    {
      type: "text",
      text: data.someData ? "Hello there with " + data.someData : "Hello there",
      inlineMarkup: [
        [d.components.buildButton(localRouteNameMap.deepMethod, "Deeper")],
      ],
    },
    {
      type: "text",
      text: "And there",
      inlineMarkup: d.components.goBack.buildLayout(),
    },
  ] as const;
  return d.render(messages, { resending: d.isCommand });
}

export async function deepMethod(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: "Just goBack state",
      inlineMarkup: d.components.goBack.buildLayout(),
    },
  ] as const;
  return d.render(messages);
}
```
