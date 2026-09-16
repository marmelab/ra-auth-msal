import type { IPublicClientApplication } from "@azure/msal-browser";

// Note: jest maps "react-admin" to "ra-core" (see moduleNameMapper in package.json), because
// importing react-admin itself pulls in ra-ui-materialui and, through it, the ESM-only
// react-hotkeys-hook, which jest cannot require. Everything authProvider.ts uses
// (addRefreshAuthToAuthProvider, the AuthProvider type) lives in ra-core, so this exercises the
// real implementation. It does mean LoginPage.tsx cannot be tested here: it imports Loading,
// which ra-core does not export.

const account = {
  homeAccountId: "a-home-account-id",
  environment: "login.microsoftonline.com",
  tenantId: "a-tenant-id",
  username: "john.smith@example.com",
  localAccountId: "a-local-account-id",
  idTokenClaims: { roles: ["admin"] },
} as any;

const createMsalInstance = (overrides: Record<string, any> = {}) =>
  ({
    initialize: jest.fn().mockResolvedValue(undefined),
    handleRedirectPromise: jest.fn().mockResolvedValue(null),
    loginRedirect: jest.fn().mockResolvedValue(undefined),
    logoutRedirect: jest.fn().mockResolvedValue(undefined),
    acquireTokenSilent: jest
      .fn()
      .mockResolvedValue({ accessToken: "an-access-token", account }),
    getActiveAccount: jest.fn().mockReturnValue(null),
    getAllAccounts: jest.fn().mockReturnValue([]),
    setActiveAccount: jest.fn(),
    ...overrides,
  } as unknown as IPublicClientApplication);

/**
 * initializeMsalInstance memoizes its promise at module scope, so every test needs a fresh
 * module registry. Otherwise the first instance initialize() call is reused by all the others.
 */
const loadMsalAuthProvider =
  (): typeof import("./authProvider").msalAuthProvider => {
    let mod: typeof import("./authProvider") | undefined;
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require("./authProvider");
    });
    return mod!.msalAuthProvider;
  };

describe("msalAuthProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe("login", () => {
    it("initializes the instance and triggers a login redirect", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await authProvider.login({});

      expect(msalInstance.initialize).toHaveBeenCalled();
      expect(msalInstance.loginRedirect).toHaveBeenCalledWith({
        scopes: ["User.Read"],
      });
    });

    it("passes navigateToLoginRequestUrl false to handleRedirectPromise by default", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await authProvider.login({});

      expect(msalInstance.handleRedirectPromise).toHaveBeenCalledWith({
        navigateToLoginRequestUrl: false,
      });
    });

    it("honours an explicit navigateToLoginRequestUrl", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        navigateToLoginRequestUrl: true,
      });

      await authProvider.login({});

      expect(msalInstance.handleRedirectPromise).toHaveBeenCalledWith({
        navigateToLoginRequestUrl: true,
      });
    });

    it("forwards a custom loginRequest", async () => {
      const msalInstance = createMsalInstance();
      const loginRequest = { scopes: ["User.Read", "Mail.Read"] };
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        loginRequest,
      });

      await authProvider.login({});

      expect(msalInstance.loginRedirect).toHaveBeenCalledWith(loginRequest);
    });

    it("remembers the current location for the deep link redirect", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await authProvider.login({});

      expect(sessionStorage.getItem("_ra_msal_redirect_key")).toBe(
        window.location.href
      );
    });

    it("does not remember the location when deep link redirect is disabled", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        enableDeepLinkRedirect: false,
      });

      await authProvider.login({});

      expect(sessionStorage.getItem("_ra_msal_redirect_key")).toBeNull();
    });
  });

  describe("logout", () => {
    it("logs out the active account", async () => {
      const msalInstance = createMsalInstance({
        getActiveAccount: jest.fn().mockReturnValue(account),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await authProvider.logout({});

      expect(msalInstance.logoutRedirect).toHaveBeenCalledWith({ account });
    });

    it("does nothing when there is no active account", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await authProvider.logout({});

      expect(msalInstance.logoutRedirect).not.toHaveBeenCalled();
    });
  });

  describe("checkError", () => {
    it.each([401, 403])("rejects on a %s status", async (status) => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.checkError({ status })).rejects.toThrow(
        "Unauthorized"
      );
    });

    it.each([200, 404, 500])("resolves on a %s status", async (status) => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(
        authProvider.checkError({ status })
      ).resolves.toBeUndefined();
    });
  });

  describe("checkAuth", () => {
    it("resolves when an active account has a token", async () => {
      const msalInstance = createMsalInstance({
        getActiveAccount: jest.fn().mockReturnValue(account),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.checkAuth({})).resolves.toBeUndefined();
      expect(msalInstance.acquireTokenSilent).toHaveBeenCalledWith({
        account,
        scopes: ["User.Read"],
        forceRefresh: false,
      });
    });

    it("falls back to the first available account", async () => {
      const msalInstance = createMsalInstance({
        getAllAccounts: jest.fn().mockReturnValue([account]),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.checkAuth({})).resolves.toBeUndefined();
    });

    it("rejects without redirecting when redirectOnCheckAuth is false", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        redirectOnCheckAuth: false,
      });

      await expect(authProvider.checkAuth({})).rejects.toThrow("Unauthorized");
      expect(msalInstance.loginRedirect).not.toHaveBeenCalled();
    });

    it("redirects to login when there is no account", async () => {
      const msalInstance = createMsalInstance();
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.checkAuth({})).rejects.toEqual({
        message: false,
      });
      expect(msalInstance.loginRedirect).toHaveBeenCalled();
    });
  });

  describe("getPermissions", () => {
    it("returns an empty array by default", async () => {
      const msalInstance = createMsalInstance({
        getActiveAccount: jest.fn().mockReturnValue(account),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.getPermissions({})).resolves.toEqual([]);
    });

    it("uses getPermissionsFromAccount when provided", async () => {
      const msalInstance = createMsalInstance({
        getActiveAccount: jest.fn().mockReturnValue(account),
      });
      const getPermissionsFromAccount = jest.fn(
        async (a: any) => a.idTokenClaims.roles
      );
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        getPermissionsFromAccount,
      });

      await expect(authProvider.getPermissions({})).resolves.toEqual(["admin"]);
      expect(getPermissionsFromAccount).toHaveBeenCalledWith(account);
    });
  });

  describe("getIdentity", () => {
    it("derives the identity from the active account", async () => {
      const msalInstance = createMsalInstance({
        getActiveAccount: jest.fn().mockReturnValue(account),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.getIdentity()).resolves.toMatchObject({
        id: account.localAccountId,
        fullName: account.username,
      });
    });
  });

  describe("handleCallback", () => {
    it("sets the account returned by the redirect as active", async () => {
      const msalInstance = createMsalInstance({
        handleRedirectPromise: jest.fn().mockResolvedValue({ account }),
      });
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        enableDeepLinkRedirect: false,
      });

      await authProvider.handleCallback();

      expect(msalInstance.setActiveAccount).toHaveBeenCalledWith(account);
    });

    it("passes navigateToLoginRequestUrl to handleRedirectPromise", async () => {
      const msalInstance = createMsalInstance({
        handleRedirectPromise: jest.fn().mockResolvedValue({ account }),
      });
      const authProvider = loadMsalAuthProvider()({
        msalInstance,
        enableDeepLinkRedirect: false,
      });

      await authProvider.handleCallback();

      expect(msalInstance.handleRedirectPromise).toHaveBeenCalledWith({
        navigateToLoginRequestUrl: false,
      });
    });

    it("rejects when the redirect yielded no account", async () => {
      const msalInstance = createMsalInstance({
        handleRedirectPromise: jest.fn().mockResolvedValue(null),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await expect(authProvider.handleCallback()).rejects.toThrow(
        "Authentication failed"
      );
    });

    // jsdom makes Location members non-configurable, so the navigation itself cannot be
    // observed. Assert the stored deep link is read and then cleared, which is the part
    // this library owns.
    it("consumes the stored deep link", async () => {
      const getItem = jest.spyOn(Storage.prototype, "getItem");
      sessionStorage.setItem(
        "_ra_msal_redirect_key",
        "http://localhost/#/posts"
      );
      const msalInstance = createMsalInstance({
        handleRedirectPromise: jest.fn().mockResolvedValue({ account }),
      });
      const authProvider = loadMsalAuthProvider()({ msalInstance });

      await authProvider.handleCallback();

      expect(getItem).toHaveBeenCalledWith("_ra_msal_redirect_key");
      expect(sessionStorage.getItem("_ra_msal_redirect_key")).toBeNull();
      getItem.mockRestore();
    });
  });
});
