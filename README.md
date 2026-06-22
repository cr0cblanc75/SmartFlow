# Welcome to SmartFlow 👋

This is an [Expo](https://expo.dev) project.

## Get started

1. Install dependencies

    ```bash
    npm install
    ```

2. Start the app (don't forget to be in the right folder)

    ```bash
    npx expo start -c
    ```

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
│   └── HERE.js
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
