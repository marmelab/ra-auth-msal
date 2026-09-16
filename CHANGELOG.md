# Changelog

## 4.0.0

- Upgrade `@azure/msal-browser` to v5 (from v3, crossing both the v4 and the v5 major)
- Upgrade the `react-admin` floor to v5.15, and support React 19 alongside React 18
- Widen the `msalInstance` parameter type to `IPublicClientApplication`, so instances built with the
  v5 `createStandardPublicClientApplication()` factory are accepted as well as `new PublicClientApplication()`
- Modernise the toolchain: ESLint 10 flat config (the repository previously had no ESLint config at all,
  so `yarn lint` could not run), Jest 30, TypeScript 6. Node >= 20.19 is now required, recorded in `engines`
- Add a unit test suite for the auth provider (the repository previously had none)
- [Demo] Upgrade to Vite 8, React 19, react-router 7 and MUI 9, and replace the deprecated
  `@vitejs/plugin-react-refresh` with `@vitejs/plugin-react`

### Breaking Changes

#### `navigateToLoginRequestUrl` moved from `msalConfig` to `msalAuthProvider`

MSAL v5 removed `auth.navigateToLoginRequestUrl` from the configuration object and moved it to
`handleRedirectPromise`, which `ra-auth-msal` calls internally. It is therefore now an option of
`msalAuthProvider`, and it still defaults to the value this library has always needed (`false`),
because react-admin already handles that navigation.

Deleting the option from your config is **not** enough: MSAL defaults it to `true`, so leaving it
unset would change behaviour.

```diff
// in src/authConfig.js
export const msalConfig = {
  auth: {
    clientId: "12345678-1234-1234-1234-123456789012",
    authority: "https://login.microsoftonline.com/common",
    redirectUri: "http://localhost:8080/auth-callback",
-   // We need to disable this feature because it is already handled by react-admin, and would otherwise conflict
-   navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
-   storeAuthStateInCookie: false,
  },
};
```

If you had explicitly set `navigateToLoginRequestUrl: true`, pass it to the provider instead:

```diff
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
+ navigateToLoginRequestUrl: true,
});
```

#### Removed `cache` options

MSAL v5 deleted `storeAuthStateInCookie`, `secureCookies`, `temporaryCacheLocation`,
`claimsBasedCachingEnabled` and `cacheMigrationEnabled` from `CacheOptions`. They were already
deprecated in v4. `cacheLocation` is unaffected. Remove any of them from your `msalConfig`.

#### MSAL error messages are no longer descriptive

To shrink its bundle, MSAL v5 replaced error messages with a documentation link
(`See https://aka.ms/msal.js.errors#<error_code> for details`). If you render MSAL errors to your
users, branch on `error.errorCode` rather than `error.message`.

#### Encrypted `localStorage` (inherited from the v4 major)

Since MSAL v4, auth artifacts stored in `localStorage` are encrypted with a key held in a session
cookie, so they no longer survive a browser restart. This only affects you if you set
`cacheLocation: "localStorage"`; the default and the demo use `sessionStorage`.

### Known limitation: Cross-Origin-Opener-Policy and the redirect bridge

The headline feature of MSAL v5 is a "redirect bridge" that relays auth responses over a
`BroadcastChannel`, added because Entra ID now serves COOP headers that break the classic
popup/iframe response channel. `ra-auth-msal` does not set one up, and does not need one for the
redirect flow it uses: the response is processed directly by the page your `redirectUri` points at.

One case does degrade: when the refresh token has expired, `acquireTokenSilent` falls back to a
hidden iframe, which cannot return its response without a bridge. Users are then redirected to the
login page instead of being renewed silently. Setting up a redirect bridge is tracked as follow-up
work; see the [MSAL redirect bridge guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/redirect-bridge.md).

## 3.1.0

- Simplity `authProvider` setup ([#19](https://github.com/marmelab/ra-auth-msal/pull/19)) ([djhi](https://github.com/djhi))

## 3.0.2

* Fix DeepLinkRedirect feature ([#18](https://github.com/marmelab/ra-auth-msal/pull/18)) ([erwanMarmelab](https://github.com/erwanMarmelab))

## 3.0.1

* Fix `uninitialized_public_client_application` and `interaction_in_progress` errors ([#16](https://github.com/marmelab/ra-auth-msal/pull/16)) ([benin-work](https://github.com/benin-work))
* [Demo] Improve demo setup ([#17](https://github.com/marmelab/ra-auth-msal/pull/17)) ([djhi](https://github.com/djhi))

## 3.0.0

-   Upgrade `@azure/msal-browser` to v3
   
### Breaking Changes

In MSAL v3.x, you must initialize the application object by calling the `initialize` function asynchronously.

One way to achieve this is by using the `useEffect` hook in your main component:

```diff
// in src/App.jsx
-import React from 'react';
+import React, { useEffect } from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider } from "ra-auth-msal";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);

const App = () => {
+ const [isMSALInitialized, setMSALInitialized] = React.useState(false);
+ useEffect(() => {
+   myMSALObj.initialize().then(() => {
+     setMSALInitialized(true);
+   });
+ }, []);

  const authProvider = msalAuthProvider({
    msalInstance: myMSALObj,
  });

+ if (!isMSALInitialized) {
+   return <div>Loading...</div>;
+ }

  return (
    <BrowserRouter>
       <Admin
           authProvider={authProvider}
           dataProvider={dataProvider}
           title="Example Admin"
           loginPage={LoginPage}
        >
            <Resource name="posts" {...posts} />
      </Admin>
    </BrowserRouter>
   );
};
export default App;
```

See the MSAL [upgrade guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v2-migration.md) for more information.

## 2.0.0

-   Upgrade `react-admin` to v5
-   Remove prop-types

# 1.2.0

* Add support for deep link redirect ([#9](https://github.com/marmelab/ra-auth-msal/pull/9) ([jonathan-marmelab](https://github.com/jonathan-marmelab)))

# 1.1.0

* Add support for automatic token refresh ([#7](https://github.com/marmelab/ra-auth-msal/pull/7)) ([djhi](https://github.com/djhi))
* Suppress error message when redirecting to login after unsuccessful auth ([#6](https://github.com/marmelab/ra-auth-msal/pull/6)) ([MarkSFrancis](https://github.com/MarkSFrancis))
* [Doc] Improve `msalHttpClient` documentation ([#3](https://github.com/marmelab/ra-auth-msal/pull/3)) ([slax57](https://github.com/slax57))

## 1.0.0

* Initial release
