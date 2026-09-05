import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"
import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

const id = () => text("id").primaryKey().$defaultFn(() => createId())
const createdAt = (name = "createdAt") => timestamp(name, { withTimezone: true }).defaultNow().notNull()
const updatedAt = (name = "updatedAt") => timestamp(name, { withTimezone: true }).defaultNow().$onUpdate(() => new Date()).notNull()

export const profile = pgTable("Profile", {
  id: id(),
  userId: text("userId").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("Profile_userId_key").on(t.userId),
  uniqueIndex("Profile_email_key").on(t.email),
])

export const newsletterSubscriber = pgTable("NewsletterSubscriber", {
  id: id(),
  email: text("email").notNull(),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("NewsletterSubscriber_email_key").on(t.email),
])

export const project = pgTable("Project", {
  id: id(),
  slug: text("slug"),
  title: text("title").notNull(),
  description: text("description").notNull(),
  excerpt: text("excerpt"),
  tech: text("tech").array().notNull(),
  liveUrl: text("liveUrl"),
  githubUrl: text("githubUrl"),
  imageUrl: text("imageUrl"),
  gallery: text("gallery").array(),
  featured: boolean("featured").notNull().default(false),
  category: text("category").notNull(),
  role: text("role"),
  year: integer("year"),
  status: text("status"),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("Project_slug_key").on(t.slug),
])

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

export const caseStudy = pgTable("CaseStudy", {
  id: id(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  client: text("client"),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  coverImage: text("coverImage"),
  role: text("role"),
  problem: text("problem"),
  solution: text("solution"),
  year: integer("year"),
  duration: text("duration"),
  liveUrl: text("liveUrl"),
  githubUrl: text("githubUrl"),
  gallery: text("gallery").array().notNull(),
  testimonial: text("testimonial"),
  testimonialAuthor: text("testimonialAuthor"),
  testimonialRole: text("testimonialRole"),
  tech: text("tech").array().notNull(),
  outcomes: text("outcomes").array().notNull(),
  featured: boolean("featured").notNull().default(false),
  order: integer("order").notNull().default(0),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("publishedAt", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("CaseStudy_slug_key").on(t.slug),
])

export const contactSubmission = pgTable("ContactSubmission", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: createdAt(),
})

export const pageView = pgTable("PageView", {
  id: id(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  createdAt: createdAt(),
}, (t) => [
  index("PageView_path_idx").on(t.path),
  index("PageView_createdAt_idx").on(t.createdAt),
])

export const jobApplication = pgTable("JobApplication", {
  id: id(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("applied"),
  appliedAt: timestamp("appliedAt", { withTimezone: true }).notNull(),
  notes: text("notes"),
  url: text("url"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const idea = pgTable("Idea", {
  id: id(),
  title: text("title").notNull(),
  body: text("body"),
  tags: text("tags").array().notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const siteConfig = pgTable("SiteConfig", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: updatedAt(),
})

// ── Studio ────────────────────────────────────────────────────────────────────

export const client = pgTable("Client", {
  id: id(),
  name: text("name").notNull(),
  company: text("company"),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  currency: text("currency").notNull().default("USD"),
  notes: text("notes"),
  status: text("status").notNull().default("active"),
  userId: text("userId"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("Client_email_key").on(t.email),
  uniqueIndex("Client_userId_key").on(t.userId),
])

export const workProject = pgTable("WorkProject", {
  id: id(),
  title: text("title").notNull(),
  description: text("description"),
  clientId: text("clientId").references(() => client.id),
  status: text("status").notNull().default("backlog"),
  billingType: text("billingType").notNull().default("fixed"),
  rate: doublePrecision("rate"),
  budget: doublePrecision("budget"),
  currency: text("currency").notNull().default("USD"),
  startDate: timestamp("startDate", { withTimezone: true }),
  dueDate: timestamp("dueDate", { withTimezone: true }),
  order: integer("order").notNull().default(0),
  portfolioId: text("portfolioId"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("WorkProject_portfolioId_key").on(t.portfolioId),
])

export const workTask = pgTable("WorkTask", {
  id: id(),
  projectId: text("projectId").notNull().references(() => workProject.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  dueDate: timestamp("dueDate", { withTimezone: true }),
  position: doublePrecision("position").notNull().default(0),
  parentId: text("parentId"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const document = pgTable("Document", {
  id: id(),
  type: text("type").notNull(),
  number: text("number").notNull(),
  clientId: text("clientId").notNull().references(() => client.id),
  projectId: text("projectId").references(() => workProject.id),
  milestoneId: text("milestoneId"),
  retainerId: text("retainerId"),
  status: text("status").notNull().default("draft"),
  issueDate: timestamp("issueDate", { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp("dueDate", { withTimezone: true }),
  currency: text("currency").notNull().default("USD"),
  taxRate: doublePrecision("taxRate").notNull().default(0),
  notes: text("notes"),
  token: text("token").notNull(),
  pdfUrl: text("pdfUrl"),
  paymentRef: text("paymentRef"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("Document_number_key").on(t.number),
  uniqueIndex("Document_milestoneId_key").on(t.milestoneId),
  uniqueIndex("Document_token_key").on(t.token),
])

export const documentItem = pgTable("DocumentItem", {
  id: id(),
  documentId: text("documentId").notNull().references(() => document.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull().default(1),
  rate: doublePrecision("rate").notNull(),
  amount: doublePrecision("amount").notNull(),
  flat: boolean("flat").notNull().default(false),
  position: integer("position").notNull().default(0),
})

export const billingMilestone = pgTable("BillingMilestone", {
  id: id(),
  projectId: text("projectId").notNull().references(() => workProject.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  percentage: doublePrecision("percentage"),
  amount: doublePrecision("amount").notNull(),
  dueDate: timestamp("dueDate", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  position: integer("position").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const retainerContract = pgTable("RetainerContract", {
  id: id(),
  clientId: text("clientId").notNull().references(() => client.id, { onDelete: "cascade" }),
  projectId: text("projectId").references(() => workProject.id),
  title: text("title").notNull(),
  amount: doublePrecision("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  frequency: text("frequency").notNull().default("monthly"),
  startDate: timestamp("startDate", { withTimezone: true }).notNull(),
  endDate: timestamp("endDate", { withTimezone: true }),
  status: text("status").notNull().default("active"),
  lastInvoicedAt: timestamp("lastInvoicedAt", { withTimezone: true }),
  nextInvoiceAt: timestamp("nextInvoiceAt", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("RetainerContract_projectId_key").on(t.projectId),
])

export const contract = pgTable("Contract", {
  id: id(),
  clientId: text("clientId").notNull().references(() => client.id, { onDelete: "cascade" }),
  projectId: text("projectId").references(() => workProject.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status").notNull().default("draft"),
  signedAt: timestamp("signedAt", { withTimezone: true }),
  signatureName: text("signatureName"),
  signatureEmail: text("signatureEmail"),
  signatureIp: text("signatureIp"),
  pdfUrl: text("pdfUrl"),
  token: text("token").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("Contract_projectId_key").on(t.projectId),
  uniqueIndex("Contract_token_key").on(t.token),
])

export const projectMessage = pgTable("ProjectMessage", {
  id: id(),
  projectId: text("projectId").notNull().references(() => workProject.id, { onDelete: "cascade" }),
  senderId: text("senderId").notNull(),
  senderName: text("senderName").notNull(),
  senderRole: text("senderRole").notNull(),
  content: text("content").notNull(),
  attachments: text("attachments").array(),
  createdAt: createdAt(),
}, (t) => [
  index("ProjectMessage_projectId_createdAt_idx").on(t.projectId, t.createdAt),
])

export type Project = typeof project.$inferSelect
export type CaseStudy = typeof caseStudy.$inferSelect

// ── Relations ─────────────────────────────────────────────────────────────────

export const clientRelations = relations(client, ({ many }) => ({
  workProjects: many(workProject),
  documents: many(document),
  retainers: many(retainerContract),
  contracts: many(contract),
}))

export const workProjectRelations = relations(workProject, ({ one, many }) => ({
  client: one(client, { fields: [workProject.clientId], references: [client.id] }),
  tasks: many(workTask),
  documents: many(document),
  milestones: many(billingMilestone),
  retainer: one(retainerContract, { fields: [workProject.id], references: [retainerContract.projectId] }),
  contract: one(contract, { fields: [workProject.id], references: [contract.projectId] }),
  messages: many(projectMessage),
}))

export const workTaskRelations = relations(workTask, ({ one, many }) => ({
  project: one(workProject, { fields: [workTask.projectId], references: [workProject.id] }),
  parent: one(workTask, { fields: [workTask.parentId], references: [workTask.id], relationName: "subtasks" }),
  subtasks: many(workTask, { relationName: "subtasks" }),
}))

export const documentRelations = relations(document, ({ one, many }) => ({
  client: one(client, { fields: [document.clientId], references: [client.id] }),
  project: one(workProject, { fields: [document.projectId], references: [workProject.id] }),
  milestone: one(billingMilestone, { fields: [document.milestoneId], references: [billingMilestone.id], relationName: "milestoneInvoice" }),
  retainer: one(retainerContract, { fields: [document.retainerId], references: [retainerContract.id] }),
  items: many(documentItem),
}))

export const documentItemRelations = relations(documentItem, ({ one }) => ({
  document: one(document, { fields: [documentItem.documentId], references: [document.id] }),
}))

export const billingMilestoneRelations = relations(billingMilestone, ({ one }) => ({
  project: one(workProject, { fields: [billingMilestone.projectId], references: [workProject.id] }),
  invoice: one(document, { fields: [billingMilestone.id], references: [document.milestoneId], relationName: "milestoneInvoice" }),
}))

export const retainerContractRelations = relations(retainerContract, ({ one, many }) => ({
  client: one(client, { fields: [retainerContract.clientId], references: [client.id] }),
  project: one(workProject, { fields: [retainerContract.projectId], references: [workProject.id] }),
  invoices: many(document),
}))

export const contractRelations = relations(contract, ({ one }) => ({
  client: one(client, { fields: [contract.clientId], references: [client.id] }),
  project: one(workProject, { fields: [contract.projectId], references: [workProject.id] }),
}))

export const projectMessageRelations = relations(projectMessage, ({ one }) => ({
  project: one(workProject, { fields: [projectMessage.projectId], references: [workProject.id] }),
}))
