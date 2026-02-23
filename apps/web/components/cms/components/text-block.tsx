interface TextBlockProps {
  content: any; // Rich text or HTML string
  alignment?: "left" | "center" | "right";
}

export function TextBlock({ content, alignment = "left" }: TextBlockProps) {
  // Get alignment class - using explicit classes instead of template literal for Tailwind
  const alignmentClass =
    alignment === "center"
      ? "text-center"
      : alignment === "right"
        ? "text-right"
        : "text-left";

  // Payload rich text is an array of nodes
  // For now, support both HTML strings (from Lexical editor) and Payload rich text
  const renderContent = () => {
    if (typeof content === "string") {
      // Lexical generates HTML with semantic elements (h1, h2, ul, ol, blockquote, etc.)
      // We style these to match the editor theme using CSS that mirrors Tailwind classes
      return (
        <>
          <style dangerouslySetInnerHTML={{
            __html: `
              .lexical-content { color: rgb(241 245 249); }
              .lexical-content h1 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin-bottom: 1rem; margin-top: 1.5rem; color: rgb(255 255 255); }
              .lexical-content h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 700; margin-bottom: 0.75rem; margin-top: 1.25rem; color: rgb(255 255 255); }
              .lexical-content h3 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 600; margin-bottom: 0.5rem; margin-top: 1rem; color: rgb(255 255 255); }
              .lexical-content h4 { font-size: 1.125rem; line-height: 1.75rem; font-weight: 600; margin-bottom: 0.5rem; margin-top: 0.75rem; color: rgb(255 255 255); }
              .lexical-content h5 { font-size: 1rem; line-height: 1.5rem; font-weight: 600; margin-bottom: 0.25rem; margin-top: 0.5rem; color: rgb(255 255 255); }
              .lexical-content h6 { font-size: 0.875rem; line-height: 1.25rem; font-weight: 600; margin-bottom: 0.25rem; margin-top: 0.5rem; color: rgb(255 255 255); }
              .lexical-content p { margin-bottom: 0.5rem; color: rgb(241 245 249); }
              .lexical-content blockquote { border-left: 4px solid rgb(100 116 139); padding-left: 1rem; font-style: italic; margin: 1rem 0; color: rgb(203 213 225); }
              .lexical-content pre { background-color: rgb(15 23 42); border: 1px solid rgb(51 65 85); border-radius: 0.375rem; padding: 1rem; margin: 1rem 0; font-family: ui-monospace, monospace; font-size: 0.875rem; overflow-x: auto; color: rgb(241 245 249); }
              .lexical-content code { background-color: rgb(30 41 59); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875rem; font-family: ui-monospace, monospace; color: rgb(241 245 249); }
              .lexical-content pre code { background-color: transparent; padding: 0; color: rgb(241 245 249); }
              .lexical-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.5rem; color: rgb(241 245 249); }
              .lexical-content ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.5rem; color: rgb(241 245 249); }
              .lexical-content li { margin-bottom: 0.25rem; color: rgb(241 245 249); }
              .lexical-content a { color: rgb(96 165 250); text-decoration: underline; }
              .lexical-content a:hover { color: rgb(147 197 253); }
              .lexical-content img { max-width: 100%; height: auto; margin: 1rem 0; }
              .lexical-content strong { font-weight: 600; color: rgb(255 255 255); }
              .lexical-content em { font-style: italic; }
              .lexical-content u { text-decoration: underline; }
              .lexical-content s { text-decoration: line-through; }
            `
          }} />
          <div
            className="lexical-content"
            // Content is authored by trusted admins in the CMS UI
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </>
      );
    }
    if (Array.isArray(content)) {
      // Legacy Payload rich text format
      return content.map((node: any, index: number) => {
        if (node.type === "paragraph") {
          return (
            <p key={index} className="mb-4 text-slate-100">
              {node.children?.map((child: any, i: number) => {
                if (child.bold) {
                  return <strong key={i} className="text-white font-semibold">{child.text}</strong>;
                }
                if (child.italic) {
                  return <em key={i} className="italic">{child.text}</em>;
                }
                return <span key={i}>{child.text}</span>;
              })}
            </p>
          );
        }
        return null;
      });
    }
    return <p className="text-slate-100">{JSON.stringify(content)}</p>;
  };

  return (
    <div className={`prose prose-invert max-w-none text-slate-100 ${alignmentClass}`}>
      {renderContent()}
    </div>
  );
}
