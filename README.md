# yau-ts

Built on top of [grammY](https://github.com/grammyjs/grammY)

## Why

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

- Can render messages and use state, see the demo below
- Has i18n built-in functionality

## Requirements

Using asdf plugin manager
`asdf install nodejs`

You must have Redis to keep user state

## A working bot example on the framework

You can find out what I build with the framework on <https://github.com/amadevstudio/chacma-bot>

## Simple demo example

Just use render to show your state, as well as other useful functions! The example shows the setup, i18n and how render method works.

- packages.json

```json
...
"dependencies": {
  "yau": "git+https://github.com/amadevstudio/yau"
}
...
```

- main.ts

```ts
import ENV from "./env";

import { makeRoutes } from "./controller/routes";

import configureI18n, { navigation } from "./public/i18n";
import { makeMiddlewares } from "./middleware/middlewares";
import { makeRepositories } from "./repository/repositories";
import { makeServices } from "./service/services";
import type { G } from "./controller/routeConsts";
import { setupI18n, type BotConfig, initializeBot } from "yau";

const fallbackLanguageCode = "en";

const i18n = setupI18n(configureI18n({ appName: ENV.APP_NAME }), {
  fallbackLanguageCode: fallbackLanguageCode,
});

const repositories = makeRepositories({ baseUrl: "http://localhost:3000" });
const services = makeServices({ repositories });
const middlewares = makeMiddlewares({ services });
const routes = makeRoutes({ services });

const botConfig: BotConfig<G> = {
  routes,
  defaultRoute: "menu",

  middlewares: middlewares,

  i18n,
  defaultTextGetters: {
    goBack: (languageCode) =>
      navigation.s.goBack[languageCode] ??
      navigation.s.goBack[fallbackLanguageCode],
  },

  testTelegram: ENV.TEST_TELEGRAM === "true",
  environment: ENV.ENVIRONMENT,
};

const bot = await initializeBot(ENV.BOT_TOKEN, ENV.REDIS_URL, botConfig);
bot.start();```

- i18n.ts

```ts
import type { Dictionary } from "yau";

export type AvailableLanguages = "ru" | "en";

export const navigation = {
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
        en: `Welcome to ${appName}! This is the /start answer`,
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
import { type Routes, buildRoutes } from "yau";
import type { MakeServices } from "../service/services";
import { makeUserEntryRoutes } from "./user/userEntryControllers";
import { makeControlledChannelsRoutes } from "./controlledChannels/controlledChannelsController";
import { type G, type LR } from "./routeConsts";

type MakeRoutes = (p: { services: ReturnType<MakeServices> }) => Routes<G>;

export const makeRoutes = ({
  services,
}: Parameters<MakeRoutes>[0]): ReturnType<MakeRoutes> => {
  const entryRoutes = makeUserEntryRoutes();
  const controlledChannelRoutes = makeControlledChannelsRoutes({ services });

  const localRoutes: LR = {
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
  return buildRoutes(localRoutes);
};
```

- routeConsts.ts

```ts
import {
  type ControllerConstructedParams,
  type LocalRoutes,
  buildEntityNamesMap,
  buildRoutesList,
} from "yau";
import type { AvailableLanguages } from "../public/i18n";

// Routes
export const localRouteNames = [
  "start",
  "menu",
  "deepMethod"
] as const;
type LocalRouteNames = (typeof localRouteNames)[number];

// Map to use in controllers
export const localRouteNameMap = buildEntityNamesMap(localRouteNames);
// Array to build types
const availableRoutes = buildRoutesList(localRouteNames);
console.log(availableRoutes);
export type AvailableRoutes = (typeof availableRoutes)[number];

// Actions
// TODO
type LocalActionNames = string;
type AvailableActions = LocalActionNames;

export type G = {
  AR: AvailableRoutes;
  AA: AvailableActions;
  AL: AvailableLanguages;
};

export type D = ControllerConstructedParams<G>;

export type LR = LocalRoutes<{
  AR: LocalRouteNames;
  AA: LocalActionNames;
  AL: G["AL"];
}>;
```

- entry.ts

```ts
import type { MessageStructure, ControllerConstructedParams, Route } from "yau";
import { localRouteNameMap, type G } from "../routeConsts";

type MenuData = {
  fromStart?: boolean;
};

type MakeUserEntryRoutes = () => {
  [key in "start" | "menu" | "terms"]: Route<G>["method"];
};

async function start(d: ConstructedParams) {
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

  await d.render(messages, { resending: d.isCommand });
}

async function menu(d: ConstructedParams) {
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
  await d.render(messages, { resending: d.isCommand });
}

async function deepMethod(d: ConstructedParams) {
  const messages: MessageStructure[] = [
    {
      type: "text",
      text: "Just goBack state",
      inlineMarkup: d.components.goBack.buildLayout(),
    },
  ] as const;
  await d.render(messages);
}



export function makeUserEntryRoutes(): ReturnType<MakeUserEntryRoutes> {
  return { start, menu, deepMethod };
}
```
