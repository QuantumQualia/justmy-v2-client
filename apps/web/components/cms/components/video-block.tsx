import { getVideoEmbedUrl } from "@/lib/utils/video";

interface VideoBlockProps {
  videoUrl: string;
  title?: string;
  description?: string;
}

export function VideoBlock({ videoUrl, title, description }: VideoBlockProps) {
  if (!videoUrl) return null;

  const embedUrl = getVideoEmbedUrl(videoUrl);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-4xl space-y-3">
        {title && (
          <h2 className="text-lg font-semibold text-foreground text-center">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>
        )}
        <div className="relative mt-2 w-full overflow-hidden rounded-lg rounded-br-none border border-border bg-muted">
          <div className="relative w-full pb-[56.25%]">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={title || "Embedded video"}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="absolute inset-0 h-full w-full"
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
