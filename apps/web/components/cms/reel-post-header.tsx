"use client";

import { Globe, Share2 } from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import { SiFacebook, SiInstagram, SiX, SiYoutube } from "react-icons/si";
import { MycardProfileAvatar } from "@/components/mycard/mycard-cover-fallbacks";
import { MycardLiveContactBar } from "@/components/mycard/mycard-live-contact-bar";
import { MycardVideo } from "@/components/mycard/mycard-video";
import { openShare } from "@/components/common/share/share-store";
import { publicMycardUrl } from "@/lib/mycard/public-url";
import type { PayloadPost } from "@/lib/services/cms";

const ICON_BTN =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground/70 transition-colors hover:bg-accent";
const CTA =
  "block w-full justmy-corners border-[1.5px] border-border bg-[var(--hotlink-bg)] px-4 py-3 text-center text-sm font-medium text-foreground transition-all duration-200 hover:shadow-md active:scale-95";

function detailText(details: PayloadPost["details"], ...keys: string[]) {
  for (const key of keys) {
    const value = details?.[key]?.trim();
    if (value) return value;
  }
  return "";
}

function socialIcon(name: string) {
  const key = name.toLowerCase();
  if (key.includes("facebook")) return <SiFacebook className="h-4 w-4" />;
  if (key.includes("instagram")) return <SiInstagram className="h-4 w-4" />;
  if (key.includes("linkedin")) return <FaLinkedin className="h-4 w-4" />;
  if (key.includes("youtube")) return <SiYoutube className="h-4 w-4" />;
  if (key === "x" || key.includes("twitter")) return <SiX className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

export function ReelPostHeader({
  post,
  description,
  kicker,
}: {
  post: PayloadPost;
  description: string;
  kicker: string;
}) {
  const author = post.author?.slug ? post.author : null;
  const video = post.videoUrl?.trim() || "";
  const moreLabel = detailText(post.details, "moreInfoLabel", "more_info_label") || "More info";
  const moreLink = detailText(post.details, "moreInfoLink", "more_info_link");
  const cardUrl = author ? publicMycardUrl(author.slug) || `/${author.slug}` : "";
  const socials = (author?.socialLinks ?? []).filter((link) => link.link);
  const hotlinks = (author?.hotlinks ?? []).filter((link) => link.label && link.link);

  const shareCard = () => {
    if (!author) return;
    void openShare({
      title: author.name,
      description: author.tagline || "Check out this myCARD",
      url: cardUrl,
      imageUrl: author.banner || author.photo || undefined,
      entityLabel: "myCARD",
    });
  };

  return (
    <div className="grid grid-cols-1 items-stretch overflow-hidden justmy-corners-xl border border-border bg-card shadow-card lg:grid-cols-3">
      <aside className="hidden min-w-0 flex-col gap-4 border-border bg-card p-5 lg:flex lg:border-r">
        {author ? (
          <>
            <div className="flex justify-center">
              <a
                href={`/${author.slug}`}
                className="block h-24 w-24 overflow-hidden rounded-full border-4 border-border bg-card shadow-card"
                title={author.name}
              >
                <MycardProfileAvatar name={author.name || author.slug} photo={author.photo} />
              </a>
            </div>
            <h2 className="text-center text-xl font-bold text-foreground">
              <a href={`/${author.slug}`} className="hover:text-primary">
                {author.name || author.slug}
              </a>
            </h2>
            <MycardLiveContactBar
              isLightMycard
              contactActions={
                <>
                  <button type="button" className={ICON_BTN} title="Send myCARD" onClick={shareCard}>
                    <Share2 className="h-4 w-4" />
                  </button>
                  {author.website ? (
                    <a href={author.website} target="_blank" rel="noreferrer" className={ICON_BTN} title="Website">
                      <Globe className="h-4 w-4" />
                    </a>
                  ) : null}
                  {socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.link}
                      target="_blank"
                      rel="noreferrer"
                      className={ICON_BTN}
                      title={social.name || "Social"}
                    >
                      {socialIcon(social.name)}
                    </a>
                  ))}
                </>
              }
            />
            <div className="flex flex-col gap-2">
              {hotlinks.map((link) => (
                <a key={link.id} href={link.link} target="_blank" rel="noreferrer" className={CTA}>
                  <span className="min-w-0 truncate">{link.label}</span>
                </a>
              ))}
              <button type="button" className={CTA} onClick={shareCard}>
                Send myCARD
              </button>
              <a href={`/register?ref=${encodeURIComponent(author.slug)}`} className={CTA}>
                Get myCARD Free
              </a>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">myCARD</p>
        )}
      </aside>

      <section className="relative border-border bg-black lg:border-r">
        {video ? (
          <div className="relative aspect-[9/16] w-full">
            <div className="absolute inset-0">
              <MycardVideo url={video} title={post.title} fill dark bare />
            </div>
          </div>
        ) : null}
      </section>

      <aside className="flex min-w-0 flex-col justify-center gap-3 bg-muted p-6 sm:p-8">
        {kicker ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{kicker}</p> : null}
        <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">{post.title}</h1>
        {description ? <p className="text-sm leading-relaxed text-foreground">{description}</p> : null}
        {moreLink ? (
          <a href={moreLink} target="_blank" rel="noreferrer" className="text-sm text-primary underline underline-offset-2">
            {moreLabel}
          </a>
        ) : null}
      </aside>
    </div>
  );
}
