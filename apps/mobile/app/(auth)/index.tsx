import { Redirect } from "expo-router";

/** Default auth group entry: send users to login. */
export default function AuthIndex() {
  return <Redirect href="/(auth)/login" />;
}
