// Single source for how the site describes itself: page metadata, structured data, share cards and llms.txt
export const SITE = {
  url: "https://kondwanimuwowo.com",
  name: "Kondwani Muwowo",
  title: "Kondwani Muwowo | Web design and development in Lusaka, Zambia",
  jobTitle: "Web designer and developer",
  description:
    "Kondwani Muwowo is a web designer and developer in Lusaka, Zambia. He builds websites, online shops, booking and payment systems, dashboards and web apps.",
  shortDescription: "Websites and web systems for businesses, churches and organisations.",
  locality: "Lusaka",
  country: "Zambia",
  countryCode: "ZM",
  twitter: "@kondwanimuwow0",
  sameAs: [
    "https://github.com/kondwanimuwowo",
    "https://linkedin.com/in/kondwanimuwowo",
    "https://x.com/kondwanimuwow0",
  ],
}

export const SERVICES = [
  { name: "Business websites", description: "Company and organisation websites that staff can update without a developer." },
  { name: "Online shops", description: "Stores that take payment by mobile money and card through Lenco." },
  { name: "Booking and custom systems", description: "Booking calendars, appointments and payments for businesses that take reservations." },
  { name: "Church and nonprofit websites", description: "Sites for ministries and nonprofits, with events, giving, media and reporting." },
  { name: "Dashboards", description: "Internal dashboards for orders, stock, finance, staff and reporting." },
  { name: "Custom web apps", description: "Web applications with user accounts and roles, such as client portals and multi-tenant SaaS platforms." },
]

// Share card copy for pages that aren't backed by a database record
export const PAGE_CARDS = {
  home: { title: "Websites and web systems for businesses and organisations", subtitle: "Kondwani Muwowo, web designer and developer in Lusaka, Zambia" },
  projects: { title: "Projects", subtitle: "Websites, online shops, booking systems and web apps built for clients in Zambia" },
  "beyond-code": { title: "Beyond code", subtitle: "What I do outside client work: TAKUZA, the Great Achievers Network and teaching forex trading" },
  contact: { title: "Start a project", subtitle: "Tell me about the website or system you need built" },
  blog: { title: "Blog", subtitle: "Notes on web development, design and building for businesses in Zambia" },
} as const

export type PageCardKey = keyof typeof PAGE_CARDS
