import * as React from "react";
import { useTimeout, Loading } from "react-admin";

/**
 * Empty Login Page that simply displays a loading indicator if the redirection takes too long.
 */
export const LoginPage = () => {
  const hasOneSecondPassed = useTimeout(1000);
  return hasOneSecondPassed ? <Loading /> : null;
};
