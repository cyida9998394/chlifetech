const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_NAME_LENGTH = 50;
export const MAX_NICKNAME_LENGTH = 30;

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function parseCredentials(body: unknown) {
  const data = body as { email?: unknown; password?: unknown } | null;
  const email = str(data?.email).trim().toLowerCase();
  const password = str(data?.password);
  return { email, password, emailValid: EMAIL_RE.test(email) };
}

export function parseProfile(body: unknown) {
  const data = body as { name?: unknown; nickname?: unknown } | null;
  return { name: str(data?.name).trim(), nickname: str(data?.nickname).trim() };
}
