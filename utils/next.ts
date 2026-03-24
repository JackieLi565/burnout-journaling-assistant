import { cookies } from "next/headers";

/**
 * A helper function that retrieves the '__session' cookie value.
 */
export async function getSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get("__session")?.value;
}
