import { Metadata } from "next";
import DashboardLobby from "./dashboard-lobby";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Access your City OS Dashboard to manage your digital identity, profiles, and community connections.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardLobby />;
}
