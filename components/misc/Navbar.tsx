import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
      <Link href="/" className="text-xl font-bold tracking-tight">
        BurnoutGuard
      </Link>
      <div className="flex gap-6 text-sm font-medium">
        <Link
          href="/app/journal"
          className="px-4 py-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
        >
          Journal
        </Link>
        <Link
          href="/app/stats"
          className="px-4 py-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
        >
          Stats
        </Link>
        <Link
          href="/signin"
          className="px-4 py-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity"
        >
          Login
        </Link>
      </div>
    </nav>
  );
}
