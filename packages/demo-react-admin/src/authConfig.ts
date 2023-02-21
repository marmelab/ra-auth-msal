import {
  Configuration,
  RedirectRequest,
  SilentRequest,
  AccountInfo,
} from "@azure/msal-browser";

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md
 */
export const msalConfig: Configuration = {
  auth: {
    // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    // Full directory URL, in the form of https://login.microsoftonline.com/<tenant-id>
    authority: import.meta.env.VITE_MSAL_AUTHORITY,
    // Full redirect URL, in form of http://localhost:8080/auth-callback
    redirectUri: `${import.meta.env.VITE_APP_BASE_URI}/auth-callback`,
    // We need to disable this feature because it is already handled by react-admin, and would otherwise conflict
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage", // This configures where your cache will be stored
    storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
  },
};

/**
 * Scopes you add here will be prompted for user consent during sign-in.
 * By default, MSAL.js will add OIDC scopes (openid, profile, email) to any login request.
 * For more information about OIDC scopes, visit:
 * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
 */
export const loginRequest: RedirectRequest = {
  scopes: ["User.Read", "group.Read.All"],
};

/**
 * Add here the scopes to request when obtaining an access token for MS Graph API. For more information, see:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md
 */
export const tokenRequest: SilentRequest = {
  scopes: ["User.Read"],
  forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
};

export const getPermissionsFromAccount = async (account: AccountInfo) => {
  return []; // TODO
};
