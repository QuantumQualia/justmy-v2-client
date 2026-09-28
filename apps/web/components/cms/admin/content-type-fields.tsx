"use client";

import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";

export type ContentDetails = Record<string, string>;

function field(details: ContentDetails, key: string) {
  return details[key] ?? "";
}

function setField(
  details: ContentDetails,
  key: string,
  value: string,
  onChange: (next: ContentDetails) => void,
) {
  onChange({ ...details, [key]: value });
}

/**
 * Specialty fields for an INFO_HUB (or CONTENT_HUB) type.
 * Unknown slugs still get the shared extra columns from the legacy settings table.
 */
export function ContentTypeFields({
  slug,
  details,
  onChange,
}: {
  slug: string;
  details: ContentDetails;
  onChange: (next: ContentDetails) => void;
}) {
  const key = slug.toLowerCase();
  const text = (name: string, label: string) => (
    <div key={name} className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        value={field(details, name)}
        onChange={(e) => setField(details, name, e.target.value, onChange)}
      />
    </div>
  );
  const area = (name: string, label: string) => (
    <div key={name} className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea
        id={name}
        value={field(details, name)}
        onChange={(e) => setField(details, name, e.target.value, onChange)}
      />
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {key.includes("event") && (
        <>
          {text("eventLocation", "Event location")}
          {text("eventFrom", "Starts")}
          {text("eventTo", "Ends")}
          {text("eventTicketPrice", "Ticket price")}
        </>
      )}
      {key.includes("sale") && (
        <>
          {text("saleStart", "Sale start")}
          {text("saleEnd", "Sale end")}
          {area("saleDisclaimer", "Sale disclaimer")}
        </>
      )}
      {key.includes("coupon") && (
        <>
          {text("couponExpirationDate", "Coupon expiration")}
          {area("couponDisclaimer", "Coupon disclaimer")}
        </>
      )}
      {key.includes("job") && (
        <>
          {text("jobType", "Job type")}
          {text("jobRemoteMode", "Remote")}
          {text("jobSalaryMin", "Salary min")}
          {text("jobSalaryMax", "Salary max")}
          {text("jobSalaryType", "Salary type")}
          {text("jobHoursPerWeek", "Hours per week")}
          {area("jobBenefits", "Benefits")}
          {area("jobSchedule", "Schedule")}
          {area("jobApplicationEmails", "Application emails")}
        </>
      )}
      {key.includes("home") && text("homeListingPrice", "Listing price")}
      {text("moreInfoLabel", "More info label")}
      {text("moreInfoLink", "More info link")}
    </div>
  );
}

export function detailsFromRecord(raw: Record<string, unknown> | null | undefined): ContentDetails {
  const next: ContentDetails = {};
  if (!raw) return next;
  for (const [key, value] of Object.entries(raw)) {
    if (value == null) continue;
    next[key] = String(value);
  }
  return next;
}
