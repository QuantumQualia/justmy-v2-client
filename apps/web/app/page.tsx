import { Metadata } from "next";
import LandingPage from "./page-client";

export const metadata: Metadata = {
  title: "Personal Operating System for Your Life, Business, and Community",
  description: "Don't just live in the city. Run it. The first Personal Operating System for your life, business, and community. Choose from Personal OS, Business OS, Growth OS, or Founders OS.",
  openGraph: {
    title: "JustMy.com - Personal Operating System",
    description: "Don't just live in the city. Run it. The first Personal Operating System for your life, business, and community.",
  },
};

export default function HomePage() {
  return <LandingPage />;
}
