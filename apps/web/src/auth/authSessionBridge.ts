let accessTokenGetter: (() => string | null) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  accessTokenGetter = getter;
}

export function getAccessToken(): string | null {
  return accessTokenGetter?.() ?? null;
}
