# ra-auth-msal

An auth provider for [react-admin](https://github.com/marmelab/react-admin) that handles authentication using the [Microsoft Authentication Library (MSAL)](https://learn.microsoft.com/fr-fr/azure/active-directory/develop/msal-overview).

This is useful when using [Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/) to authenticate your users.

This repository contains:

-   The actual `ra-auth-msal` package
-   A simple demo app you can run locally to try out `ra-auth-msal` with your own Azure AD instance

## The `ra-auth-msal` package

-   Please have a look at the [DOCUMENTATION](./packages/ra-auth-msal/Readme.md)
-   And also the [source code](https://github.com/marmelab/ra-auth-msal/tree/main/src/packages/ra-auth-msal)

## Simple Demo

### Prerequesites

-   You need to have an active Azure account. You can create one for free [here](https://azure.microsoft.com/free/).

### Initial setup

1. Clone this project

You need to register and configure this demo application to use your own Azure AD instance. Please follow the steps below (taken from [the quickstart tutorial](https://learn.microsoft.com/en-us/azure/active-directory/develop/single-page-app-quickstart?pivots=devlang-javascript#option-2-manual-register-and-manually-configure-your-application-and-code-sample)):

1. Sign in to the [Azure portal](https://portal.azure.com/).
1. If you have access to multiple tenants, use the **Directories + subscriptions** filter  in the top menu to switch to the tenant in which you want to register the application.
1. Search for and select **Azure Active Directory**.
1. Under **Manage**, select **App registrations** > **New registration**.
1. Enter a **Name** for your application. Users of your app might see this name, and you can change it later.
1. Under **Supported account types**, select **Accounts in any organizational directory and personal Microsoft accounts**.
1. Select **Register**. On the app **Overview** page, note the **Application (client) ID** value for later use.
1. Under **Manage**, select **Authentication**.
1. Under **Platform configurations**, select **Add a platform**. In the pane that opens select **Single-page application**.
1. Set the **Redirect URI** value to `http://localhost:8080/auth-callback`.
1. Select **Configure**.

Now it is time to create some users and some groups, which will enable us to demonstrate the **permissions** feature.

1. In the [Azure portal](https://portal.azure.com/), Search for and select **Azure Active Directory**.
1. Under **Groups**, create a new group of type 'Security', called `admins`. Leave all the other options to their default values.
1. In the same way, create a second group called `users`.
1. Under **Users**, click **New user** > **Create a user**.
1. Choose `chris` as the **User Name** and `Chris Green` as the **Name**.
1. In **Password**, select **Allow me to create the password**, and choose a password of your choice.
1. In **Groups and roles**, select only the `users` group.
1. Make sure **Block sign in** is set to **false**
1. Click **Create**.
1. Repeat the same steps to create a second user, called `John Smith`, and assign it both the `users` and `admins` groups.

Lastly, we need to configure the app to include the **goups** claim in the ID token.

1. In the **Azure Active Directory** Dashboard
1. Under **Manage**, select **App registrations** > and select the App you created before
1. Select **Token configuration**.
1. Click on **Add groups claim**.
1. Select **Security groups**
1. Inside both the **ID** and **Access** sections, check the **Emit group claims as roles** checkbox.
1. Click **Save**.

Now we can configure the demo app. First we need to setup some environment variables. We can do this by creating a `.env` file in the root of the project.

```sh
cp packages/demo-react-admin/.env.template packages/demo-react-admin/.env
```

The following variables are required:

```sh
VITE_MSAL_CLIENT_ID="12345678-1234-1234-1234-123456789012"
VITE_MSAL_AUTHORITY="https://login.microsoftonline.com/common"
VITE_APP_BASE_URI="http://localhost:8080"
```

Please fill in the `VITE_MSAL_CLIENT_ID` with the **Application (client) ID** you noted earlier.

Lastly, we need to edit the `rolesPermissionMap` inside `packages/demo-react-admin/src/authConfig.ts` to match the groups you created earlier.

```ts
/**
 * Customize this map to match the ids of the groups you created in Azure AD
 */
const rolesPermissionMap = {
  "199a772f-5fbe-42ce-8adb-2838a9b3d37f": "user",
  "e3f75483-90e9-430a-86eb-fe97ed36b941": "admin",
};
```

We are now all set to run the demo app.

### Running The Demo App

Install the dependencies and start the Demo App with the following command:

```sh
make install start
```

### Using the Simple Demo

Now that all is configured and running, you can browse to http://localhost:8080/ to access the React Admin App.

The first time you sign in with any of the users, you'll have to enter their temporary password and will be asked to enter a password of your choice.

-   Signing in with `Chris Green` will only grant the `user` role permissions
-   Signing in with `John Smith` will grant full `admin` role permissions, allowing for instance to see the **Users** resource in the main menu

Feel free to play around with this demo, along with the MASL config, to understand better how it works!

## License

This repository and the code it contains are licensed under the MIT License and sponsored by [marmelab](https://marmelab.com).
