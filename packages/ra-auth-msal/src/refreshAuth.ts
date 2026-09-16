import { IPublicClientApplication, SilentRequest } from "@azure/msal-browser";
import { defaultTokenRequest } from "./constants";
import { initializeMsalInstance } from "./initializeMsalInstance";

export const msalRefreshAuth = ({
  msalInstance: msalInstanceProp,
  tokenRequest = defaultTokenRequest,
}: {
  msalInstance?: IPublicClientApplication;
  tokenRequest: SilentRequest;
}) => async () => {
  const msalInstance = await initializeMsalInstance(msalInstanceProp);
  let account = msalInstance.getActiveAccount();
  if (!account) {
    const accounts = msalInstance.getAllAccounts();
    account = accounts[0];
  }

  if (account) {
    // Acquiring the token is what refreshes it in the MSAL cache; the result is not needed here.
    await msalInstance.acquireTokenSilent({
      account,
      ...tokenRequest,
    });
  }
};
