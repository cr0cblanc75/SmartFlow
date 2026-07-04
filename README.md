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

## Once in the App

You will of course have to create an account before behing able to proceed into the application.

<br><br>

## 📁 Architecture of the Projet

```
.
├── README.md
├── TODO.md
├── assets
│       └── Assets
├── scripts
│   ├── acpm.json
│   ├── back_path.js
│   ├── build_graph
│   │   ├── graph_analysis.js
│   │   ├── gtfs_to_graph.js
│   │   └── gtfs_to_timetable.js
│   ├── eco_calculator.js
│   ├── graph.json
│   └── timetable.json
│
│
│
│
├── src
│   ├── app
│   │   ├── (main)
│   │   │   ├── home_map.tsx
│   │   │   ├── path.tsx
│   │   │   └── waypoints.tsx
│   │   ├── (profile)
│   │   │   └── profile_page.tsx
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── inscription.tsx
│   │   ├── inscription_validated.tsx
│   │   └── login.tsx
│   │
│   │
│   ├── components
│   │   ├── AnimatedScreen.tsx
│   │   ├── animated-icon.module.css
│   │   ├── animated-icon.tsx
│   │   ├── animated-icon.web.tsx
│   │   ├── app-tabs.tsx
│   │   ├── external-link.tsx
│   │   ├── hint-row.tsx
│   │   ├── path
│   │   │   └── path.tsx
│   │   ├── themed-text.tsx
│   │   ├── themed-view.tsx
│   │   ├── ui
│   │   │   └── collapsible.tsx
│   │   └── waypoints
│   │       └── waypoints_frame.tsx
│   ├── constants
│   │   └── theme.ts
│   ├── data
│   │   └── waypoints.js
│   ├── global.css
│   ├── hooks
│   │   ├── themeContext.tsx
│   │   ├── use-color-scheme.ts
│   │   ├── use-color-scheme.web.ts
│   │   └── use-theme.ts
│   └── leaflet
│       └── leaflet.tsx
│
│
├── app.json
├── package-lock.json
├── package.json
└── tsconfig.json

```
