import { PublicClientApplication } from "@azure/msal-browser";
import {
  LoginPage,
  msalAuthProvider,
  msalHttpClient,
  msalRefreshAuth,
} from "ra-auth-msal";
import jsonServerProvider from "ra-data-json-server";
import React from "react";
import {
  Admin,
  CustomRoutes,
  Resource,
  addRefreshAuthToDataProvider,
} from "react-admin";
import { BrowserRouter, Route } from "react-router-dom";
import {
  getPermissionsFromAccount,
  loginRequest,
  msalConfig,
  tokenRequest,
} from "./authConfig";
import comments from "./comments";
import { CustomLoginPage } from "./CustomLoginPage";
import CustomRouteLayout from "./customRouteLayout";
import CustomRouteNoLayout from "./customRouteNoLayout";
import i18nProvider from "./i18nProvider";
import Layout from "./Layout";
import posts from "./posts";
import tags from "./tags";
import users from "./users";

const redirectOnCheckAuth = true;

const myMSALObj = new PublicClientApplication(msalConfig);
const authProvider = msalAuthProvider({
  msalInstance: myMSALObj,
  loginRequest,
  tokenRequest,
  getPermissionsFromAccount,
  redirectOnCheckAuth,
});

const httpClient = msalHttpClient({
  msalInstance: myMSALObj,
  tokenRequest,
});

const dataProvider = addRefreshAuthToDataProvider(
  jsonServerProvider("http://localhost:3000", httpClient),
  msalRefreshAuth({
    msalInstance: myMSALObj,
    tokenRequest,
  })
);

const App = () => {
  return (
    <BrowserRouter>
      <Admin
        authProvider={authProvider}
        dataProvider={dataProvider}
        i18nProvider={i18nProvider}
        title="Example Admin"
        layout={Layout}
        loginPage={redirectOnCheckAuth ? LoginPage : CustomLoginPage}
      >
        {(permissions) => (
          <>
            <CustomRoutes noLayout>
              <Route
                path="/custom"
                element={<CustomRouteNoLayout title="Posts from /custom" />}
              />
            </CustomRoutes>
            <Resource name="posts" {...posts} />
            <Resource name="comments" {...comments} />
            <Resource name="tags" {...tags} />
            {permissions ? (
              <>
                {permissions.includes("admin") ? (
                  <Resource name="users" {...users} />
                ) : null}
                <CustomRoutes noLayout>
                  <Route
                    path="/custom1"
                    element={
                      <CustomRouteNoLayout title="Posts from /custom1" />
                    }
                  />
                </CustomRoutes>
                <CustomRoutes>
                  <Route
                    path="/custom2"
                    element={<CustomRouteLayout title="Posts from /custom2" />}
                  />
                </CustomRoutes>
              </>
            ) : null}
            <CustomRoutes>
              <Route
                path="/custom3"
                element={<CustomRouteLayout title="Posts from /custom3" />}
              />
            </CustomRoutes>
          </>
        )}
      </Admin>
    </BrowserRouter>
  );
};
export default App;
