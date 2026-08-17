"use client";

import { Loader2 } from "lucide-react";

type AuthSocialButtonsProps = {
  loading: boolean;
  onGoogle: () => void;
  onApple?: () => void;
  showApple?: boolean;
};

export function AuthSocialButtons({
  loading,
  onGoogle,
  onApple,
  showApple = false,
}: AuthSocialButtonsProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={onGoogle}
        disabled={loading}
        className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <GoogleMark />
        )}
        Continue with Google
      </button>
      {showApple && onApple ? (
        <button
          type="button"
          onClick={onApple}
          disabled={loading}
          className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-full bg-black text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <AppleMark />
          )}
          Continue with Apple
        </button>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.55-5.17 3.55-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.97-1.07 7.96-2.93l-3.88-3c-1.08.73-2.47 1.16-4.08 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.27V6.64H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.36l4-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.96 1.14 15.24 0 12 0 7.31 0 3.2 2.69 1.27 6.64l4 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.37 12.63c.03-2.1 1.72-3.11 1.8-3.16-1-1.45-2.54-1.65-3.08-1.67-1.3-.13-2.55.77-3.21.77-.67 0-1.69-.75-2.78-.73-1.43.02-2.75.83-3.48 2.12-1.49 2.58-.38 6.4 1.07 8.49.71 1.02 1.56 2.17 2.67 2.13 1.07-.04 1.48-.7 2.77-.7 1.28 0 1.65.7 2.78.68 1.15-.02 1.88-1.04 2.58-2.07.82-1.19 1.16-2.34 1.18-2.4-.03-.01-2.25-.86-2.3-3.46zM14.7 6.4c.59-.71 1-1.7.89-2.69-.86.03-1.9.57-2.51 1.28-.55.63-1.04 1.65-.91 2.62.96.07 1.94-.49 2.53-1.21z" />
    </svg>
  );
}
