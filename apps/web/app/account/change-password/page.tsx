import { Metadata } from "next";
import ChangePasswordForm from "./change-password-form";

export const metadata: Metadata = {
  title: "Change Password",
  description: "Update your JustMy account password.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ChangePasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4.1rem)] bg-background text-foreground flex items-center justify-center p-4">
      <ChangePasswordForm />
    </div>
  );
}
