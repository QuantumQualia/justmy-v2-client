const GSI_SRC = "https://accounts.google.com/gsi/client";
const APPLE_SRC =
  "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";

/** Apple Sign In is implemented but not shown until credentials are ready. */
export const APPLE_SIGN_IN_ENABLED = false;

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    context?: "signin" | "signup" | "use";
    use_fedcm_for_prompt?: boolean;
    use_fedcm_for_button?: boolean;
    itp_support?: boolean;
  }) => void;
  prompt: (listener?: (notification: {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
  }) => void) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      size?: string;
      theme?: string;
      ux_mode?: string;
      width?: number | string;
    },
  ) => void;
};

type AppleSignInResponse = {
  authorization: { id_token: string };
  user?: {
    email?: string;
    name?: { firstName?: string; lastName?: string };
  };
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string;
          scope: string;
          redirectURI: string;
          usePopup: boolean;
        }) => void;
        signIn: () => Promise<AppleSignInResponse>;
      };
    };
  }
}

type Pending<T> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

let googlePending: Pending<string> | null = null;
let googleButton: HTMLElement | null = null;
let googleReady: Promise<void> | null = null;
let googleInitialized = false;
let googleInFlight: Promise<string> | null = null;

function loadScript(src: string, id: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();

  return new Promise((resolve, reject) => {
    const tagged = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (tagged) {
      if (tagged.dataset.loaded === "true") {
        resolve();
        return;
      }
      tagged.addEventListener("load", () => resolve(), { once: true });
      tagged.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${src}`)),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureGoogle(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) return;
  if (googleInitialized && window.google?.accounts.id) return;

  await loadScript(GSI_SRC, "google-gis-client");
  const googleId = window.google?.accounts.id;
  if (!googleId) throw new Error("Google sign-in failed to load.");

  googleId.initialize({
    client_id: clientId,
    ux_mode: "popup",
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: false,
    use_fedcm_for_button: false,
    itp_support: true,
    callback: (response) => {
      const pending = googlePending;
      googlePending = null;
      if (!pending) return;
      if (response.credential) pending.resolve(response.credential);
      else pending.reject(new Error("Google did not return a credential."));
    },
  });
  googleInitialized = true;
}

/** Render the official GIS control over a custom button so Continue can post back to this tab. */
export async function mountGoogleButton(host: HTMLElement | null) {
  if (!host) return;
  await ensureGoogle();
  const googleId = window.google?.accounts.id;
  if (!googleId) throw new Error("Google sign-in failed to load.");
  host.replaceChildren();
  const width = Math.max(host.offsetWidth || host.parentElement?.offsetWidth || 320, 200);
  googleId.renderButton(host, {
    type: "standard",
    size: "large",
    ux_mode: "popup",
    width,
  });
  googleButton = host.querySelector<HTMLElement>("div[role=button]") ?? host;
}

async function ensureApple(): Promise<void> {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim();
  if (!clientId) return;
  await loadScript(APPLE_SRC, "apple-signin-js");
}

export async function preloadOauthProviders(): Promise<void> {
  googleReady = ensureGoogle();
  const jobs: Promise<void>[] = [googleReady];
  if (APPLE_SIGN_IN_ENABLED) jobs.push(ensureApple());
  await Promise.allSettled(jobs);
}

export function requestGoogleIdToken(opts?: { click?: boolean }): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return Promise.reject(new Error("Google sign-in is not configured."));
  }
  if (googleInFlight) return googleInFlight;

  const pending = new Promise<string>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      googlePending = null;
      reject(new Error("Google sign-in timed out. Try again."));
    }, 120_000);
    googlePending = {
      resolve: (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      reject: (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    };

    if (opts?.click === false) return;

    const click = () => {
      const prompt = window.google?.accounts.id.prompt;
      if (googleButton?.getAttribute("role") === "button") {
        googleButton.click();
        return;
      }
      prompt?.((notification) => {
        if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment() ||
          notification.isDismissedMoment()
        ) {
          const waiting = googlePending;
          googlePending = null;
          waiting?.reject(new Error("Google sign-in was cancelled."));
        }
      });
    };

    if (googleButton) {
      click();
      return;
    }

    (googleReady ?? ensureGoogle())
      .then(() => {
        if (!googleButton) {
          googlePending = null;
          reject(new Error("Google sign-in failed to load."));
          return;
        }
        click();
      })
      .catch((err) => {
        googlePending = null;
        reject(err instanceof Error ? err : new Error("Google sign-in failed to load."));
      });
  });

  const tracked = pending.finally(() => {
    if (googleInFlight === tracked) googleInFlight = null;
  });
  googleInFlight = tracked;
  return tracked;
}

export function requestAppleIdentityToken(): Promise<{
  identityToken: string;
  firstName?: string;
  lastName?: string;
}> {
  const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID?.trim();
  const redirectURI =
    process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI?.trim() ||
    (typeof window !== "undefined" ? window.location.origin : "");

  if (!clientId) {
    return Promise.reject(new Error("Apple sign-in is not configured."));
  }

  const appleAuth = window.AppleID?.auth;
  if (!appleAuth) {
    return Promise.reject(new Error("Apple sign-in is not configured."));
  }

  appleAuth.init({
    clientId,
    scope: "name email",
    redirectURI,
    usePopup: true,
  });

  return appleAuth.signIn().then((result) => {
    const identityToken = result.authorization?.id_token;
    if (!identityToken) {
      throw new Error("Apple did not return an identity token.");
    }
    return {
      identityToken,
      firstName: result.user?.name?.firstName,
      lastName: result.user?.name?.lastName,
    };
  });
}
