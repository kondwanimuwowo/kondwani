import {
  Dashboard, Code, Work, Build, Contacts, BarChart, Article,
  Lightbulb, People, ViewKanban, RequestQuote, EditNote,
} from "@mui/icons-material"

export type NavItem = {
  label: string
  href?: string
  icon: React.ElementType
  subItems?: { label: string; href: string }[]
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: "Portfolio",
    items: [
      { label: "Dashboard", href: "/", icon: Dashboard },
      { label: "Projects", href: "/projects", icon: Code },
      { label: "Case Studies", href: "/case-studies", icon: Work },
      { label: "Blog", href: "/blog", icon: EditNote },
      { label: "Skills", href: "/skills", icon: Build },
    ],
  },
  {
    label: "Studio",
    items: [
      { label: "Clients", href: "/clients", icon: People },
      { label: "Work", href: "/work", icon: ViewKanban },
      { label: "Invoices", href: "/invoices", icon: RequestQuote },
    ],
  },
  {
    label: "Me",
    items: [
      { label: "Job Tracker", href: "/jobs", icon: Article },
      { label: "Ideas", href: "/ideas", icon: Lightbulb },
      { label: "Contacts", href: "/contacts", icon: Contacts },
      { label: "Analytics", href: "/analytics", icon: BarChart },
    ],
  },
]

export const navItems: NavItem[] = navSections.flatMap(s => s.items)
