# Welcome to SmartFlow 👋

This is an [Expo](https://expo.dev) project.

## Get started

1. Install dependencies

    ```bash
    npm install
    ```

<br>

2. Start the app (don't forget to be in the right folder)
   <br>
   If you start the app for the first time i recommand using (note that it can take up to 5 minutes to load the app the first time - do not be afraid of a loading process stopping for few minutes at 99%):

    ```bash
    npx expo start -c
    ```

    If you already have launch the app, and only want to see the result of some changement, use :

    ```bash
    npx expo start
    ```

<br>

3. Then you should see a QR_code in the terminal. Go at [ExpoGo]('https://expo.dev/go') and download on your mobile phone the latest version of the APK.

    ```bash
    SDK.56
    ```

Then scan the QR_code and see the result :)
<br>
<br>

## To know

The app is dynamicaly update. You don't need to relaunch everytime the code with the procedure above (starting at 2.). _Except if you have modify the backend - have fun guys_

<br><br>

## 📁 Architecture of the Projet

```
.
├── README.md
├── assets
│   └── images
├── scripts
│   └── HERE.js <-- to start the backend
├── src
│   ├── app
│   │   ├── _layout.tsx
│   │   ├── explore.tsx
│   │   └── index.tsx
│   ├── components
│   ├── constants
│   │   └── theme.ts
│   ├── global.css
│   └── hooks
│       ├── use-color-scheme.ts
│       ├── use-color-scheme.web.ts
│       └── use-theme.ts
├── app.json
├── package-lock.json
├── package.json
└── tsconfig.json
```

<br>

Do not touch to `global.css`, `/hooks`, `/constants`<br>
Do not touch to `app.json`, `package-lock.json`, `package.json`

Do not rename the folder, there name are absolute in this specific format.

> **IMPORTANT :**<br>
> Please do not try to modify `/components`. This folder contains basics components of the native react app. They will be very useful.

<br>

### Quick Reminer :

| Extension | Description               |
| --------- | ------------------------- |
| `.ts`     | TypeScript file           |
| `.tsx`    | React / React Native file |

A file starting with a `_` as `_layout.tsx`, is a specific system file.

## Backend additions (committed by Paul - 28/06/26)

This project now includes backend graph utilities in `scripts/dijkstra_timed.js` for the transport routing engine:

- `findStopsByName(nodes, name)` : find candidate stops by name, tolerant to typos (exact > starts-with > contains > fuzzy/Levenshtein fallback), without ever mixing precision tiers.
- `findPathTimed(graph, timetable, fromName, toName, options)` / `findPathTimedArrival(...)` : compute the fastest route between two stop names using real timetables, departing at or arriving by a given time.
- `findPathTimedByIds(graph, timetable, fromId, toId, options)` / `findPathTimedArrivalByIds(...)` : same routing, but on already-resolved stop IDs, so a specific stop picked via `findStopsByName` is never swapped for a similarly-named one.
- `isConnected(graph)` : check whether the network is globally connected.
- `getConnectedComponents(graph)` : detect isolated sub-networks.
- `buildNetworkTree(graph, rootId)` : build a BFS tree from a station, useful for network visualization.

These tools prepare the backend for frontend integration and support the core transport use cases before implementing schedules and user interface features.
