import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrowserFrameProps {
  src: string
  alt: string
  host?: string | null
  sizes: string
  priority?: boolean
  pan?: boolean
  className?: string
}

// Tall full-page screenshots slowly scroll to the bottom on hover when `pan` is set
export function BrowserFrame({ src, alt, host, sizes, priority, pan, className }: BrowserFrameProps) {
  return (
    <div className={cn("group flex h-full w-full flex-col overflow-hidden rounded-3xl bg-white shadow-xl", className)}>
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
    </div>
  )
}
