import {
  AuthenticationResult,
  PublicClientApplication,
  SilentRequest,
} from "@azure/msal-browser";
import { defaultTokenRequest } from "./constants";
import { initializeMsalInstance } from "./initializeMsalInstance";

export const msalRefreshAuth = ({
  msalInstance: msalInstanceProp,
  tokenRequest = defaultTokenRequest,
}: {
  msalInstance?: PublicClientApplication;
  tokenRequest: SilentRequest;
}) => async () => {
  const msalInstance = await initializeMsalInstance(msalInstanceProp);
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
