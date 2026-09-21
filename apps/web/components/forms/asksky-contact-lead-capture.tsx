import * as React from "react";
import type {
  AskSkyPersistLeadCaptureArgs,
  AskSkyRenderContactLeadCapture,
  SkyResolveContactForm,
} from "@workspace/asksky-embed";
import { DynamicForm } from "@/components/forms/dynamic-form";
import { formsService } from "@/lib/services/forms";

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

  const frame = "asksky-sky-form px-3 py-3";

  if (done) {
    return (
      <p className="text-xs" style={{ color: "var(--asksky-ready-fg)" }}>
        Thanks — we received your details and will follow up.
      </p>
    );
  }

  return (
    <div className={frame}>
      <p
        className="mb-2 text-xs font-medium"
        style={{ color: "var(--asksky-text)" }}
      >
        Need a human? Share your contact details below.
      </p>
      {loadError ? (
        <p className="text-xs text-red-300">{loadError}</p>
      ) : !schema ? (
        <p className="text-xs" style={{ color: "var(--asksky-muted)" }}>Loading form…</p>
      ) : (
        <DynamicForm
          schema={schema}
          variant={formVariant}
          submitting={submitting}
          submitLabel="Submit"
          submitButtonClassName="h-11 rounded-full asksky-sky-send text-sm font-medium"
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
