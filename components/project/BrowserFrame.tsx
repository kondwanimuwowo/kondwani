import Image from "next/image"
import { cn } from "@/lib/utils"
import { RevealImage } from "@/components/ui/RevealImage"

interface BrowserFrameProps {
  src: string
  alt: string
  host?: string | null
  sizes: string
  priority?: boolean
  pan?: boolean
  autoHeight?: boolean
  // Unfold the screenshot the first time it scrolls into view
  reveal?: boolean
  elevation?: "flat" | "raised" | "lifted"
  className?: string
}

const elevations = {
  flat: "shadow-frame-flat",
  raised: "shadow-frame",
  lifted: "shadow-frame-lift",
}

// Images always show their full width. Tall ones are cut at the bottom and scroll down on hover when `pan` is set.
// `autoHeight` shows the whole image at its natural aspect ratio instead of filling a fixed box.
export function BrowserFrame({ src, alt, host, sizes, priority, pan, autoHeight, reveal, elevation = "raised", className }: BrowserFrameProps) {
  return (
    <div className={cn("group flex w-full flex-col overflow-hidden rounded-3xl bg-white transition-shadow duration-500", elevations[elevation], !autoHeight && "h-full", className)}>
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
        reveal ? (
          <RevealImage delay={0.35}>
            <Image src={src} alt={alt} width={1920} height={1080} sizes={sizes} priority={priority} draggable={false} className="h-auto w-full bg-surface" />
          </RevealImage>
        ) : (
          <Image src={src} alt={alt} width={1920} height={1080} sizes={sizes} priority={priority} draggable={false} className="h-auto w-full bg-surface" />
        )
      ) : (
        // Always full width, top-aligned; the size container lets the pan stop at the image's bottom edge
        <div className="relative flex-1 overflow-hidden bg-surface [container-type:size]">
          <Image
            src={src}
            alt={alt}
            width={1920}
            height={1080}
            sizes={sizes}
            priority={priority}
            draggable={false}
            className={cn(
              "h-auto w-full",
              pan && "transition-transform duration-[6000ms] ease-in-out group-hover:translate-y-[min(0px,calc(100cqh_-_100%))] motion-reduce:transition-none"
            )}
          />
        </div>
      )}
    </div>
  )
}
