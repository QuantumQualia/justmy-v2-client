import Link from "next/link";

/** `/news` resolves on both the main host and the news host. */
export const NEWS_HOME_HREF = "/news";

export function NewsHomeLink({
  className,
  children = "JustMy News",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Link href={NEWS_HOME_HREF} className={className}>
      {children}
    </Link>
  );
}
