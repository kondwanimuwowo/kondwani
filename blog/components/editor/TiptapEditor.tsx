"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import CharacterCount from "@tiptap/extension-character-count"
import {
  FormatBold, FormatItalic, FormatListBulleted, FormatListNumbered,
  FormatQuote, Code, HorizontalRule, Undo, Redo, Link as LinkIcon,
  Image as ImageIcon,
} from "@mui/icons-material"
import { cn } from "@/lib/utils"
import { useCallback } from "react"

type Props = {
  content: string
  onChange: (html: string) => void
  onImageUpload?: (file: File) => Promise<string>
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted hover:text-foreground hover:bg-surface",
        disabled && "opacity-30 cursor-not-allowed"
      )}>
      {children}
    </button>
  )
}

export function TiptapEditor({ content, onChange, onImageUpload }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      CharacterCount,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: "prose-editor min-h-[400px] p-6 focus:outline-none text-foreground" },
    },
  })

  const addLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt("URL")
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(async () => {
    if (!editor) return
    if (onImageUpload) {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        const url = await onImageUpload(file)
        editor.chain().focus().setImage({ src: url }).run()
      }
      input.click()
    } else {
      const url = window.prompt("Image URL")
      if (url) editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor, onImageUpload])

  if (!editor) return null

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-surface">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")} title="Bold">
          <FormatBold sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")} title="Italic">
          <FormatItalic sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <span className="text-xs font-bold w-4 text-center">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <span className="text-xs font-bold w-4 text-center">H3</span>
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")} title="Bullet list">
          <FormatListBulleted sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")} title="Numbered list">
          <FormatListNumbered sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")} title="Blockquote">
          <FormatQuote sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")} title="Code block">
          <Code sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <HorizontalRule sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1" />
        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Add link">
          <LinkIcon sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} title="Insert image">
          <ImageIcon sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-1 ml-auto" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()} title="Undo">
          <Undo sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()} title="Redo">
          <Redo sx={{ fontSize: 18 }} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <div className="px-4 py-2 border-t border-border flex justify-end">
        <span className="text-xs text-muted/60">
          {editor.storage.characterCount.words()} words
        </span>
      </div>
    </div>
  )
}
