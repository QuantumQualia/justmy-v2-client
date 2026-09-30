import type { ProfileData } from "@/lib/store";

function vcardEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function profileVCardText(data: ProfileData): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vcardEscape(data.name || data.slug || "Contact")}`];
  if (data.email?.trim()) lines.push(`EMAIL:${data.email.trim()}`);
  if (data.website?.trim()) lines.push(`URL:${data.website.trim()}`);
  for (const phone of data.phones ?? []) {
    if (phone.number?.trim()) {
      lines.push(`TEL;TYPE=${vcardEscape(phone.type || "VOICE")}:${phone.number.trim()}`);
    }
  }
  for (const address of data.addresses ?? []) {
    if (address.address?.trim()) {
      lines.push(`ADR:;;${vcardEscape(address.address.trim())};;;;`);
    }
  }
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

/** Download a contact card from the public profile fields. */
export function downloadProfileVCard(data: ProfileData): void {
  const blob = new Blob([profileVCardText(data)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(data.slug || "contact").replace(/[^\w.-]+/g, "-")}.vcf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
