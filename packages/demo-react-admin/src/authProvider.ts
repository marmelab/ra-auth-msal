import { PublicClientApplication } from "@azure/msal-browser";
import { msalAuthProvider } from "ra-auth-msal";
import {
  getPermissionsFromAccount,
  loginRequest,
  msalConfig,
  redirectOnCheckAuth,
  tokenRequest,
} from "./authConfig";
import { AuthProvider } from "react-admin";

export const msalClientApp = new PublicClientApplication(msalConfig);

export const buildAuthProvider = async (): Promise<AuthProvider> => {
  try {    
    await msalClientApp.initialize();
    return await msalAuthProvider({
      msalInstance: msalClientApp,
      loginRequest,
      tokenRequest,
      getPermissionsFromAccount,
      redirectOnCheckAuth,
    });
  } catch (error) {
    console.error(error);
    throw error;    
  }
};
