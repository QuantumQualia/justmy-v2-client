"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isNewsHost } from "@/lib/hosts";

export function NewsHomeLink({
  className,
  children = "JustMy News",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [href, setHref] = useState("/news");

  useEffect(() => {
    setHref(isNewsHost(window.location.host) ? "/" : "/news");
  }, []);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
