import type { TranscriptLine } from "@/lib/functions/transcript";
import { fileStem } from "@/lib/functions/transcript";

const GMAIL_BODY_MAX = 1500;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function winAnsi(value: string) {
  return value.replace(/[^\t\n\r\x20-\x7E]/g, (ch) => {
    const map: Record<string, string> = {
      "\u2018": "'",
      "\u2019": "'",
      "\u201C": '"',
      "\u201D": '"',
      "\u2013": "-",
      "\u2014": "-",
      "\u2026": "...",
    };
    return map[ch] || " ";
  });
}

function wrapPdfLine(
  text: string,
  font: { widthOfTextAtSize: (value: string, size: number) => number },
  size: number,
  maxWidth: number,
) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      current = next;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  return lines;
}

export async function copyText(text: string) {
  const value = text.trim();
  if (!value) throw new Error("Nothing to copy");
  await navigator.clipboard.writeText(value);
}

export async function downloadConversationPdf(title: string, lines: TranscriptLine[]) {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pageSize: [number, number] = [612, 792];
  const margin = 48;
  const width = pageSize[0] - margin * 2;
  const titleSize = 16;
  const bodySize = 11;
  const lineHeight = 16;
  let page = doc.addPage(pageSize);
  let y = pageSize[1] - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed >= margin) return;
    page = doc.addPage(pageSize);
    y = pageSize[1] - margin;
  };

  const heading = winAnsi(title.trim() || "Battle Plan");
  for (const line of wrapPdfLine(heading, bold, titleSize, width)) {
    ensureSpace(22);
    page.drawText(line, { x: margin, y, size: titleSize, font: bold, color: rgb(0.09, 0.09, 0.21) });
    y -= 22;
  }
  y -= 8;

  for (const entry of lines) {
    ensureSpace(lineHeight * 2);
    page.drawText(winAnsi(entry.speaker), {
      x: margin,
      y,
      size: 10,
      font: bold,
      color: rgb(0.42, 0.25, 0.76),
    });
    y -= lineHeight;
    const wrapped = wrapPdfLine(winAnsi(entry.text), font, bodySize, width);
    for (const line of wrapped.length ? wrapped : [""]) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size: bodySize, font, color: rgb(0.12, 0.16, 0.23) });
      y -= lineHeight;
    }
    y -= 10;
  }

  const bytes = await doc.save();
  downloadBlob(new Blob([bytes], { type: "application/pdf" }), `${fileStem(title)}.pdf`);
}

export async function downloadConversationDocx(title: string, lines: TranscriptLine[]) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const children = [
    new Paragraph({
      text: title.trim() || "Battle Plan",
      heading: HeadingLevel.HEADING_1,
    }),
  ];
  for (const entry of lines) {
    children.push(
      new Paragraph({
        spacing: { before: 240 },
        children: [new TextRun({ text: entry.speaker, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun(entry.text)],
      }),
    );
  }
  const blob = await Packer.toBlob(
    new Document({
      sections: [{ children }],
    }),
  );
  downloadBlob(
    blob,
    `${fileStem(title)}.docx`,
  );
}

export async function draftInGmail(subject: string, body: string) {
  await copyText(body);
  const trimmed = body.trim();
  const truncated =
    trimmed.length > GMAIL_BODY_MAX
      ? `${trimmed.slice(0, GMAIL_BODY_MAX)}\n\n[Full text copied — paste the rest.]`
      : trimmed;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
  const win = window.open(gmail, "_blank", "noopener,noreferrer");
  if (!win) {
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(truncated)}`;
  }
}
