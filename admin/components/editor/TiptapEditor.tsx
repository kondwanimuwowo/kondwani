"use client"

import { useCallback, useState } from "react"
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
import { toast } from "@/lib/toast"

type Props = {
  content: string
  onChange: (html: string) => void
  onImageUpload: (file: File) => Promise<string>
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
    <button type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        active ? "bg-primary-tint text-primary" : "text-muted hover:text-foreground hover:bg-white",
        disabled && "opacity-30 cursor-not-allowed"
      )}>
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />
}

export function TiptapEditor({ content, onChange, onImageUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Placeholder.configure({ placeholder: "Start writing..." }),
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
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link URL (leave empty to remove)", previous ?? "")
    if (url === null) return
    if (url === "") editor.chain().focus().unsetLink().run()
    else editor.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor) return
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setUploading(true)
      try {
        const url = await onImageUpload(file)
        editor.chain().focus().setImage({ src: url, alt: file.name.replace(/\.[^.]+$/, "") }).run()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Image upload failed")
      } finally {
        setUploading(false)
      }
    }
    input.click()
  }, [editor, onImageUpload])

  if (!editor) return <div className="rounded-3xl bg-white shadow-md min-h-[480px]" />

  return (
    <div className="rounded-3xl overflow-hidden bg-white shadow-md">
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-surface sticky top-0 z-10">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")} title="Bold">
          <FormatBold sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")} title="Italic">
          <FormatItalic sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })} title="Heading 2">
          <span className="text-xs font-bold w-4 inline-block text-center">H2</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })} title="Heading 3">
          <span className="text-xs font-bold w-4 inline-block text-center">H3</span>
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")} title="Bullet list">
          <FormatListBulleted sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")} title="Numbered list">
          <FormatListNumbered sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")} title="Quote">
          <FormatQuote sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")} title="Code block">
          <Code sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <HorizontalRule sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <Divider />
        <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Link">
          <LinkIcon sx={{ fontSize: 18 }} />
        </ToolbarButton>
        <ToolbarButton onClick={addImage} disabled={uploading} title={uploading ? "Uploading image" : "Insert image"}>
          {uploading
            ? <span className="block w-[18px] h-[18px] rounded-full border-2 border-primary-tint border-t-primary animate-spin" />
            : <ImageIcon sx={{ fontSize: 18 }} />}
        </ToolbarButton>
        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()} title="Undo">
            <Undo sx={{ fontSize: 18 }} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()} title="Redo">
            <Redo sx={{ fontSize: 18 }} />
          </ToolbarButton>
        </div>
      </div>
      <EditorContent editor={editor} />
      <div className="px-4 py-2 bg-surface flex justify-end">
        <span className="text-xs text-muted">{editor.storage.characterCount.words()} words</span>
      </div>
    </div>
  )
}
