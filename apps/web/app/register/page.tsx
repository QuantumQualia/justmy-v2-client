import { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your account on JustMy.com to start managing your digital identity and personal data. Join your local City OS to connect and save.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
