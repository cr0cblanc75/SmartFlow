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

## 🗺️ Backend data — generate the transport graph

> **Important:** `scripts/graph.json` and `scripts/timetable.json` are **generated
> files** and are **NOT committed** (they are too large for GitHub — `graph.json`
> is over 100 MB). You must generate them once locally before the routing engine
> can work. They are rebuilt from the official Île-de-France Mobilités (IDFM) GTFS.

**1. Install dependencies** (the graph scripts need `papaparse` + `minimist`, both
already in `package.json`):

```bash
npm install
```

> On Windows, if `npm` is blocked by the PowerShell execution policy
> (`npm.ps1 cannot be loaded`), use `npm.cmd install` instead — `node` itself is
> not blocked.

**2. Download the IDFM GTFS** (~155 MB zip) and extract it into
`scripts/build_graph/gtfs/` (this folder is git-ignored):

```bash
# from the scripts/build_graph/ folder
# PowerShell:
Invoke-WebRequest -Uri "https://eu.ftp.opendatasoft.com/stif/GTFS/IDFM-gtfs.zip" -OutFile IDFM-gtfs.zip
Expand-Archive IDFM-gtfs.zip -DestinationPath gtfs
# (or with curl:  curl -L -o IDFM-gtfs.zip "https://eu.ftp.opendatasoft.com/stif/GTFS/IDFM-gtfs.zip")
```

The extracted folder must contain `stops.txt`, `routes.txt`, `trips.txt`,
`stop_times.txt`, `transfers.txt`.

**3. Generate `graph.json` and `timetable.json`:**

```bash
# from the scripts/build_graph/ folder
node --max-old-space-size=4096 gtfs_to_graph.js     --input ./gtfs --output ../graph.json
node --max-old-space-size=4096 gtfs_to_timetable.js --input ./gtfs --output ../timetable.json
```

> `stop_times.txt` is ~1.2 GB, so each script streams it and takes a few minutes.
> The `--max-old-space-size=4096` flag gives Node enough heap.

**4. Test the routing engine** (no app needed):

```bash
# from the scripts/ folder
node test_path.js "Nation" "Bastille" --time 08:30
node test_path.js "Nation" "Bastille" --arrive 09:00   # arrival-time search
```

You should see the itinerary with the real line number and direction, e.g.
`Ligne 1 dir. La Défense (Grande Arche) — 3 arrêt(s)`.

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
