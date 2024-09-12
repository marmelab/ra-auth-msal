import {
  AccountInfo,
  AuthenticationResult,
  PublicClientApplication,
  RedirectRequest,
  SilentRequest,
} from "@azure/msal-browser";
import { AuthProvider, addRefreshAuthToAuthProvider } from "react-admin";
import { defaultTokenRequest } from "./constants";
import { msalRefreshAuth } from "./refreshAuth";

const defaultLoginRequest = {
  scopes: ["User.Read"],
};

const defaultGetPermissionsFromAccount = async () => {
  return [];
};

const defaultGetIdentityFromAccount = async (account: AccountInfo) => {
  return {
    ...account,
    id: account?.localAccountId,
    fullName: account?.username,
  };
};

export type MsalAuthProviderParams = {
  msalInstance: PublicClientApplication;
  loginRequest?: RedirectRequest;
  tokenRequest?: SilentRequest;
  getPermissionsFromAccount?: (
    account: AccountInfo
  ) => ReturnType<AuthProvider["getPermissions"]>;
  getIdentityFromAccount?: (
    account: AccountInfo
  ) => ReturnType<AuthProvider["getIdentity"]>;
  redirectOnCheckAuth?: boolean;
  enableDeepLinkRedirect?: boolean;
};

const MSAL_REDIRECT_KEY = "_ra_msal_redirect_key";

/**
 * Function that returns an authProvider using the Microsoft Authentication Library (MSAL),
 * ready to be used with react-admin.
 *
 * @param msalInstance - The MSAL Client instance
 * @param loginRequest - The login request configuration object
 * @param tokenRequest - The token request configuration object
 * @param getPermissionsFromAccount - Function allowing to customize how to compute the permissions from the account info
 * @param getIdentityFromAccount - Function allowing to customize how to compute the identity from the account info
 *
 * @example
 * ```tsx
 * import React, { useEffect } from "react";
 * import { PublicClientApplication } from "@azure/msal-browser";
 * import { LoginPage, msalAuthProvider } from "ra-auth-msal";
 * import { Admin } from "react-admin";
 * import { BrowserRouter } from "react-router-dom";
 * import { msalConfig } from "./authConfig";
 * import { dataProvider } from "./dataProvider";
 *
 * const myMSALObj = new PublicClientApplication(msalConfig);
 *
 * const App = () => {
 *   const [isMSALInitialized, setMSALInitialized] = React.useState(false);
 *   useEffect(() => {
 *     myMSALObj.initialize().then(() => {
 *       setMSALInitialized(true);
 *     });
 *   }, []);
 * 
 *   const authProvider = msalAuthProvider({
 *     msalInstance: myMSALObj,
 *   });
 * 
 *   if (!isMSALInitialized) {
 *     return <div>Loading...</div>;
 *   }
 *
 *   return (
 *     <BrowserRouter>
 *       <Admin
 *         authProvider={authProvider}
 *         dataProvider={dataProvider}
 *         loginPage={LoginPage}
 *       >
 *         ...
 *      </Admin>
 *   </BrowserRouter>
 *  );
 * };
 * ```
 */
export const msalAuthProvider = ({
  msalInstance,
  loginRequest = defaultLoginRequest,
  tokenRequest = defaultTokenRequest,
  getPermissionsFromAccount = defaultGetPermissionsFromAccount,
  getIdentityFromAccount = defaultGetIdentityFromAccount,
  redirectOnCheckAuth = true,
  enableDeepLinkRedirect = true,
}: MsalAuthProviderParams): AuthProvider => {
  // We need to set up the redirect handler at a global scope to make sure all redirects are handled,
  // otherwise the lib can lock up because a redirect is still marked as pending and has not been handled.
  // Besides, we can call this handler again later and still gather the response because it is cached internally.
  msalInstance.handleRedirectPromise();

  const canDeepLinkRedirect =
    enableDeepLinkRedirect &&
    typeof window != undefined &&
    typeof sessionStorage != undefined;

  const authProvider = {
    async login() {
      if (canDeepLinkRedirect) {
        // We cannot use react-router location here, as we are not in a router context,
        // So we need to fallback to native browser APIs.
        sessionStorage.setItem(MSAL_REDIRECT_KEY, window.location.href);
      }

      // Used when the redirection to the MS login form is done from a custom login page
      msalInstance.loginRedirect(loginRequest);
    },

    async logout() {
      const account = msalInstance.getActiveAccount();
      if (account) {
        await msalInstance.logoutRedirect({ account });
      }
    },

    async checkError({ status }) {
      if (status === 401 || status === 403) {
        throw new Error("Unauthorized");
      }
    },

    async checkAuth() {
      let account = msalInstance.getActiveAccount();
      if (!account) {
        const accounts = msalInstance.getAllAccounts();
        account = accounts[0];
      }

      let token: AuthenticationResult | null = null;
      if (account) {
        token = await msalInstance.acquireTokenSilent({
          account,
          ...tokenRequest,
        });
      }

      if (!account || !token) {
        if (redirectOnCheckAuth) {
          await this.login();

          // Suppresses error message from being displayed
          throw { message: false };
        }
        throw new Error("Unauthorized");
      }
    },

    async getPermissions() {
      const account = msalInstance.getActiveAccount();
      return getPermissionsFromAccount(account);
    },

    async getIdentity() {
      const account = msalInstance.getActiveAccount();
      return getIdentityFromAccount(account);
    },

    async handleCallback() {
      const response = await msalInstance.handleRedirectPromise();
      const account = response?.account;
      if (!account) {
        throw new Error("Authentication failed");
      }
      msalInstance.setActiveAccount(account);

      if (canDeepLinkRedirect) {
        // We cannot use react-router redirect here, as we are not in a router context,
        // So we need to fallback to native browser APIs.
        const redirectUrl =
          sessionStorage.getItem(MSAL_REDIRECT_KEY) ?? window.location.origin;
        window.location.replace(redirectUrl);
        sessionStorage.removeItem(MSAL_REDIRECT_KEY);
      }
    },
  };

  return addRefreshAuthToAuthProvider(
    authProvider,
    msalRefreshAuth({ msalInstance, tokenRequest })
  );
};
