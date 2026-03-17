import type React from "react";

interface ImageBlockProps {
  image: string;
  title?: string;
  description?: string;
  linkUrl?: string;
}

export function ImageBlock({ image, title, description, linkUrl }: ImageBlockProps) {
  let src: string | null = null;
  if (typeof image === "string") {
    if (image.startsWith("http") || image.startsWith("/")) {
      src = image;
    }
  } else if (image && typeof image === "object" && "url" in image) {
    src = (image as { url?: string }).url || null;
  }

  if (!src) {
    // If backend hasn't resolved the key to a URL yet, render nothing
    // rather than a broken image.
    return null;
  }

  const imageElement = (
    <img
      src={src}
      alt={title || description || ""}
      className="mx-auto max-h-[600px] w-full max-w-4xl rounded-lg rounded-br-none border border-border object-contain bg-muted"
    />
  );

  return (
    <figure className="w-full">
      {linkUrl ? (
        <a href={linkUrl} target="_blank" rel="noreferrer" className="inline-block">
          {imageElement}
        </a>
      ) : (
        imageElement
      )}
      {(title || description) && (
        <figcaption className="mt-3 text-center text-sm text-muted-foreground space-y-1">
          {title && <div className="font-medium text-foreground">{title}</div>}
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </figcaption>
      )}
    </figure>
  );
}

