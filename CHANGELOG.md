# Changelog

## 4.0.0

- Publish modern ESM and CommonJS package exports ([#22](https://github.com/marmelab/ra-auth-msal/pull/22)) ([pysnooLab](https://github.com/pysnooLab))

### Breaking Changes

`ra-auth-msal` now publishes its ES modules and CommonJS builds in `dist/`, behind an [`exports`](https://nodejs.org/api/packages.html#package-entry-points) map. Only the package root can be imported, so these undocumented paths no longer resolve:

- the old build folders: `ra-auth-msal/lib/*` and `ra-auth-msal/esm/*`
- the sources: `ra-auth-msal/src/*`, even though they are still published
- the manifest: `ra-auth-msal/package.json`

Import from `ra-auth-msal` instead. `defaultTokenRequest` and `initializeMsalInstance`, previously only reachable through these paths, are now exported from the package root.

The published code now targets ES2020 instead of ES5, so it no longer runs in browsers without ES2020 support, such as Internet Explorer 11.

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
