import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="text-xl font-semibold">Page not found</h1>
      <Link href="/dashboard" className="text-sm text-accent-strong underline-offset-4 hover:underline">
        Back to the dashboard
      </Link>
    </main>
  );
}
