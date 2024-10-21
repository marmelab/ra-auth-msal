
import {
  LoginPage,
} from "ra-auth-msal";
import React, { useEffect } from "react";
import {
  Admin,
  AuthProvider,
  CustomRoutes,
  Resource,
} from "react-admin";
import { BrowserRouter, Route } from "react-router-dom";
import comments from "./comments";
import { CustomLoginPage } from "./CustomLoginPage";
import CustomRouteLayout from "./customRouteLayout";
import CustomRouteNoLayout from "./customRouteNoLayout";
import i18nProvider from "./i18nProvider";
import Layout from "./Layout";
import posts from "./posts";
import tags from "./tags";
import users from "./users";
import { buildAuthProvider } from "./authProvider";
import { dataProvider } from "./dataProvider";
import { redirectOnCheckAuth } from "./authConfig";



const App = () => {
  const [authProvider, setAuthProvider] = React.useState<AuthProvider>();
  useEffect(() => {
    const init = async () => {
      setAuthProvider(await buildAuthProvider());
    };

    init();    
  }, []);


  if (!authProvider) {
    return <div>Loading...</div>;
  }

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
