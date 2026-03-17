"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  LexicalComposer,
  type InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  type LexicalCommand,
  type ElementFormatType,
} from "lexical";
import {
  HeadingNode,
  QuoteNode,
  $createHeadingNode,
  $createQuoteNode,
} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  ListNode,
  ListItemNode,
} from "@lexical/list";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { CodeNode, CodeHighlightNode } from "@lexical/code";
import {
  LinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";

// Shared theme for the text editor
const editorTheme = {
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-slate-800 px-1 py-0.5 rounded text-sm font-mono",
  },
  heading: {
    h1: "text-3xl font-bold mb-4 mt-6",
    h2: "text-2xl font-bold mb-3 mt-5",
    h3: "text-xl font-semibold mb-2 mt-4",
  },
  paragraph: "mb-2",
  quote:
    "border-l-4 border-slate-500 pl-4 italic my-4 text-slate-300",
  code: "bg-slate-900 border border-slate-700 rounded p-4 my-4 font-mono text-sm overflow-x-auto",
  list: {
    ul: "list-disc ml-6 mb-2",
    ol: "list-decimal ml-6 mb-2",
    listitem: "mb-1",
  },
  link: "text-blue-400 hover:text-blue-300 underline",
};

function ToolbarButton({
  label,
  onClick,
  isActive = false,
  title,
}: {
  label: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  title?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      title={title}
      className={`h-8 w-8 p-0 rounded border ${isActive
          ? "border-blue-500 bg-blue-500/20 text-blue-300"
          : "border-slate-600/60 text-slate-300 hover:text-white hover:bg-slate-700/70"
        }`}
    >
      {label}
    </Button>
  );
}

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [blockType, setBlockType] = useState<string>("paragraph");
  const [elementFormat, setElementFormat] =
    useState<ElementFormatType>("left");
  const [isLink, setIsLink] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();

      if ($isLinkNode(anchorNode.getParent() || anchorNode)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      const type = element.getType();
      if (type === "heading") {
        const tag = (element as any).__tag;
        setBlockType(tag);
      } else if (type === "quote") {
        setBlockType("quote");
      } else {
        setBlockType("paragraph");
      }

      const format = (element as any).__format;
      if (format) {
        setElementFormat(format);
      }
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, updateToolbar]);

  const dispatch = (command: LexicalCommand<any>, payload?: any) => {
    editor.dispatchCommand(command, payload as never);
  };

  const setHeading = (level: "h1" | "h2" | "h3") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      $setBlocksType(selection, () => $createHeadingNode(level));
    });
  };

  const setBlockTypeHandler = (type: "paragraph" | "quote") => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
      } else {
        // reset to paragraph by removing heading/quote
        const nodes = selection.getNodes();
        if (nodes.length > 0) {
          const first = nodes[0];
          if ($isElementNode(first)) {
            const text = first.getTextContent();
            first.clear();
            first.append(text as any);
          }
        }
      }
    });
  };

  const insertLink = () => {
    if (isLink) {
      dispatch(TOGGLE_LINK_COMMAND, null);
    } else {
      const url = window.prompt("Enter URL");
      if (url) {
        dispatch(TOGGLE_LINK_COMMAND, url);
      }
    }
  };

  const insertImage = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const html = `<img src="${url}" alt="" class="max-w-full h-auto my-4" />`;
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, "text/html");
      const nodes = $generateNodesFromDOM(editor, dom);
      if (nodes.length > 0) {
        selection.insertNodes(nodes);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-slate-800 bg-slate-900/80 px-2 py-2">
      {/* Block types */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
        <ToolbarButton
          label={<Type className="h-4 w-4" />}
          onClick={() => setBlockTypeHandler("paragraph")}
          isActive={blockType === "paragraph"}
          title="Paragraph"
        />
        <ToolbarButton
          label={<Heading1 className="h-4 w-4" />}
          onClick={() => setHeading("h1")}
          isActive={blockType === "h1"}
          title="Heading 1"
        />
        <ToolbarButton
          label={<Heading2 className="h-4 w-4" />}
          onClick={() => setHeading("h2")}
          isActive={blockType === "h2"}
          title="Heading 2"
        />
        <ToolbarButton
          label={<Heading3 className="h-4 w-4" />}
          onClick={() => setHeading("h3")}
          isActive={blockType === "h3"}
          title="Heading 3"
        />
      </div>

      {/* Inline formatting */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
        <ToolbarButton
          label={<Bold className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_TEXT_COMMAND, "bold")}
          isActive={isBold}
          title="Bold"
        />
        <ToolbarButton
          label={<Italic className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_TEXT_COMMAND, "italic")}
          isActive={isItalic}
          title="Italic"
        />
        <ToolbarButton
          label={<Underline className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_TEXT_COMMAND, "underline")}
          isActive={isUnderline}
          title="Underline"
        />
        <ToolbarButton
          label={<Strikethrough className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_TEXT_COMMAND, "strikethrough")}
          isActive={isStrikethrough}
          title="Strikethrough"
        />
        <ToolbarButton
          label={<Code className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_TEXT_COMMAND, "code")}
          isActive={isCode}
          title="Inline code"
        />
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
        <ToolbarButton
          label={<List className="h-4 w-4" />}
          onClick={() => dispatch(INSERT_UNORDERED_LIST_COMMAND, undefined)}
          title="Bullet list"
        />
        <ToolbarButton
          label={<ListOrdered className="h-4 w-4" />}
          onClick={() => dispatch(INSERT_ORDERED_LIST_COMMAND, undefined)}
          title="Numbered list"
        />
        <ToolbarButton
          label={<Quote className="h-4 w-4" />}
          onClick={() => setBlockTypeHandler("quote")}
          isActive={blockType === "quote"}
          title="Quote"
        />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
        <ToolbarButton
          label={<AlignLeft className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_ELEMENT_COMMAND, "left")}
          isActive={elementFormat === "left"}
          title="Align left"
        />
        <ToolbarButton
          label={<AlignCenter className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_ELEMENT_COMMAND, "center")}
          isActive={elementFormat === "center"}
          title="Align center"
        />
        <ToolbarButton
          label={<AlignRight className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_ELEMENT_COMMAND, "right")}
          isActive={elementFormat === "right"}
          title="Align right"
        />
        <ToolbarButton
          label={<AlignJustify className="h-4 w-4" />}
          onClick={() => dispatch(FORMAT_ELEMENT_COMMAND, "justify")}
          isActive={elementFormat === "justify"}
          title="Justify"
        />
      </div>

      {/* Links & images */}
      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
        <ToolbarButton
          label={<LinkIcon className="h-4 w-4" />}
          onClick={insertLink}
          isActive={isLink}
          title="Insert link"
        />
        <ToolbarButton
          label={<ImageIcon className="h-4 w-4" />}
          onClick={insertImage}
          title="Insert image"
        />
      </div>

      {/* History */}
      <div className="flex items-center gap-1">
        <ToolbarButton
          label={<Undo className="h-4 w-4" />}
          onClick={() => dispatch(UNDO_COMMAND, undefined)}
          title="Undo"
        />
        <ToolbarButton
          label={<Redo className="h-4 w-4" />}
          onClick={() => dispatch(REDO_COMMAND, undefined)}
          title="Redo"
        />
      </div>
    </div>
  );
}

function InitializeFromHtmlPlugin({ html, skipNext }: { html: string; skipNext: React.MutableRefObject<boolean> }) {
  const [editor] = useLexicalComposerContext();
  const lastHtmlRef = useRef<string>("");

  useEffect(() => {
    // Skip if this is an internal change (from our own onChange)
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }

    // Skip if HTML hasn't actually changed
    if (!html || html === lastHtmlRef.current) return;
    
    editor.update(() => {
      const root = $getRoot();
      const currentHtml = $generateHtmlFromNodes(editor, null);
      
      // Only update if the HTML is actually different from what's in the editor
      if (currentHtml !== html) {
        root.clear();
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");
        const nodes = $generateNodesFromDOM(editor, dom);
        root.append(...nodes);
        lastHtmlRef.current = html;
      }
    });
  }, [editor, html, skipNext]);

  return null;
}

export function PageBlockText({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const skipNextInit = useRef(false);
  
  const initialConfig: InitialConfigType = {
    namespace: "PageBlockText",
    theme: editorTheme,
    nodes: [
      HeadingNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      ListNode,
      ListItemNode,
      LinkNode,
    ],
    onError(error: Error) {
      // eslint-disable-next-line no-console
      console.error("Lexical error:", error);
    },
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="mt-2 rounded-md border border-slate-700 bg-black/50 relative">
        <ToolbarPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="px-4 py-3 min-h-[200px] text-sm text-slate-100 focus:outline-none prose prose-invert max-w-none" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <LinkPlugin />
        <HistoryPlugin />
        <InitializeFromHtmlPlugin html={value} skipNext={skipNextInit} />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            editorState.read(() => {
              const html = $generateHtmlFromNodes(editor, null);
              // Mark that we should skip the next initialization to prevent feedback loop
              skipNextInit.current = true;
              onChange(html);
            });
          }}
        />
      </div>
    </LexicalComposer>
  );
}

