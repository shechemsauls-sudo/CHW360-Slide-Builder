import { boolean, pgTableCreator, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Multi-project table prefix to avoid conflicts in shared databases.
 * All tables will be prefixed with "chw360_".
 */
export const createTable = pgTableCreator((name) => `chw360_${name}`);

export const profiles = createTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: text("auth_id").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const slides = createTable("slides", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactSubmissions = createTable("contact_submissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pageViews = createTable("page_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  page: text("page").notNull(),
  event: text("event").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
