import { addRefreshAuthToDataProvider } from "react-admin";
import {
  msalHttpClient,
  msalRefreshAuth,
} from "ra-auth-msal";
import { msalClientApp } from "./authProvider"
import { tokenRequest } from "./authConfig";
import jsonServerProvider from "ra-data-json-server";

const httpClient = msalHttpClient({
  msalInstance: msalClientApp,
  tokenRequest,
});

export const dataProvider = addRefreshAuthToDataProvider(
  jsonServerProvider("http://localhost:3000", httpClient),
  msalRefreshAuth({
    msalInstance: msalClientApp,
    tokenRequest,
  })
);
