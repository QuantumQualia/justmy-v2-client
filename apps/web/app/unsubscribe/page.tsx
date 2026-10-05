import type { Metadata } from "next";

import { UnsubscribeCard } from "@/components/marketing/unsubscribe-card";

export const metadata: Metadata = {
  title: "Unsubscribe",
  robots: { index: false },
};

type Props = { searchParams: Promise<{ e?: string; t?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { e = "", t = "" } = await searchParams;
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 py-16 text-foreground">
      <UnsubscribeCard email={e} token={t} />
    </main>
  );
}
