import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { Card } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";

type Tone = "default" | "muted" | "inverse";

const TONE_CLASS: Record<Tone, string> = {
  default: "",
  muted: "bg-muted/60",
  inverse: "bg-foreground text-background",
};

export function MarketingPage({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("bg-background text-foreground", className)}>{children}</main>;
}

export function MarketingSection({
  id,
  tone = "default",
  className,
  innerClassName,
  children,
}: {
  id?: string;
  tone?: Tone;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20", TONE_CLASS[tone], className)}>
      <div className={cn("mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-xs font-extrabold uppercase tracking-[0.14em] text-primary", className)}>
      {children}
    </p>
  );
}

export function GradientText({ children }: { children: ReactNode }) {
  return <span className="bg-brand-gradient bg-clip-text text-transparent">{children}</span>;
}

export function SectionHead({
  eyebrow,
  title,
  description,
  align = "center",
  inverse = false,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl sm:mb-12",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow className={cn("mb-3", inverse && "text-background/70")}>{eyebrow}</Eyebrow> : null}
      <h2 className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">{title}</h2>
      {description ? (
        <p
          className={cn(
            "mt-3 text-base leading-relaxed",
            inverse ? "text-background/75" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function MarketingHero({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden", className)}>
      <div className="mx-auto w-full max-w-4xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pb-20 sm:pt-24">
        {eyebrow ? <Eyebrow className="mb-4">{eyebrow}</Eyebrow> : null}
        <h1 className="font-serif text-4xl leading-[1.08] tracking-tight sm:text-6xl">{title}</h1>
        {description ? (
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
        {children}
      </div>
    </section>
  );
}

export type Step = { title: ReactNode; body: ReactNode };

export function StepsGrid({
  steps,
  inverse = false,
  className,
}: {
  steps: Step[];
  inverse?: boolean;
  className?: string;
}) {
  return (
    <ol
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        steps.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {steps.map((step, index) => (
        <li
          key={index}
          className={cn(
            "justmy-corners-xl border p-6",
            inverse ? "border-background/15 bg-background/5" : "border-border bg-card shadow-card",
          )}
        >
          <span
            className={cn(
              "mb-4 inline-flex size-8 items-center justify-center justmy-corners-sm text-sm font-extrabold",
              inverse ? "bg-background/15 text-background" : "bg-secondary text-secondary-foreground",
            )}
          >
            {index + 1}
          </span>
          <h3 className="text-base font-bold">{step.title}</h3>
          <p
            className={cn(
              "mt-1.5 text-sm leading-relaxed",
              inverse ? "text-background/75" : "text-muted-foreground",
            )}
          >
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function CheckList({
  items,
  inverse = false,
  className,
}: {
  items: ReactNode[];
  inverse?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-sm leading-relaxed">
          <Check
            className={cn("mt-0.5 size-4 shrink-0", inverse ? "text-background" : "text-primary")}
            aria-hidden
          />
          <span className={inverse ? "text-background/85" : "text-muted-foreground"}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TierCard({
  tag,
  title,
  body,
  items,
  action,
  featured = false,
}: {
  tag: string;
  title: string;
  body: ReactNode;
  items: ReactNode[];
  action: ReactNode;
  featured?: boolean;
}) {
  return (
    <Card
      className={cn(
        "gap-0 p-7",
        featured && "border-transparent bg-foreground text-background",
      )}
    >
      <span
        className={cn(
          "mb-4 w-fit rounded-full px-3 py-1 text-[11px] font-extrabold tracking-wide",
          featured ? "bg-background/15 text-background" : "bg-secondary text-secondary-foreground",
        )}
      >
        {tag}
      </span>
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className={cn("mt-3 text-sm leading-relaxed", featured ? "text-background/75" : "text-muted-foreground")}>
        {body}
      </p>
      <CheckList items={items} inverse={featured} className="mb-7 mt-5 flex-1" />
      <div className="[&>*]:w-full">{action}</div>
    </Card>
  );
}

export function FeatureCard({
  icon,
  title,
  body,
  tag,
  children,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body: ReactNode;
  tag?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="gap-0 p-6">
      {icon ? (
        <span className="mb-4 inline-flex size-11 items-center justify-center justmy-corners-sm bg-secondary text-primary [&_svg]:size-5">
          {icon}
        </span>
      ) : null}
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {children}
      {tag ? (
        <span className="mt-4 w-fit rounded-full bg-accent px-3 py-1 text-[11px] font-extrabold tracking-wide text-accent-foreground">
          {tag}
        </span>
      ) : null}
    </Card>
  );
}

export function StatStrip({ stats, className }: { stats: Array<{ value: string; label: string }>; className?: string }) {
  return (
    <div className={cn("bg-secondary/60", className)}>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-center sm:grid-cols-3 sm:px-6">
        {stats.map((stat) => (
          <div key={stat.value}>
            <p className="font-serif text-3xl text-secondary-foreground">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ImagePlaceholder({
  label,
  spec,
  className,
}: {
  label: string;
  spec?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center justmy-corners-xl border-2 border-dashed border-primary/30 bg-secondary/60 p-6 text-center",
        className,
      )}
      role="img"
      aria-label={label}
    >
      <p className="text-xs font-extrabold tracking-wide text-secondary-foreground">{label}</p>
      {spec ? <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">{spec}</p> : null}
    </div>
  );
}

export function CtaBand({
  id,
  title,
  description,
  actions,
}: {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 bg-foreground text-background">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
        {description ? (
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-background/70">{description}</p>
        ) : null}
        {actions ? <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function DraftBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-start gap-2 justmy-corners border border-primary/30 bg-accent px-4 py-2.5 text-xs font-bold text-accent-foreground",
        className,
      )}
    >
      <span aria-hidden>&#9888;</span>
      <span>{children}</span>
    </p>
  );
}
