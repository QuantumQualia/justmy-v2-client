import { redirect } from "next/navigation";

export default async function MyPlanRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/personal-os/plans/${id}`);
}
