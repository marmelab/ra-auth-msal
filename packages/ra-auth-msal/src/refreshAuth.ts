import {
  AuthenticationResult,
  PublicClientApplication,
  SilentRequest,
} from "@azure/msal-browser";
import { defaultTokenRequest } from "./constants";

export const msalRefreshAuth = ({
  msalInstance,
  tokenRequest = defaultTokenRequest,
}: {
  msalInstance: PublicClientApplication;
  tokenRequest: SilentRequest;
}) => async () => {
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
  return Promise.resolve();
};
