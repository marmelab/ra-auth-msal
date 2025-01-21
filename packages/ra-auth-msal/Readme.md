# ra-auth-msal

An auth provider for [react-admin](https://github.com/marmelab/react-admin) that handles authentication using the [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/fr-fr/azure/active-directory/develop/msal-overview).

This is useful when using [Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/) to authenticate your users.

This package provides:

-   An `msalAuthProvider` function to get the auth provider
-   An `msalHttpClient` helper to get a `fetch`-like function that adds the access token to the request
-   A custom `LoginPage` component that displays a loading indicator if the redirection takes too long

## Supported MSAL Features

- Sign-in using any authentication flow supported by MSAL for Single Page Apps ([Authorization Code](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows#authorization-code) and [Implicit Grant](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows#implicit-grant)), with the ability to configure the scopes and optional claims
- Get an access token for the user, with the ability to configure the scopes and optional claims, allowing for instance to query a [Microsoft Graph](https://learn.microsoft.com/en-us/graph/overview) endpoint
- Use the user's roles and groups to compute permissions
- Automatic token refresh

## Installation

```sh
yarn add ra-auth-msal
# or
npm install --save ra-auth-msal
```

## Basic Usage

```jsx
// in src/authConfig.js
export const msalConfig = {
  auth: {
    // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    clientId: "12345678-1234-1234-1234-123456789012",
    // Full directory URL, in the form of https://login.microsoftonline.com/<tenant-id>
    authority: "https://login.microsoftonline.com/common",
    // Full redirect URL, in form of http://localhost:8080/auth-callback
    redirectUri: "http://localhost:8080/auth-callback",
    // We need to disable this feature because it is already handled by react-admin, and would otherwise conflict
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider } from "ra-auth-msal";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
});

const App = () => {
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

**Tip:** You need to wrap your `<Admin>` component in a `<BrowserRouter>` for this library to work. Indeed, MSAL uses a hash-based routing strategy when redirecting back to your app, which is incompatible with a `<HashRouter>`.

## Advanced Usage

### Handling Permissions

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};

/**
 * Customize this map to match your own roles and permissions
 */
const rolesPermissionMap = {
  "12345678-1234-1234-1234-123456789012": "user",
  "12345678-1234-1234-1234-123456789013": "admin",
};

/**
 * Custom function to map roles to permissions, using the rolesPermissionMap above.
 * Alternatively, you can use the MS Graph API to get more information about the user's roles and groups.
 */
export const getPermissionsFromAccount = async (account) => {
  const roles = account?.idTokenClaims?.roles ?? [];
  return roles.map((role) => rolesPermissionMap[role]);
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider } from "ra-auth-msal";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig, getPermissionsFromAccount } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  getPermissionsFromAccount,
});

const App = () => {
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

### Handling User Identity

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};

/**
 * Custom function to get the identity from the account info.
 */
export const getIdentityFromAccount = async (account) => {
  return {
    id: account?.localAccountId,
    fullName: account?.username,
  };
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider } from "ra-auth-msal";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig, getIdentityFromAccount } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  getIdentityFromAccount,
});

const App = () => {
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

### Custom Login Request

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest = {
  scopes: ["User.Read"],
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider } from "ra-auth-msal";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig, loginRequest } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  loginRequest,
});

const App = () => {
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

### Custom Token Request

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const tokenRequest = {
  scopes: ["User.Read"],
  forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider } from "ra-auth-msal";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig, tokenRequest } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  tokenRequest,
});

const App = () => {
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


### `redirectOnCheckAuth`

You can choose whether the authProvider should redirect to the MS login form when the user is not authenticated. By default, it is set to `true`.

It can be useful to set it to `false` when you want to trigger the redirection only from a custom login page.

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};
```

```jsx
// in src/CustomLoginPage.jsx
import * as React from "react";
import { Button } from "@mui/material";
import { useLogin } from "react-admin";

/**
 * Csutom Login Page used to trigger the redirection to the MS login page.
 */
export const CustomLoginPage = () => {
  const login = useLogin();
  return (
    <div>
      <Button onClick={() => login({})}>
          Sign in with Microsoft
      </Button>
    </div>
  );
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalAuthProvider } from "ra-auth-msal";
import { CustomLoginPage } from "./CustomLoginPage";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  redirectOnCheckAuth: false,
});

const App = () => {
  return (
    <BrowserRouter>
       <Admin
           authProvider={authProvider}
           dataProvider={dataProvider}
           title="Example Admin"
           loginPage={CustomLoginPage}
        >
            <Resource name="posts" {...posts} />
      </Admin>
    </BrowserRouter>
   );
};
export default App;
```


### `enableDeepLinkRedirect`

You can choose whether the authProvider should redirect to the page the user was visiting once the user has been authenticated (this allows easier URL sharing between users). By default, it is set to `true`.

Note: This features relies on `sessionStorage` and is not available with Server-Side Rendering.

You can disable this feature like this: 

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalAuthProvider } from "ra-auth-msal";
import { CustomLoginPage } from "./CustomLoginPage";
import dataProvider from './dataProvider';
import posts from './posts';
import { msalConfig } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  enableDeepLinkRedirect: false,
});

const App = () => {
  return (
    <BrowserRouter>
       <Admin
           authProvider={authProvider}
           dataProvider={dataProvider}
           title="Example Admin"
        >
            <Resource name="posts" {...posts} />
      </Admin>
    </BrowserRouter>
   );
};
export default App;
```

### `msalHttpClient`

`ra-auth-msal` includes an `msalHttpClient` that can be used to make authenticated requests to your API. This helper automatically adds the `accessToken` to the request headers.

Here is an example with `ra-data-json-server`:

```jsx
// in src/authConfig.js
export const msalConfig = {
  // ...
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const tokenRequest = {
  scopes: ["User.Read"],
  forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
};
```

```jsx
// in src/App.jsx
import React from "react";
import { Admin, Resource } from 'react-admin';
import { BrowserRouter } from "react-router-dom";
import { PublicClientApplication } from "@azure/msal-browser";
import { LoginPage, msalAuthProvider, msalHttpClient } from "ra-auth-msal";
import jsonServerProvider from "ra-data-json-server";
import posts from './posts';
import { msalConfig, tokenRequest } from "./authConfig";

const myMSALObj = new PublicClientApplication(msalConfig);

const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  tokenRequest
});

const httpClient = msalHttpClient({
  msalInstance: myMSALObj,
  tokenRequest
});

const dataProvider = jsonServerProvider(
  "https://jsonplaceholder.typicode.com",
  httpClient
);

const App = () => {
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

**Tip:** By default `msalHttpClient` will use the `accessToken`. If you want to use the `idToken` instead, you will need to provide your own `httpClient` like so:

```js
import { fetchUtils } from "react-admin";

const myHttpClient = ({ msalInstance, tokenRequest }) => async (url, options = {}) => {
  const account = msalInstance.getActiveAccount();
  const authResult = await msalInstance.acquireTokenSilent({
    account,
    ...tokenRequest,
  });
  const token = authResult && authResult.idToken;
  const user = { authenticated: !!token, token: `Bearer ${token}` };
  return fetchUtils.fetchJson(url, { ...options, user });
};
```

### `refreshAuth`

The authProvider already supports automatic refresh of the token. However, if your dataProvider passes the token to your API, you should wrap it with [`addRefreshAuthToDataProvider`](https://marmelab.com/react-admin/addRefreshAuthToDataProvider.html) to ensure it also refreshes the token when needed:

```js
import { addRefreshAuthToDataProvider } from 'react-admin';
import { msalRefreshAuth } from "ra-auth-msal";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, tokenRequest } from "./authConfig";
import { dataProvider } from './dataProvider';

const myMSALObj = new PublicClientApplication(msalConfig);

const dataProvider = addRefreshAuthToDataProvider(
    dataProvider,
    msalRefreshAuth({
      msalInstance: myMSALObj,
      tokenRequest,
    })
);
```


## Demo

You can find a working demo, along with the source code, in this project's repository: https://github.com/marmelab/ra-auth-msal

## License

This auth provider is licensed under the MIT License and sponsored by [marmelab](https://marmelab.com).
