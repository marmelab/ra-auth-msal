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
};

export const MsalAuthProvider = ({
  msalInstance,
  loginRequest = defaultLoginRequest,
  tokenRequest = defaultTokenRequest,
  getPermissionsFromAccount = defaultGetPermissionsFromAccount,
  getIdentityFromAccount = defaultGetIdentityFromAccount,
}: MsalAuthProviderParams): AuthProvider => {
  // We need to set up the redirect handler at a global scope to make sure all redirects are handled,
  // otherwise the lib can lock up because a redirect is still marked as pending and has not been handled.
  // Besides, we can call this handler again later and still gather the response because it is cached internally.
  msalInstance.handleRedirectPromise();

  return {
    async login() {
      // should never be called
      throw Error("Not implemented");
    },

    async logout() {
      const account = msalInstance.getActiveAccount();
      if (account) {
        const logoutRequest = {
          account,
        };
        await msalInstance.logoutRedirect(logoutRequest);
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
        token = await msalInstance.acquireTokenSilent(tokenRequest);
      }

      if (!account || !token) {
        msalInstance.loginRedirect(loginRequest);
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
