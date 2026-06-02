import * as React from "react";
import type {
  AskSkyPersistLeadCaptureArgs,
  AskSkyRenderContactLeadCapture,
  SkyResolveContactForm,
} from "@workspace/asksky-embed";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { formsService } from "@/lib/services/forms";
import { cn } from "@workspace/ui/lib/utils";

type LeadCtx = {
  contactForm: SkyResolveContactForm;
  profileSlug: string;
  agentToken: string;
  visualVariant: "embed-inline" | "glass" | "default";
  persistLeadInConversation?: (args: AskSkyPersistLeadCaptureArgs) => Promise<void>;
};

/**
 * myFORM lead capture for AskSKY — rendered inline in the conversation thread after a refusal
 * (see `showContactForm` on assistant messages in `@workspace/asksky-embed`).
 */
export function createAskSkyContactLeadCaptureRenderer(): AskSkyRenderContactLeadCapture {
  return function AskSkyContactLeadCapture(ctx) {
    return <AskSkyContactLeadCaptureInner {...ctx} />;
  };
}

function AskSkyContactLeadCaptureInner({
  contactForm,
  visualVariant,
  persistLeadInConversation,
}: LeadCtx) {
  const embedChrome = visualVariant === "embed-inline";
  /** Preview card uses slate bubbles; iframe/chatbot use zinc embed chrome. */
  const formVariant = embedChrome ? "embed" : "default";
  const [schema, setSchema] = React.useState<Record<string, unknown> | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await formsService.getPublicFormSchema(contactForm.slug);
        if (cancelled) {
          return;
        }
        setSchema(data.schema ?? {});
        setLoadError(null);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load form.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [contactForm.slug]);

  const frame = cn(
    "rounded-xl rounded-br-none border px-3 py-3",
    embedChrome
      ? "border-white/10 bg-black/25 shadow-inner"
      : "border-slate-600/70 bg-slate-800/90 shadow-sm",
  );

  if (done) {
    return (
      <p
        className={cn(
          "text-xs",
          embedChrome ? "text-emerald-300" : "text-emerald-400",
        )}
      >
        Thanks — we received your details and will follow up.
      </p>
    );
  }

  return (
    <div className={frame}>
      <p
        className={cn(
          "mb-2 text-xs font-medium",
          embedChrome ? "text-zinc-200" : "text-slate-200",
        )}
      >
        Need a human? Share your contact details below.
      </p>
      {loadError ? (
        <p className="text-xs text-red-300">{loadError}</p>
      ) : !schema ? (
        <p className={cn("text-xs", embedChrome ? "text-zinc-400" : "text-slate-400")}>Loading form…</p>
      ) : (
        <DynamicForm
          schema={schema}
          variant={formVariant}
          submitting={submitting}
          submitLabel="Submit"
          submitButtonClassName={
            embedChrome
              ? "h-11 rounded-full asksky-embed-send text-sm font-medium"
              : "h-11 rounded-2xl rounded-br-none bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
          }
          onSubmit={async (answers) => {
            setSubmitting(true);
            try {
              await formsService.submitPublicForm(contactForm.slug, {
                answers,
                source: "asksky",
              });
              await persistLeadInConversation?.({
                answers,
                formTitle: contactForm.title,
                schema: schema ?? {},
              });
              setDone(true);
            } catch (e) {
              setLoadError(e instanceof Error ? e.message : "Submit failed.");
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}
    </div>
  );
}
