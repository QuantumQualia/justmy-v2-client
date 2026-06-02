import { apiRequest, ApiClientError } from "../api-client";

export type FormStatus = "draft" | "published";
export type FormSource = "embed" | "page" | "asksky";

export interface FormDefinitionDto {
  id: number;
  profileId?: number;
  name: string;
  slug: string;
  status: FormStatus;
  schema: Record<string, unknown>;
  publishedVersion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PublicFormSchemaDto {
  id: number;
  name: string;
  slug: string;
  publishedVersion: number;
  schema: Record<string, unknown>;
}

export interface FormSubmissionListItemDto {
  id: number;
  schemaVersion: number;
  /** Submitted field values (same shape as public submit `answers`). */
  answers: Record<string, unknown>;
  source: FormSource | string;
  submittedOrigin?: string | null;
  submittedReferer?: string | null;
  userId?: number | null;
  createdAt: string;
}

export interface FormSubmissionsPageDto {
  total: number;
  take: number;
  skip: number;
  submissions: FormSubmissionListItemDto[];
}

export interface FormsListPageDto {
  total: number;
  take: number;
  skip: number;
  forms: FormDefinitionDto[];
}

export interface SubmitFormResponseDto {
  id: number;
  createdAt: string;
}

const paths = {
  list: () => "profiles/forms",
  one: (id: number | string) => `profiles/forms/${id}`,
  publish: (id: number | string) => `profiles/forms/${id}/publish`,
  submissions: (id: number | string) => `profiles/forms/${id}/submissions`,
  submission: (formId: number | string, submissionId: number | string) =>
    `profiles/forms/${formId}/submissions/${submissionId}`,
  publicSchema: (slug: string) => `forms/${encodeURIComponent(slug)}`,
  publicSubmit: (slug: string) => `forms/${encodeURIComponent(slug)}/submit`,
};

function extractForm(payload: unknown): FormDefinitionDto {
  const p = payload as Record<string, unknown>;
  if (typeof p.id === "number") {
    return p as unknown as FormDefinitionDto;
  }
  const raw = (p.form ?? p.data) as Record<string, unknown> | undefined;
  if (raw && typeof raw.id === "number") {
    return raw as unknown as FormDefinitionDto;
  }
  throw new ApiClientError("Form response is missing form data.");
}

export const formsService = {
  listProfileForms(params?: { q?: string; take?: number; skip?: number }): Promise<FormsListPageDto> {
    const take = Math.min(100, Math.max(1, params?.take ?? 50));
    const skip = Math.max(0, params?.skip ?? 0);
    const p: Record<string, string | number> = { take, skip };
    const qTrim = params?.q?.trim();
    if (qTrim) {
      p.q = qTrim.slice(0, 200);
    }
    return apiRequest<FormsListPageDto>(paths.list(), { params: p }).then((data) => ({
      total: typeof data.total === "number" ? data.total : (Array.isArray(data.forms) ? data.forms.length : 0),
      take: typeof data.take === "number" ? data.take : take,
      skip: typeof data.skip === "number" ? data.skip : skip,
      forms: Array.isArray(data.forms) ? data.forms : [],
    }));
  },

  getProfileForm(id: number | string): Promise<FormDefinitionDto> {
    return apiRequest<unknown>(paths.one(id)).then((body) => extractForm(body));
  },

  createProfileForm(body: { name: string; schema: Record<string, unknown> }): Promise<FormDefinitionDto> {
    return apiRequest<unknown>(paths.list(), {
      method: "POST",
      body: JSON.stringify(body),
    }).then((res) => extractForm(res));
  },

  updateProfileForm(
    id: number | string,
    body: Partial<{ name: string; schema: Record<string, unknown>; status: FormStatus }>,
  ): Promise<FormDefinitionDto> {
    return apiRequest<unknown>(paths.one(id), {
      method: "PATCH",
      body: JSON.stringify(body),
    }).then((res) => extractForm(res));
  },

  deleteProfileForm(id: number | string): Promise<void> {
    return apiRequest<void>(paths.one(id), { method: "DELETE" });
  },

  publishProfileForm(id: number | string): Promise<FormDefinitionDto> {
    return apiRequest<unknown>(paths.publish(id), { method: "POST" }).then((res) => extractForm(res));
  },

  listSubmissions(
    formId: number | string,
    params?: { q?: string; take?: number; skip?: number },
  ): Promise<FormSubmissionsPageDto> {
    const take = Math.min(100, Math.max(1, params?.take ?? 50));
    const skip = Math.max(0, params?.skip ?? 0);
    const p: Record<string, string | number> = { take, skip };
    const qTrim = params?.q?.trim();
    if (qTrim) {
      p.q = qTrim.slice(0, 200);
    }
    return apiRequest<FormSubmissionsPageDto>(paths.submissions(formId), { params: p }).then(
      (data): FormSubmissionsPageDto => ({
        total: typeof data.total === "number" ? data.total : 0,
        take: typeof data.take === "number" ? data.take : take,
        skip: typeof data.skip === "number" ? data.skip : skip,
        submissions: (data.submissions ?? []).map((s): FormSubmissionListItemDto => ({
          ...(s as FormSubmissionListItemDto),
          answers:
            s.answers && typeof s.answers === "object" && !Array.isArray(s.answers)
              ? (s.answers as Record<string, unknown>)
              : {},
        })),
      }),
    );
  },

  /**
   * Optional admin detail for full lead payload (`answers`).
   * List submissions now include `answers`; this route is only needed if you fetch a single submission by id.
   */
  async tryGetSubmissionDetail(
    formId: number | string,
    submissionId: number | string,
  ): Promise<{ answers?: Record<string, unknown> } | null> {
    try {
      const data = await apiRequest<{ answers?: Record<string, unknown> }>(
        paths.submission(formId, submissionId),
      );
      return data ?? null;
    } catch (e) {
      if (e instanceof ApiClientError && e.statusCode === 404) {
        return null;
      }
      throw e;
    }
  },

  getPublicFormSchema(slug: string): Promise<PublicFormSchemaDto> {
    return apiRequest<PublicFormSchemaDto>(paths.publicSchema(slug), { skipAuth: true });
  },

  submitPublicForm(
    slug: string,
    body: { answers: Record<string, unknown>; source?: FormSource },
  ): Promise<SubmitFormResponseDto> {
    return apiRequest<SubmitFormResponseDto>(paths.publicSubmit(slug), {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        answers: body.answers,
        source: body.source ?? "page",
      }),
    });
  },
};

export const DEFAULT_MYFORM_SCHEMA: Record<string, unknown> = {
  fields: [
    { id: "email", type: "email", label: "Email", required: true },
    { id: "message", type: "textarea", label: "Message", required: false },
  ],
};
