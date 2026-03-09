import { relations } from "drizzle-orm";
import { boolean, integer, jsonb, pgTableCreator, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

export const decks = createTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  sourceContent: text("source_content"),
  sourceFormat: text("source_format"),
  themeId: text("theme_id").notNull().default("chw-teal"),
  llmProvider: text("llm_provider"),
  imageProvider: text("image_provider"),
  slides: jsonb("slides").notNull().default([]),
  videoRecs: jsonb("video_recs"),
  status: text("status").notNull().default("draft"),
  generationLog: jsonb("generation_log"),
  slideCount: integer("slide_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const providerPreferences = createTable("provider_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  llmProvider: text("llm_provider").default("anthropic"),
  imageProvider: text("image_provider").default("gpt-image-1"),
  fidelity: text("fidelity").default("balanced"),
  customInstructions: text("custom_instructions").default(""),
  tone: text("tone").default("professional"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const crmContacts = createTable("crm_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone"),
  organization: text("organization"),
  source: text("source").notNull(),
  notes: text("notes"),
  firstContactAt: timestamp("first_contact_at", { withTimezone: true }).defaultNow().notNull(),
  lastContactAt: timestamp("last_contact_at", { withTimezone: true }).defaultNow().notNull(),
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
  source: text("source").notNull().default("Contact Form · Landing Page"),
  isRead: boolean("is_read").notNull().default(false),
  crmContactId: uuid("crm_contact_id").references(() => crmContacts.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const crmNotes = createTable("crm_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id")
    .notNull()
    .references(() => crmContacts.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
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

// --- Relations ---

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  decks: many(decks),
  providerPreferences: one(providerPreferences),
}));

export const decksRelations = relations(decks, ({ one }) => ({
  profile: one(profiles, { fields: [decks.profileId], references: [profiles.id] }),
}));

export const providerPreferencesRelations = relations(providerPreferences, ({ one }) => ({
  profile: one(profiles, { fields: [providerPreferences.profileId], references: [profiles.id] }),
}));

export const crmContactsRelations = relations(crmContacts, ({ many }) => ({
  submissions: many(contactSubmissions),
  notes: many(crmNotes),
}));

export const crmNotesRelations = relations(crmNotes, ({ one }) => ({
  contact: one(crmContacts, { fields: [crmNotes.contactId], references: [crmContacts.id] }),
}));

export const contactSubmissionsRelations = relations(contactSubmissions, ({ one }) => ({
  crmContact: one(crmContacts, { fields: [contactSubmissions.crmContactId], references: [crmContacts.id] }),
}));
