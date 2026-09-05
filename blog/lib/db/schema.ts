import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

const id = () => text("id").primaryKey().$defaultFn(() => createId())
const createdAt = (name = "createdAt") => timestamp(name, { withTimezone: true }).defaultNow().notNull()
const updatedAt = (name = "updatedAt") => timestamp(name, { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()

export const blogPost = pgTable("BlogPost", {
  id: id(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  tags: text("tags").array().notNull(),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("BlogPost_slug_key").on(t.slug),
])

export type BlogPost = typeof blogPost.$inferSelect
