"use client";

import { forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
} from "lucide-react";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded p-1.5 transition-colors ${
        active
          ? "bg-[#C9725B]/20 text-[#C9725B]"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export interface RichTextEditorRef {
  getHTML: () => string;
}

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  minHeight?: string;
  onChange?: (html: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  function RichTextEditor(
    { initialContent = "", placeholder = "Start writing...", minHeight = "200px", onChange },
    ref,
  ) {
    const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
    const modKey = isMac ? "\u2318" : "Ctrl+";

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder }),
      ],
      content: initialContent,
      editorProps: {
        attributes: {
          class: `prose prose-invert max-w-none px-4 py-3 focus:outline-none`,
          style: `min-height: ${minHeight}`,
        },
      },
      onUpdate: ({ editor: e }) => {
        onChange?.(e.getHTML());
      },
    });

    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() ?? "",
    }));

    return (
      <>
        {/* Toolbar */}
        <div
          className="flex items-center gap-0.5 border-b px-3 py-1.5"
          style={{ borderColor: "rgba(45, 90, 90, 0.3)" }}
        >
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold")}
            title={`Bold (${modKey}B)`}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic")}
            title={`Italic (${modKey}I)`}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            active={editor?.isActive("strike")}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            active={editor?.isActive("code")}
            title="Inline code"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <div
            className="mx-1 h-5 w-px"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive("heading", { level: 2 })}
            title="Heading"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              if (!editor) return;
              const chain = editor.chain().focus();
              if (editor.isActive("heading")) chain.setParagraph();
              chain.toggleBulletList().run();
            }}
            active={editor?.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              if (!editor) return;
              const chain = editor.chain().focus();
              if (editor.isActive("heading")) chain.setParagraph();
              chain.toggleOrderedList().run();
            }}
            active={editor?.isActive("orderedList")}
            title="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              if (!editor) return;
              const chain = editor.chain().focus();
              if (editor.isActive("heading")) chain.setParagraph();
              chain.toggleBlockquote().run();
            }}
            active={editor?.isActive("blockquote")}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <div
            className="mx-1 h-5 w-px"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.08)" }}
          />
          <ToolbarButton
            onClick={() => editor?.chain().focus().undo().run()}
            title={`Undo (${modKey}Z)`}
          >
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().redo().run()}
            title={`Redo (${modKey}${isMac ? "Shift+Z" : "Y"})`}
          >
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <style jsx global>{`
          .ProseMirror {
            color: white;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            color: #6b7280;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }
          .ProseMirror ul {
            list-style-type: disc;
            padding-left: 1.5em;
          }
          .ProseMirror ol {
            list-style-type: decimal;
            padding-left: 1.5em;
          }
          .ProseMirror h2 {
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 1em;
            margin-bottom: 0.5em;
          }
          .ProseMirror blockquote {
            border-left: 3px solid rgba(201, 114, 91, 0.4);
            padding-left: 1em;
            margin-left: 0;
            color: #9ca3af;
            font-style: italic;
          }
          .ProseMirror code {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 0.25em;
            padding: 0.15em 0.35em;
            font-size: 0.9em;
            color: #C9725B;
          }
          .ProseMirror s {
            text-decoration: line-through;
            color: #6b7280;
          }
        `}</style>
        <EditorContent editor={editor} />
      </>
    );
  },
);
