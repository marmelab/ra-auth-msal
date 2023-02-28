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

/**
 * Custom http client, leveraging react-admin's fetchUtils.fetchJson, that helps with adding
 * an Authorization header with the access token.
 * 
 * @param msalInstance - The MSAL Client instance
 * @param tokenRequest - The token request configuration object
 * 
 * @example
 * ```tsx
 * import { PublicClientApplication } from "@azure/msal-browser";
 * import { msalHttpClient } from "ra-auth-msal";
 * import { msalConfig, tokenRequest } from "./authConfig";
 * 
 * const myMSALObj = new PublicClientApplication(msalConfig);
 *
 * const httpClient = msalHttpClient({
 *   msalInstance: myMSALObj,
 *   tokenRequest,
 * });
 * ```
 */
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
