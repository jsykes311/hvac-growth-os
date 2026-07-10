const GOOGLE_LOGIN_SCOPE = "openid email profile";
export const GOOGLE_LOGIN_NEXT_COOKIE = "hvac_growth_os_google_login_next";
export const GOOGLE_LOGIN_STATE_COOKIE = "hvac_growth_os_google_login_state";

export type GoogleLoginProfile = {
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

export function googleLoginConfig() {
  return {
    clientId: process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_LOGIN_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    redirectUri: process.env.GOOGLE_LOGIN_REDIRECT_URI || "",
  };
}

export function googleLoginSetupStatus() {
  const config = googleLoginConfig();
  const items = [
    {
      configured: Boolean(config.clientId),
      envVar: "GOOGLE_LOGIN_CLIENT_ID or GOOGLE_CLIENT_ID",
      label: "Google login client ID",
    },
    {
      configured: Boolean(config.clientSecret),
      envVar: "GOOGLE_LOGIN_CLIENT_SECRET or GOOGLE_CLIENT_SECRET",
      label: "Google login client secret",
    },
    {
      configured: Boolean(config.redirectUri),
      envVar: "GOOGLE_LOGIN_REDIRECT_URI",
      label: "Google login redirect URI",
    },
  ];

  return {
    items,
    missingItems: items.filter((item) => !item.configured).map((item) => item.envVar),
    ready: items.every((item) => item.configured),
  };
}

export function buildGoogleLoginUrl({ origin, state }: { origin: string; state: string }) {
  const config = googleLoginConfig();
  const redirectUri = config.redirectUri || `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    prompt: "select_account",
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GOOGLE_LOGIN_SCOPE,
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleLoginCode({ code, origin }: { code: string; origin: string }) {
  const config = googleLoginConfig();
  const redirectUri = config.redirectUri || `${origin}/api/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  const tokenPayload = (await tokenResponse.json()) as { access_token?: string; error?: string };
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error || "Google login token exchange failed.");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  const profile = (await profileResponse.json()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
  if (!profileResponse.ok || !profile.email) {
    throw new Error("Google login profile could not be loaded.");
  }

  return {
    email: profile.email,
    emailVerified: Boolean(profile.email_verified),
    name: profile.name || profile.email,
    picture: profile.picture,
  } satisfies GoogleLoginProfile;
}
