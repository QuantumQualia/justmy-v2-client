"use client";

export default function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-black">{children}</div>;
}
