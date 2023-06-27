import {
  PublicClientApplication,
  RedirectRequest,
  SilentRequest,
  AccountInfo,
  AuthenticationResult,
} from "@azure/msal-browser";
import { AuthProvider } from "react-admin";

const defaultLoginRequest = {
  scopes: ["User.Read"],
};

const defaultTokenRequest = {
  scopes: ["User.Read"],
  forceRefresh: false,
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
};

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
 *   const authProvider = msalAuthProvider({
 *     msalInstance: myMSALObj,
 *   });
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
}: MsalAuthProviderParams): AuthProvider => {
  // We need to set up the redirect handler at a global scope to make sure all redirects are handled,
  // otherwise the lib can lock up because a redirect is still marked as pending and has not been handled.
  // Besides, we can call this handler again later and still gather the response because it is cached internally.
  msalInstance.handleRedirectPromise();

  return {
    async login() {
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
          msalInstance.loginRedirect(loginRequest);
          
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
    },
  };
};
