import { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Request a password reset link for your JustMy account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-foreground">Loading...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
