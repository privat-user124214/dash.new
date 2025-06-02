import fs from 'fs/promises';
import path from 'path';
import { 
  type User, type InsertUser, type Server, type InsertServer,
  type Warning, type InsertWarning, type TicketCategory, type InsertTicketCategory,
  type Ticket, type InsertTicket, type TicketMessage, type InsertTicketMessage,
  type ModerationLog, type InsertModerationLog
} from "@shared/schema";
import type { IStorage } from "./storage";

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Generic JSON file operations
async function readJsonFile<T>(filename: string, defaultValue: T[] = []): Promise<T[]> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue as T[];
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export class JsonStorage implements IStorage {
  private getNextId(items: any[]): number {
    return items.length > 0 ? Math.max(...items.map(item => item.id || 0)) + 1 : 1;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const users = await readJsonFile<User>('users.json');
    return users.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await readJsonFile<User>('users.json');
    return users.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await readJsonFile<User>('users.json');
    const newUser: User = {
      ...insertUser,
      discriminator: insertUser.discriminator ?? null,
      avatar: insertUser.avatar ?? null,
      accessToken: insertUser.accessToken ?? null,
      refreshToken: insertUser.refreshToken ?? null,
      createdAt: new Date(),
    };
    users.push(newUser);
    await writeJsonFile('users.json', users);
    return newUser;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const users = await readJsonFile<User>('users.json');
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) throw new Error('User not found');
    
    users[userIndex] = { ...users[userIndex], ...updateUser };
    await writeJsonFile('users.json', users);
    return users[userIndex];
  }

  // Servers
  async getServer(id: string): Promise<Server | undefined> {
    const servers = await readJsonFile<Server>('servers.json');
    return servers.find(server => server.id === id);
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const servers = await readJsonFile<Server>('servers.json');
    const newServer: Server = {
      ...insertServer,
      icon: insertServer.icon ?? null,
      botJoined: insertServer.botJoined ?? null,
      settings: insertServer.settings ?? {},
      createdAt: new Date(),
    };
    servers.push(newServer);
    await writeJsonFile('servers.json', servers);
    return newServer;
  }

  async updateServer(id: string, updateServer: Partial<InsertServer>): Promise<Server> {
    const servers = await readJsonFile<Server>('servers.json');
    const serverIndex = servers.findIndex(server => server.id === id);
    if (serverIndex === -1) throw new Error('Server not found');
    
    servers[serverIndex] = { ...servers[serverIndex], ...updateServer };
    await writeJsonFile('servers.json', servers);
    return servers[serverIndex];
  }

  async getUserServers(userId: string): Promise<Server[]> {
    const servers = await readJsonFile<Server>('servers.json');
    return servers.filter(server => server.ownerId === userId);
  }

  // Warnings
  async getWarning(id: number): Promise<Warning | undefined> {
    const warnings = await readJsonFile<Warning>('warnings.json');
    return warnings.find(warning => warning.id === id);
  }

  async getWarningsByUser(userId: string, serverId: string): Promise<Warning[]> {
    const warnings = await readJsonFile<Warning>('warnings.json');
    return warnings.filter(warning => 
      warning.userId === userId && 
      warning.serverId === serverId && 
      warning.isActive
    ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async getActiveWarningsCount(userId: string, serverId: string): Promise<number> {
    const warnings = await this.getWarningsByUser(userId, serverId);
    return warnings.length;
  }

  async createWarning(insertWarning: InsertWarning): Promise<Warning> {
    const warnings = await readJsonFile<Warning>('warnings.json');
    const newWarning: Warning = {
      ...insertWarning,
      id: this.getNextId(warnings),
      isActive: insertWarning.isActive ?? true,
      createdAt: new Date(),
    };
    warnings.push(newWarning);
    await writeJsonFile('warnings.json', warnings);
    return newWarning;
  }

  async deactivateWarning(id: number): Promise<Warning> {
    const warnings = await readJsonFile<Warning>('warnings.json');
    const warningIndex = warnings.findIndex(warning => warning.id === id);
    if (warningIndex === -1) throw new Error('Warning not found');
    
    warnings[warningIndex].isActive = false;
    await writeJsonFile('warnings.json', warnings);
    return warnings[warningIndex];
  }

  async getRecentWarnings(serverId: string, limit = 10): Promise<Warning[]> {
    const warnings = await readJsonFile<Warning>('warnings.json');
    return warnings
      .filter(warning => warning.serverId === serverId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Ticket Categories
  async getTicketCategory(id: number): Promise<TicketCategory | undefined> {
    const categories = await readJsonFile<TicketCategory>('ticket-categories.json');
    return categories.find(category => category.id === id);
  }

  async getTicketCategories(serverId: string): Promise<TicketCategory[]> {
    const categories = await readJsonFile<TicketCategory>('ticket-categories.json');
    return categories
      .filter(category => category.serverId === serverId && category.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createTicketCategory(insertCategory: InsertTicketCategory): Promise<TicketCategory> {
    const categories = await readJsonFile<TicketCategory>('ticket-categories.json');
    const newCategory: TicketCategory = {
      ...insertCategory,
      id: this.getNextId(categories),
      isActive: insertCategory.isActive ?? true,
      description: insertCategory.description ?? null,
      emoji: insertCategory.emoji ?? null,
      color: insertCategory.color ?? null,
      createdAt: new Date(),
    };
    categories.push(newCategory);
    await writeJsonFile('ticket-categories.json', categories);
    return newCategory;
  }

  async updateTicketCategory(id: number, updateCategory: Partial<InsertTicketCategory>): Promise<TicketCategory> {
    const categories = await readJsonFile<TicketCategory>('ticket-categories.json');
    const categoryIndex = categories.findIndex(category => category.id === id);
    if (categoryIndex === -1) throw new Error('Category not found');
    
    categories[categoryIndex] = { ...categories[categoryIndex], ...updateCategory };
    await writeJsonFile('ticket-categories.json', categories);
    return categories[categoryIndex];
  }

  async deleteTicketCategory(id: number): Promise<void> {
    const categories = await readJsonFile<TicketCategory>('ticket-categories.json');
    const categoryIndex = categories.findIndex(category => category.id === id);
    if (categoryIndex === -1) throw new Error('Category not found');
    
    categories[categoryIndex].isActive = false;
    await writeJsonFile('ticket-categories.json', categories);
  }

  // Tickets
  async getTicket(id: number): Promise<Ticket | undefined> {
    const tickets = await readJsonFile<Ticket>('tickets.json');
    return tickets.find(ticket => ticket.id === id);
  }

  async getTickets(serverId: string): Promise<Ticket[]> {
    const tickets = await readJsonFile<Ticket>('tickets.json');
    return tickets
      .filter(ticket => ticket.serverId === serverId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getActiveTickets(serverId: string): Promise<Ticket[]> {
    const tickets = await this.getTickets(serverId);
    return tickets.filter(ticket => ticket.status === "open");
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const tickets = await readJsonFile<Ticket>('tickets.json');
    const newTicket: Ticket = {
      ...insertTicket,
      id: this.getNextId(tickets),
      status: insertTicket.status ?? "open",
      channelId: insertTicket.channelId ?? null,
      assignedTo: insertTicket.assignedTo ?? null,
      priority: insertTicket.priority ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    tickets.push(newTicket);
    await writeJsonFile('tickets.json', tickets);
    return newTicket;
  }

  async updateTicket(id: number, updateTicket: Partial<InsertTicket>): Promise<Ticket> {
    const tickets = await readJsonFile<Ticket>('tickets.json');
    const ticketIndex = tickets.findIndex(ticket => ticket.id === id);
    if (ticketIndex === -1) throw new Error('Ticket not found');
    
    tickets[ticketIndex] = { 
      ...tickets[ticketIndex], 
      ...updateTicket, 
      updatedAt: new Date() 
    };
    await writeJsonFile('tickets.json', tickets);
    return tickets[ticketIndex];
  }

  async claimTicket(ticketId: number, assignedTo: string): Promise<Ticket> {
    return this.updateTicket(ticketId, { assignedTo, status: "assigned" });
  }

  // Ticket Messages
  async getTicketMessages(ticketId: number): Promise<TicketMessage[]> {
    const messages = await readJsonFile<TicketMessage>('ticket-messages.json');
    return messages
      .filter(message => message.ticketId === ticketId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createTicketMessage(insertMessage: InsertTicketMessage): Promise<TicketMessage> {
    const messages = await readJsonFile<TicketMessage>('ticket-messages.json');
    const newMessage: TicketMessage = {
      ...insertMessage,
      id: this.getNextId(messages),
      isStaff: insertMessage.isStaff ?? false,
      createdAt: new Date(),
    };
    messages.push(newMessage);
    await writeJsonFile('ticket-messages.json', messages);
    return newMessage;
  }

  // Moderation Logs
  async createModerationLog(insertLog: InsertModerationLog): Promise<ModerationLog> {
    const logs = await readJsonFile<ModerationLog>('moderation-logs.json');
    const newLog: ModerationLog = {
      ...insertLog,
      id: this.getNextId(logs),
      reason: insertLog.reason ?? null,
      targetId: insertLog.targetId ?? null,
      details: insertLog.details ?? {},
      createdAt: new Date(),
    };
    logs.push(newLog);
    await writeJsonFile('moderation-logs.json', logs);
    return newLog;
  }

  async getModerationLogs(serverId: string, limit = 20): Promise<ModerationLog[]> {
    const logs = await readJsonFile<ModerationLog>('moderation-logs.json');
    return logs
      .filter(log => log.serverId === serverId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Dashboard Stats
  async getDashboardStats(serverId: string): Promise<{
    totalMembers: number;
    activeTickets: number;
    warnings24h: number;
    uptime: string;
  }> {
    const tickets = await this.getActiveTickets(serverId);
    const warnings = await readJsonFile<Warning>('warnings.json');
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentWarnings = warnings.filter(warning => 
      warning.serverId === serverId && 
      warning.isActive &&
      new Date(warning.createdAt) > twentyFourHoursAgo
    );

    return {
      totalMembers: 0, // This would come from Discord API
      activeTickets: tickets.length,
      warnings24h: recentWarnings.length,
      uptime: "99.9%"
    };
  }
}