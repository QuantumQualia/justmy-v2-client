import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { profilesService } from "@/lib/services/profiles";
import { legacyPlainText } from "@/lib/legacy-html";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const directory = await profilesService.getCategoryDirectory(id);
  return { title: directory?.category.name || "Category" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const directory = await profilesService.getCategoryDirectory(id);
  if (!directory) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">{directory.category.name}</h1>
      {directory.profiles.length ? (
        <ul className="space-y-3">
          {directory.profiles.map((profile) => {
            const tagline = legacyPlainText(profile.tagline);
            return (
              <li key={profile.slug}>
                <Link
                  href={`/${encodeURIComponent(profile.slug)}`}
                  className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4 shadow-card transition-colors hover:border-primary/30 hover:bg-secondary"
                >
                  {profile.photo ? (
                    <img src={profile.photo} alt="" className="size-14 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="size-14 shrink-0 rounded-full bg-muted" />
                  )}
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{profile.name}</span>
                    {tagline ? (
                      <span className="mt-1 block truncate text-sm text-muted-foreground">{tagline}</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No profiles in this category yet.</p>
      )}
    </div>
  );
}
