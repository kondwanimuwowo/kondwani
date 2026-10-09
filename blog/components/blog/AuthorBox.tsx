import Image from "next/image"
import { ArrowForward } from "@mui/icons-material"
import { MAIN_SITE } from "@/lib/site"

export function AuthorBox() {
  return (
    <aside className="flex flex-col items-start gap-6 rounded-3xl bg-white p-8 shadow-md sm:flex-row sm:items-center">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-surface">
        <Image src={`${MAIN_SITE}/kondwani.png`} alt="Kondwani Muwowo" fill sizes="80px" className="object-cover" />
      </div>
      <div className="flex-1">
        <p className="mb-1 text-lg font-bold text-foreground">Kondwani Muwowo</p>
        <p className="leading-relaxed text-muted">
          Software developer in Lusaka, Zambia. I write about code, faith, chess, the gym and hiking.
        </p>
      </div>
      <a
        href={MAIN_SITE}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary"
      >
        See my work <ArrowForward sx={{ fontSize: 16 }} />
      </a>
    </aside>
  )
}
