export function buildLocalBusinessJsonLd(profile: {
  name: string;
  about?: string | null;
  email?: string | null;
  website?: string | null;
  zipCode?: string | null;
  slug?: string;
  googleStarRating?: string | number | null;
  googleRatingCount?: number | null;
  googlePlaceId?: string | null;
  addresses?: Array<{ address?: string }>;
}) {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL || "https://justmy.com";
  const rating =
    profile.googleRatingCount && profile.googleStarRating
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(profile.googleStarRating),
          reviewCount: profile.googleRatingCount,
        }
      : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.name,
    description: profile.about || undefined,
    email: profile.email || undefined,
    url: profile.website || (profile.slug ? `${origin}/${profile.slug}` : origin),
    areaServed: profile.zipCode || undefined,
    address: profile.addresses?.[0]?.address
      ? { "@type": "PostalAddress", streetAddress: profile.addresses[0].address, postalCode: profile.zipCode || undefined }
      : undefined,
    identifier: profile.googlePlaceId || undefined,
    aggregateRating: rating,
  };
}
