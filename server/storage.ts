import { 
  type User, type InsertUser, type Server, type InsertServer,
  type Warning, type InsertWarning, type TicketCategory, type InsertTicketCategory,
  type Ticket, type InsertTicket, type TicketMessage, type InsertTicketMessage,
  type ModerationLog, type InsertModerationLog
} from "@shared/schema";
import { JsonStorage } from "./json-storage";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Servers
  getServer(id: string): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: string, server: Partial<InsertServer>): Promise<Server>;
  getUserServers(userId: string): Promise<Server[]>;

  // Warnings
  getWarning(id: number): Promise<Warning | undefined>;
  getWarningsByUser(userId: string, serverId: string): Promise<Warning[]>;
  getActiveWarningsCount(userId: string, serverId: string): Promise<number>;
  createWarning(warning: InsertWarning): Promise<Warning>;
  deactivateWarning(id: number): Promise<Warning>;
  getRecentWarnings(serverId: string, limit?: number): Promise<Warning[]>;

  // Ticket Categories
  getTicketCategory(id: number): Promise<TicketCategory | undefined>;
  getTicketCategories(serverId: string): Promise<TicketCategory[]>;
  createTicketCategory(category: InsertTicketCategory): Promise<TicketCategory>;
  updateTicketCategory(id: number, category: Partial<InsertTicketCategory>): Promise<TicketCategory>;
  deleteTicketCategory(id: number): Promise<void>;

  // Tickets
  getTicket(id: number): Promise<Ticket | undefined>;
  getTickets(serverId: string): Promise<Ticket[]>;
  getActiveTickets(serverId: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<InsertTicket>): Promise<Ticket>;
  claimTicket(ticketId: number, assignedTo: string): Promise<Ticket>;

  // Ticket Messages
  getTicketMessages(ticketId: number): Promise<TicketMessage[]>;
  createTicketMessage(message: InsertTicketMessage): Promise<TicketMessage>;

  // Moderation Logs
  createModerationLog(log: InsertModerationLog): Promise<ModerationLog>;
  getModerationLogs(serverId: string, limit?: number): Promise<ModerationLog[]>;

  // Dashboard Stats
  getDashboardStats(serverId: string): Promise<{
    totalMembers: number;
    activeTickets: number;
    warnings24h: number;
    uptime: string;
  }>;
}

export const storage = new JsonStorage();
