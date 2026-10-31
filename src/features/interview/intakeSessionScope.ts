const SESSION_PATHS = ["/start", "/privacy", "/messaging-terms"];
const clean = (pathname: string) => pathname.replace(/\/+$/, "");
export function isIntakeSessionPath(pathname: string, base = "") {
  return SESSION_PATHS.some((path) => clean(pathname) === base + path);
}
export function isIntakeFormPath(pathname: string, base = "") {
  return clean(pathname) === base + "/start";
}
