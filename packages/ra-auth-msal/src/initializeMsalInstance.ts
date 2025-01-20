import { PublicClientApplication } from "@azure/msal-browser";

let msalInstanceSetupPromise: Promise<void> | null = null;

export const initializeMsalInstance = async (msalInstance: PublicClientApplication) => {
  if (!msalInstanceSetupPromise) {
    msalInstanceSetupPromise = msalInstance.initialize();
  }
  return msalInstanceSetupPromise.then(() => msalInstance);
};