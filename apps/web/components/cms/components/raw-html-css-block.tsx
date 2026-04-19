interface RawHtmlCssBlockProps {
  html?: string;
  customCss?: string;
}

/**
 * Renders trusted admin-authored HTML and optional CSS for a CMS page section.
 * Same trust model as {@link TextBlock} (dangerouslySetInnerHTML).
 */
export function RawHtmlCssBlock({ html = "", customCss = "" }: RawHtmlCssBlockProps) {
  const htmlStr = typeof html === "string" ? html : "";
  const cssStr = typeof customCss === "string" ? customCss : "";

  if (!htmlStr.trim() && !cssStr.trim()) {
    return null;
  }

  return (
    <div className="cms-raw-html-css-block w-full">
      {cssStr.trim() ? <style dangerouslySetInnerHTML={{ __html: cssStr }} /> : null}
      {htmlStr.trim() ? (
        <div className="raw-html-root [&_*]:max-w-none" dangerouslySetInnerHTML={{ __html: htmlStr }} />
      ) : null}
    </div>
  );
}
