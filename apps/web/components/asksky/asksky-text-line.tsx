import { MessageCircle } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";

const SMS_NUMBER = process.env.NEXT_PUBLIC_SKY_SMS_NUMBER?.trim() || "";
const SMS_KEYWORD = process.env.NEXT_PUBLIC_SKY_SMS_KEYWORD?.trim() || "SKY";

export function skySmsNumber() {
  return SMS_NUMBER;
}

/** "Or text SKY to 55752" — renders nothing until the Text SKY number is configured. */
export function AskSkyTextLine({ className }: { className?: string }) {
  if (!SMS_NUMBER) return null;
  const href = `sms:${SMS_NUMBER.replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(SMS_KEYWORD)}`;
  return (
    <p className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
      <MessageCircle className="size-3.5" aria-hidden />
      <span>
        Or text <b className="text-foreground">{SMS_KEYWORD}</b> to{" "}
        <a href={href} className="font-semibold text-primary hover:underline">
          {SMS_NUMBER}
        </a>
      </span>
    </p>
  );
}
