import Link from "next/link";
import type { ProfileRelatedCategory } from "@/lib/store/profile-store";

function categoryHref(category: ProfileRelatedCategory) {
  if (category.legacyId) return `/category/${category.legacyId}`;
  if (category.slug) return `/category/${encodeURIComponent(category.slug)}`;
  return null;
}

export function MycardRelatedCategories({
  categories,
}: {
  categories?: ProfileRelatedCategory[] | null;
}) {
  const items = (categories ?? []).filter((category) => category.name?.trim());
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">Related Categories</h2>
      <ul className="space-y-2">
        {items.map((category) => {
          const href = categoryHref(category);
          const label = category.name.trim();
          return (
            <li key={`${category.legacyId ?? category.slug ?? label}`}>
              {href ? (
                <Link href={href} className="text-primary hover:underline">
                  {label}
                </Link>
              ) : (
                <span className="text-primary">{label}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
