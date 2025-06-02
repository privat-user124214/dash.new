import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Discord user ID
  username: text("username").notNull(),
  discriminator: text("discriminator"),
  avatar: text("avatar"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const servers = pgTable("servers", {
  id: text("id").primaryKey(), // Discord guild ID
  name: text("name").notNull(),
  icon: text("icon"),
  ownerId: text("owner_id").notNull(),
  botJoined: boolean("bot_joined").default(false),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const warnings = pgTable("warnings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  serverId: text("server_id").notNull(),
  moderatorId: text("moderator_id").notNull(),
  reason: text("reason").notNull(),
  warningNumber: integer("warning_number").notNull(), // 1, 2, 3, 4
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ticketCategories = pgTable("ticket_categories", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  emoji: text("emoji"),
  color: text("color").default("#5865F2"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  userId: text("user_id").notNull(),
  categoryId: integer("category_id").notNull(),
  channelId: text("channel_id"),
  subject: text("subject").notNull(),
  status: text("status").default("open"), // open, assigned, waiting, closed
  assignedTo: text("assigned_to"),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ticketMessages = pgTable("ticket_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  isStaff: boolean("is_staff").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const moderationLogs = pgTable("moderation_logs", {
  id: serial("id").primaryKey(),
  serverId: text("server_id").notNull(),
  moderatorId: text("moderator_id").notNull(),
  targetId: text("target_id"),
  action: text("action").notNull(), // warn, kick, ban, mute, etc.
  reason: text("reason"),
  details: jsonb("details").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  warnings: many(warnings),
  tickets: many(tickets),
  moderationLogs: many(moderationLogs),
}));

export const serversRelations = relations(servers, ({ many }) => ({
  warnings: many(warnings),
  tickets: many(tickets),
  ticketCategories: many(ticketCategories),
  moderationLogs: many(moderationLogs),
}));

export const warningsRelations = relations(warnings, ({ one }) => ({
  server: one(servers, {
    fields: [warnings.serverId],
    references: [servers.id],
  }),
}));

export const ticketCategoriesRelations = relations(ticketCategories, ({ one, many }) => ({
  server: one(servers, {
    fields: [ticketCategories.serverId],
    references: [servers.id],
  }),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  server: one(servers, {
    fields: [tickets.serverId],
    references: [servers.id],
  }),
  category: one(ticketCategories, {
    fields: [tickets.categoryId],
    references: [ticketCategories.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
}));

export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  server: one(servers, {
    fields: [moderationLogs.serverId],
    references: [servers.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
});

export const insertServerSchema = createInsertSchema(servers).omit({
  createdAt: true,
});

export const insertWarningSchema = createInsertSchema(warnings).omit({
  id: true,
  createdAt: true,
});

export const insertTicketCategorySchema = createInsertSchema(ticketCategories).omit({
  id: true,
  createdAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertModerationLogSchema = createInsertSchema(moderationLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;

export type InsertWarning = z.infer<typeof insertWarningSchema>;
export type Warning = typeof warnings.$inferSelect;

export type InsertTicketCategory = z.infer<typeof insertTicketCategorySchema>;
export type TicketCategory = typeof ticketCategories.$inferSelect;

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;
export type TicketMessage = typeof ticketMessages.$inferSelect;

export type InsertModerationLog = z.infer<typeof insertModerationLogSchema>;
export type ModerationLog = typeof moderationLogs.$inferSelect;
