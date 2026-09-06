import type { Metadata } from "next"
import Image from "next/image"
import { OpenInNew, Circle, FitnessCenter, Casino } from "@mui/icons-material"
import { organizations, lifestyle } from "@/data/beyondCode"

export const metadata: Metadata = {
  title: "Beyond Code",
  description: "Kondwani Muwowo's purpose-driven work: fighting human trafficking with TAKUZA, supporting girls' education through GAN, and teaching forex trading to Zambian communities.",
  alternates: { canonical: "/beyond-code" },
  openGraph: {
    title: "Beyond Code, Kondwani Muwowo",
    description: "Purpose-driven work beyond development: anti-trafficking, nonprofit design, and community education.",
    url: "/beyond-code",
  },
}

const iconMap: Record<string, React.ElementType> = { FitnessCenter, Casino }

export default function BeyondCodePage() {
  return (
    <main className="min-h-screen bg-surface pt-32 pb-20">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
            Purpose-Driven Work
          </h1>
          <div className="h-1 w-20 bg-primary rounded-full mx-auto mb-6" />
          <p className="text-lg text-muted max-w-2xl mx-auto">
            Technology is a tool. The real work is building a better world, inside and outside of code.
          </p>
        </div>

        {/* Org cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="relative group overflow-hidden bg-white rounded-3xl shadow-md grayscale hover:grayscale-0 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500 flex flex-col min-h-[300px]"
            >
              {/* Content */}
              <div className="relative z-10 p-8 flex flex-col flex-1">
                {/* Logo + title/subtitle */}
                <div className="flex items-center gap-4 mb-5">
                  {org.logo ? (
                    <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 bg-white">
                      <Image src={org.logo} alt={org.title} fill className="object-contain" sizes="44px" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-primary-tint flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-xl">{org.title[0]}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold text-foreground text-xl leading-tight">{org.title}</h2>
                    <p className="text-sm text-muted">{org.subtitle}</p>
                  </div>
                </div>

                <p className="text-sm text-muted leading-relaxed flex-1">{org.description}</p>

                {/* Partner */}
                {org.partnerName && (
                  <div className="mt-6 flex items-center gap-2 pt-5 border-t border-border">
                    {org.partnerLogo && (
                      <div className="relative w-4 h-4 rounded overflow-hidden shrink-0">
                        <Image src={org.partnerLogo} alt={org.partnerName} fill className="object-contain" sizes="16px" />
                      </div>
                    )}
                    <p className="text-xs text-muted">In partnership with {org.partnerName}</p>
                  </div>
                )}

                {/* Status + link */}
                {(org.status || org.link) && (
                  <div className="mt-5 flex items-center justify-between pt-5 border-t border-border">
                    {org.status && (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted">
                        <Circle className="text-primary animate-pulse" sx={{ fontSize: 7 }} />
                        {org.status}
                      </span>
                    )}
                    {org.link && (
                      <a href={org.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover transition-colors ml-auto">
                        Visit site <OpenInNew sx={{ fontSize: 13 }} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Life outside the screen */}
        <div className="pt-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Life Outside the Screen</h2>
          <div className="flex flex-wrap gap-3">
            {lifestyle.map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <div key={item.label}
                  className="flex items-center gap-3 bg-white rounded-full px-6 py-3 shadow-md">
                  {Icon && <Icon className="text-primary" sx={{ fontSize: 20 }} />}
                  <div>
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="text-sm text-muted ml-2">, {item.description}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
