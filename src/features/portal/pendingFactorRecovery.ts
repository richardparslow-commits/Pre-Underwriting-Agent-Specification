/** Capture an AAL1 token for this one removal request. A shared client can be
 * upgraded by another tab after our factor check; it must not supply its latest
 * AAL2 token to DELETE a factor that has since become verified. */
export async function unenrollPendingFactor(options: {
  url: string;
  key: string;
  factorId: string;
  getSession: () => Promise<{
    data: { session: { access_token: string } | null };
    error: unknown;
  }>;
  fetcher?: typeof fetch;
}): Promise<{ error: unknown }> {
  const fail = () => ({
    error: new Error(
      "Unfinished setup could not be replaced. Check setup again.",
    ),
  });
  try {
    const session = await options.getSession();
    const token = session.data.session?.access_token;
    if (session.error || !token || token.split(".").length !== 3) return fail();
    const claims = JSON.parse(
      atob(token.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (claims.aal !== "aal1") return fail();
    const response = await (options.fetcher ?? fetch)(
      `${options.url.replace(/\/$/, "")}/auth/v1/factors/${encodeURIComponent(options.factorId)}`,
      {
        method: "DELETE",
        headers: { apikey: options.key, Authorization: `Bearer ${token}` },
        credentials: "omit",
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!response.ok) return fail();
    const data: unknown = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      !("id" in data) ||
      data.id !== options.factorId
    )
      return fail();
    return { error: null };
  } catch {
    return fail();
  }
}
