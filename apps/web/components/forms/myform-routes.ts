/**
 * Query-driven myFORM UI on a CMS page path (e.g. `/{handle}/my-forms?myform=edit&formId=1`).
 */
export const MYFORM_QUERY = {
  view: "myform",
  formId: "formId",
} as const;

export type MyFormViewParam = "new" | "edit" | "submissions";

export function myFormPathOnly(pathOrUrl: string): string {
  const s = pathOrUrl.trim() || "/";
  const noQuery = s.split("?")[0] ?? s;
  return (noQuery.split("#")[0] ?? noQuery) || "/";
}

export function parseMyFormView(raw: string | null | undefined): MyFormViewParam | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "new" || v === "edit" || v === "submissions") {
    return v;
  }
  return null;
}

/** List view: pathname only (clears myFORM query params). */
export function myFormListHref(pathOnly: string): string {
  return myFormPathOnly(pathOnly);
}

export function myFormNewHref(pathOnly: string): string {
  const p = myFormPathOnly(pathOnly);
  return `${p}?${MYFORM_QUERY.view}=new`;
}

export function myFormEditHref(pathOnly: string, formId: string | number): string {
  const p = myFormPathOnly(pathOnly);
  const sp = new URLSearchParams();
  sp.set(MYFORM_QUERY.view, "edit");
  sp.set(MYFORM_QUERY.formId, String(formId));
  return `${p}?${sp.toString()}`;
}

export function myFormSubmissionsHref(pathOnly: string, formId: string | number): string {
  const p = myFormPathOnly(pathOnly);
  const sp = new URLSearchParams();
  sp.set(MYFORM_QUERY.view, "submissions");
  sp.set(MYFORM_QUERY.formId, String(formId));
  return `${p}?${sp.toString()}`;
}
