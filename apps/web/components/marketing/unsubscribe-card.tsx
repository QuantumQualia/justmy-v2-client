"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";

import { apiRequest, ApiClientError } from "@/lib/api-client";

export function UnsubscribeCard({ email, token }: { email: string; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const valid = Boolean(email && token);

  async function unsubscribe() {
    setState("busy");
    try {
      await apiRequest("email/unsubscribe", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, token }),
      });
      setState("done");
    } catch (error) {
      setMessage(error instanceof ApiClientError ? error.message : "Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <Card className="w-full max-w-md gap-0 p-8 text-center">
      <h1 className="mb-3 font-serif text-2xl">
        {state === "done" ? "You're unsubscribed." : "Unsubscribe from JustMy invites"}
      </h1>
      {state === "done" ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          We won&apos;t send referral or invite emails to <b className="text-foreground">{email}</b> anymore.
        </p>
      ) : valid ? (
        <>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Stop referral and invite emails to <b className="text-foreground">{email}</b>. Account emails like password
            resets still arrive if you have an account.
          </p>
          <Button onClick={unsubscribe} disabled={state === "busy"} className="w-full">
            {state === "busy" ? "Unsubscribing…" : "Unsubscribe"}
          </Button>
          {state === "error" ? <p className="mt-3 text-sm text-destructive">{message}</p> : null}
        </>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground">
          This link is missing details. Use the unsubscribe link from the email you received.
        </p>
      )}
      <Button asChild variant="link" className="mt-4">
        <Link href="/">Back to JustMy</Link>
      </Button>
    </Card>
  );
}
