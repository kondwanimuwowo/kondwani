import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrowserFrameProps {
  src: string
  alt: string
  host?: string | null
  sizes: string
  priority?: boolean
  pan?: boolean
  autoHeight?: boolean
  className?: string
}

// Tall full-page screenshots slowly scroll to the bottom on hover when `pan` is set.
// `autoHeight` shows the whole image at its natural aspect ratio instead of filling a fixed box.
export function BrowserFrame({ src, alt, host, sizes, priority, pan, autoHeight, className }: BrowserFrameProps) {
  return (
    <div className={cn("group flex w-full flex-col overflow-hidden rounded-3xl border-2 border-foreground bg-white shadow-xl", !autoHeight && "h-full", className)}>
      <div className="grid h-10 shrink-0 grid-cols-[1fr_auto_1fr] items-center bg-surface px-4">
        <div className="flex gap-2">
          <span className="h-3 w-3 rounded-full bg-border" />
          <span className="h-3 w-3 rounded-full bg-border" />
          <span className="h-3 w-3 rounded-full bg-border" />
        </div>
        {host && (
          <span className="hidden max-w-64 truncate rounded-full bg-white px-4 py-1 text-xs text-muted sm:block">
            {host}
          </span>
        )}
      </div>
      {autoHeight ? (
        <Image
          src={src}
          alt={alt}
          width={1920}
          height={1080}
          sizes={sizes}
          priority={priority}
          draggable={false}
          className="h-auto w-full bg-surface"
        />
      ) : (
        <div className="relative flex-1 overflow-hidden bg-surface">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            draggable={false}
            className={cn(
              "object-cover object-top",
              pan && "transition-[object-position] duration-[6000ms] ease-in-out group-hover:object-bottom motion-reduce:transition-none"
            )}
          />
        </div>
      )}
    </div>
  )
}
