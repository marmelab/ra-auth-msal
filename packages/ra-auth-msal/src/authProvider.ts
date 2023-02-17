import {
  PublicClientApplication,
  RedirectRequest,
  SilentRequest,
} from "@azure/msal-browser";
import { AuthProvider } from "react-admin";

export const MsalAuthProvider = (
  msalInstance: PublicClientApplication,
  loginRequest: RedirectRequest,
  tokenRequest: SilentRequest
): AuthProvider => {
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

      if (!account) {
        msalInstance.loginRedirect(loginRequest);
        throw new Error("Unauthorized");
      }

      const token = await msalInstance.acquireTokenSilent(tokenRequest);
      if (!token) {
        msalInstance.loginRedirect(loginRequest);
        throw new Error("Unauthorized");
      }
    },

    async getPermissions() {
      const account = msalInstance.getActiveAccount();
      console.log(account);
      return []; // TODO
    },

    async getIdentity() {
      const account = msalInstance.getActiveAccount();
      return {
        ...account,
        id: account?.localAccountId,
        fullName: account?.username,
      };
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
