// Kept in sync with data/blogCategories.ts in the portfolio and blog apps.
// Tech posts live on kondwanimuwowo.com/blog; every other category lives on blog.kondwanimuwowo.com.
export const BLOG_CATEGORIES = [
  {
    key: "tech",
    label: "Tech",
    hint: "Shows on your portfolio and your personal blog",
    description: "Coding, websites and building systems.",
  },
  {
    key: "faith",
    label: "Faith",
    hint: "Shows on your personal blog only",
    description: "Faith and what I'm learning along the way.",
  },
  {
    key: "life",
    label: "Life",
    hint: "Shows on your personal blog only",
    description: "Chess, the gym, hiking and everyday life.",
  },
] as const

export type BlogCategoryKey = (typeof BLOG_CATEGORIES)[number]["key"]

// The safe choice: a post that forgets its category never appears on the portfolio
export const DEFAULT_BLOG_CATEGORY: BlogCategoryKey = "life"

export function categoryLabel(key: string) {
  return BLOG_CATEGORIES.find((c) => c.key === key)?.label ?? key
}

export function findCategory(key: string) {
  return BLOG_CATEGORIES.find((c) => c.key === key)
}
