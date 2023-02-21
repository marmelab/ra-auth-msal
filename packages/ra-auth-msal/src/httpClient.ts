import { fetchUtils, Options } from "react-admin";
import { PublicClientApplication, SilentRequest } from "@azure/msal-browser";

const defaultTokenRequest = {
  scopes: ["User.Read"],
  forceRefresh: false,
};

export type MsalHttpClientParams = {
  msalInstance: PublicClientApplication;
  tokenRequest?: SilentRequest;
};

export const msalHttpClient = ({
  msalInstance,
  tokenRequest = defaultTokenRequest,
}: MsalHttpClientParams) => async (url: string, options: Options = {}) => {
  const account = msalInstance.getActiveAccount();
  const authResult = await msalInstance.acquireTokenSilent({
    account,
    ...tokenRequest,
  });
  const token = authResult?.accessToken;
  const user = {
    authenticated: !!token,
    token: `Bearer ${token}`,
  };
  return fetchUtils.fetchJson(url, { ...options, user });
};
