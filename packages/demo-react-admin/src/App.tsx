import { PublicClientApplication } from "@azure/msal-browser";
import { MsalAuthProvider } from "ra-auth-msal";
import fakeRestProvider from "ra-data-fakerest";
import React from "react";
import { Admin, CustomRoutes, Resource } from "react-admin";
import { BrowserRouter, Route } from "react-router-dom";
import { loginRequest, tokenRequest, msalConfig } from "./authConfig";
import comments from "./comments";
import CustomRouteLayout from "./customRouteLayout";
import CustomRouteNoLayout from "./customRouteNoLayout";
import data from "./data";
import i18nProvider from "./i18nProvider";
import Layout from "./Layout";
import posts from "./posts";
import tags from "./tags";
import users from "./users";

const myMSALObj = new PublicClientApplication(msalConfig);

const App = () => {
  const authProvider = MsalAuthProvider(myMSALObj, loginRequest, tokenRequest);

  return (
    <BrowserRouter>
      <Admin
        authProvider={authProvider}
        dataProvider={fakeRestProvider(data)}
        i18nProvider={i18nProvider}
        title="Example Admin"
        layout={Layout}
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
