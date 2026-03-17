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
      // Lexical generates HTML with semantic elements (h1, h2, ul, ol, blockquote, etc.).
      // We rely on the global prose/typography styles and design tokens for colors.
      return (
        <div
          className="prose prose-invert max-w-none text-foreground"
          // Content is authored by trusted admins in the CMS UI
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
    }
    if (Array.isArray(content)) {
      // Legacy Payload rich text format
      return content.map((node: any, index: number) => {
        if (node.type === "paragraph") {
          return (
            <p key={index} className="mb-4 text-foreground">
              {node.children?.map((child: any, i: number) => {
                if (child.bold) {
                  return <strong key={i} className="font-semibold text-foreground">{child.text}</strong>;
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
    return <p className="text-foreground">{JSON.stringify(content)}</p>;
  };

  return (
    <div className={`prose prose-invert max-w-none text-foreground ${alignmentClass}`}>
      {renderContent()}
    </div>
  );
}
