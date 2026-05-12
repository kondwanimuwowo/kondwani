export interface Organization {
  id: string
  title: string
  subtitle: string
  description: string
  details: string
  logo: string | null
  link: string | null
  status?: string
  partnerLogo?: string
  partnerName?: string
}

export interface Lifestyle {
  icon: string
  label: string
  description: string
}

export const organizations: Organization[] = [
  {
    id: "takuza",
    title: "TAKUZA",
    subtitle: "Talitha Kum Zambia",
    description:
      "Serving as a Transit Monitor with the global Talitha Kum network — a Catholic religious initiative fighting human trafficking at border crossings, bus terminals, and transit hubs across Zambia.",
    details: "Transit Monitor | Anti-Human Trafficking",
    logo: "/images/logos/takuza-logo.png",
    link: null,
    partnerLogo: "/images/logos/lovejustice-logo.png",
    partnerName: "Love Justice International",
  },
  {
    id: "gan",
    title: "The Great Achievers Network",
    subtitle: "Volunteer Developer & Designer",
    description:
      "GAN supports vulnerable girls in Zambia with education, mentorship, and practical skills. I contribute as a volunteer developer and designer, building the digital face of their mission.",
    details: "Volunteer Developer & Designer",
    logo: "/images/logos/gan-logo.png",
    link: "https://greatachieversnetwork.org",
    status: "Volunteer",
  },
  {
    id: "smilefx",
    title: "Smile FX Traders",
    subtitle: "Instructor",
    description:
      "Teaching forex trading fundamentals and technical analysis to Zambian traders. Building a community platform to bridge the financial literacy gap and create sustainable income paths.",
    details: "Instructor & Platform Developer",
    logo: "/images/logos/smilefxtraders.png",
    link: "https://smilefxtraders.com",
    status: "Coming Soon",
  },
]

export const lifestyle: Lifestyle[] = [
  {
    icon: "FitnessCenter",
    label: "Fitness",
    description: "Gym 5–6 days a week",
  },
  {
    icon: "Casino",
    label: "Chess",
    description: "Strategic thinking on and off the board",
  },
]
