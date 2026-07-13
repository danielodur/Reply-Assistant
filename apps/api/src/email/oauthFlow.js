import keytar from "keytar";

function asString(value) {
  return String(value || "").trim();
}

function providerMeta(provider, tenantId) {
  if (provider === "gmail-oauth") {
    return {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      scope: "https://www.googleapis.com/auth/gmail.readonly",
    };
  }

  if (provider === "microsoft-oauth") {
    const tenant = asString(tenantId) || "common";
    return {
      authorizationEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
      tokenEndpoint: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
      scope: "offline_access User.Read Mail.Read",
    };
  }

  return null;
}

export function buildOAuthAuthorizationUrl(input) {
  const provider = asString(input?.provider);
  const clientId = asString(input?.clientId);
  const redirectUri = asString(input?.redirectUri);
  const state = asString(input?.state) || `state-${Date.now()}`;
  const codeChallenge = asString(input?.codeChallenge);
  const tenantId = asString(input?.tenantId);

  const meta = providerMeta(provider, tenantId);
  if (!meta) {
    throw new Error("Unsupported OAuth provider");
  }

  if (!clientId) {
    throw new Error("Missing OAuth clientId");
  }

  if (!redirectUri) {
    throw new Error("Missing OAuth redirectUri");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: meta.scope,
    state,
    access_type: "offline",
    prompt: "consent",
  });

  if (codeChallenge) {
    params.set("code_challenge", codeChallenge);
    params.set("code_challenge_method", "S256");
  }

  return `${meta.authorizationEndpoint}?${params.toString()}`;
}

export async function exchangeOAuthCode(input) {
  const provider = asString(input?.provider);
  const clientId = asString(input?.clientId);
  const clientSecret = asString(input?.clientSecret);
  const redirectUri = asString(input?.redirectUri);
  const code = asString(input?.code);
  const codeVerifier = asString(input?.codeVerifier);
  const tenantId = asString(input?.tenantId);

  const meta = providerMeta(provider, tenantId);
  if (!meta) {
    throw new Error("Unsupported OAuth provider");
  }

  if (!clientId || !redirectUri || !code) {
    throw new Error("Missing OAuth token exchange input");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  if (codeVerifier) {
    body.set("code_verifier", codeVerifier);
  }

  const response = await fetch(meta.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object"
        ? payload.error_description ||
          payload.error ||
          `HTTP ${response.status}`
        : `HTTP ${response.status}`;
    throw new Error(String(errorMessage));
  }

  const accessToken = asString(payload?.access_token);
  if (!accessToken) {
    throw new Error("OAuth token response missing access_token");
  }

  // Store the access token securely using keytar
  const service = `BusinessReplyAssistant-${provider}`;
  const account = asString(input?.username || input?.oauthUserEmail);
  if (account) {
    await keytar.setPassword(service, account, accessToken);
  }

  return { accessToken, ...payload };
}
