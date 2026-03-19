import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold tracking-tight">404</h1>
        <p className="mt-3 text-slate-300">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5"
          >
            Back Home
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-white/15 hover:bg-white/10 text-white font-bold px-6 py-2.5"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}

