import { Metadata } from "next";
import { Suspense } from "react";
import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your JustMy account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-foreground">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
