import {
  Dashboard, Code, Work, Build, Contacts, BarChart, Article,
  Lightbulb, People, ViewKanban, RequestQuote, EditNote, PostAdd, MarkEmailRead,
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
      { label: "Skills", href: "/skills", icon: Build },
    ],
  },
  {
    label: "Blog",
    items: [
      { label: "Posts", href: "/blog", icon: EditNote },
      { label: "New post", href: "/blog/new", icon: PostAdd },
      { label: "Subscribers", href: "/blog/subscribers", icon: MarkEmailRead },
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

const navHrefs = navItems.flatMap(i => i.href ?? i.subItems?.map(s => s.href) ?? [])

// The most specific matching link wins, so /blog stays inactive on /blog/new.
export function isNavActive(href: string, pathname: string) {
  const matches = (h: string) => h === "/" ? pathname === "/" : pathname === h || pathname.startsWith(h + "/")
  if (!matches(href)) return false
  return !navHrefs.some(h => h.length > href.length && h.startsWith(href) && matches(h))
}
