import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertWarningSchema, insertTicketCategorySchema, insertTicketSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Middleware to verify JWT token
function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    (req as AuthenticatedRequest).user = user;
    next();
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Discord OAuth Callback Route
  app.get("/auth/callback", async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
      return res.redirect("/login?error=no_code");
    }

    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: '1379208014694973601',
          client_secret: process.env.DISCORD_CLIENT_SECRET || '',
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: `${req.protocol}://${req.get('host')}/auth/callback`,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();

      // Get user data from Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();

      // Get user guilds to check for admin permissions
      const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const guildsData = guildsResponse.ok ? await guildsResponse.json() : [];

      // Create or update user in storage
      let user = await storage.getUserByUsername(userData.username);
      if (!user) {
        user = await storage.createUser({
          id: userData.id,
          username: userData.username,
          discriminator: userData.discriminator || null,
          avatar: userData.avatar || null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        });
      } else {
        user = await storage.updateUser(userData.id, {
          username: userData.username,
          discriminator: userData.discriminator || null,
          avatar: userData.avatar || null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        });
      }

      // Process user's guilds and store servers where user has admin permissions
      for (const guild of guildsData) {
        // Check if user has admin permissions (owner or administrator)
        const hasAdminPerms = guild.owner || (parseInt(guild.permissions) & 0x8) === 0x8;
        
        if (hasAdminPerms) {
          let server = await storage.getServer(guild.id);
          if (!server) {
            // Create new server entry
            server = await storage.createServer({
              id: guild.id,
              name: guild.name,
              icon: guild.icon,
              ownerId: guild.owner ? userData.id : guild.owner_id || userData.id,
              botJoined: false, // Will be updated when bot joins
            });

            // Create default ticket categories for new servers
            const defaultCategories = [
              {
                name: "Allgemeine Unterstützung",
                description: "Allgemeine Fragen und Hilfe",
                emoji: "❓",
                color: "blurple",
                serverId: guild.id,
                isActive: true,
              },
              {
                name: "Technische Probleme", 
                description: "Technische Unterstützung und Fehlerbehebung",
                emoji: "🔧",
                color: "red",
                serverId: guild.id,
                isActive: true,
              },
              {
                name: "Report/Beschwerde",
                description: "Melde Regelbrüche oder reiche Beschwerden ein",
                emoji: "⚠️", 
                color: "yellow",
                serverId: guild.id,
                isActive: true,
              }
            ];

            for (const category of defaultCategories) {
              await storage.createTicketCategory(category);
            }
          } else {
            // Update existing server info
            await storage.updateServer(guild.id, {
              name: guild.name,
              icon: guild.icon,
              ownerId: guild.owner ? userData.id : server.ownerId,
            });
          }
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Redirect to frontend with token
      res.redirect(`/?token=${token}`);
    } catch (error) {
      console.error('Discord OAuth error:', error);
      res.redirect("/login?error=auth_failed");
    }
  });

  // Authentication routes
  app.post("/api/auth/discord", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code required" });
      }

      // Exchange code for token with Discord
      const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: process.env.DISCORD_CLIENT_ID || "",
          client_secret: process.env.DISCORD_CLIENT_SECRET || "",
          grant_type: "authorization_code",
          code,
          redirect_uri: process.env.DISCORD_REDIRECT_URI || "http://localhost:5000/auth/callback",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();

      // Get user info from Discord
      const userResponse = await fetch("https://discord.com/api/users/@me", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to get user info");
      }

      const discordUser = await userResponse.json();

      // Create or update user in database
      let user = await storage.getUser(discordUser.id);
      if (!user) {
        user = await storage.createUser({
          id: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        });
      } else {
        user = await storage.updateUser(discordUser.id, {
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
        });
      }

      // Create JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

      res.json({ token, user });
    } catch (error) {
      console.error("Discord auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  // User routes
  app.get("/api/user/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/user/servers", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const servers = await storage.getUserServers(req.user.userId);
      res.json(servers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get servers" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats/:serverId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverId } = req.params;
      const stats = await storage.getDashboardStats(serverId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Warning routes
  app.get("/api/warnings/:serverId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverId } = req.params;
      const warnings = await storage.getRecentWarnings(serverId, 50);
      res.json(warnings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get warnings" });
    }
  });

  app.post("/api/warnings", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const warningData = insertWarningSchema.parse(req.body);
      
      // Get current warning count for user
      const currentCount = await storage.getActiveWarningsCount(warningData.userId, warningData.serverId);
      const nextWarningNumber = currentCount + 1;

      const warning = await storage.createWarning({
        ...warningData,
        warningNumber: nextWarningNumber,
        moderatorId: req.user.userId,
      });

      // Broadcast to WebSocket clients
      broadcastUpdate('warning_added', { warning, serverId: warningData.serverId });

      res.json(warning);
    } catch (error) {
      res.status(400).json({ message: "Failed to create warning" });
    }
  });

  app.delete("/api/warnings/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const warning = await storage.deactivateWarning(parseInt(id));
      
      // Broadcast to WebSocket clients
      broadcastUpdate('warning_removed', { warning });

      res.json(warning);
    } catch (error) {
      res.status(500).json({ message: "Failed to remove warning" });
    }
  });

  // Ticket Category routes
  app.get("/api/ticket-categories/:serverId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverId } = req.params;
      const categories = await storage.getTicketCategories(serverId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ticket categories" });
    }
  });

  app.post("/api/ticket-categories", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const categoryData = insertTicketCategorySchema.parse(req.body);
      const category = await storage.createTicketCategory(categoryData);
      
      // Broadcast to WebSocket clients
      broadcastUpdate('category_added', { category, serverId: categoryData.serverId });

      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to create ticket category" });
    }
  });

  app.put("/api/ticket-categories/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTicketCategorySchema.partial().parse(req.body);
      const category = await storage.updateTicketCategory(parseInt(id), updateData);
      
      // Broadcast to WebSocket clients
      broadcastUpdate('category_updated', { category });

      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Failed to update ticket category" });
    }
  });

  app.delete("/api/ticket-categories/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.deleteTicketCategory(parseInt(id));
      
      // Broadcast to WebSocket clients
      broadcastUpdate('category_deleted', { categoryId: parseInt(id) });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete ticket category" });
    }
  });

  // Ticket routes
  app.get("/api/tickets/:serverId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverId } = req.params;
      const tickets = await storage.getTickets(serverId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get tickets" });
    }
  });

  app.get("/api/tickets/:serverId/active", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverId } = req.params;
      const tickets = await storage.getActiveTickets(serverId);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active tickets" });
    }
  });

  app.post("/api/tickets", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket({
        ...ticketData,
        userId: req.user.userId,
      });
      
      // Broadcast to WebSocket clients
      broadcastUpdate('ticket_created', { ticket, serverId: ticketData.serverId });

      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Failed to create ticket" });
    }
  });

  app.put("/api/tickets/:id/claim", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.claimTicket(parseInt(id), req.user.userId);
      
      // Broadcast to WebSocket clients
      broadcastUpdate('ticket_claimed', { ticket });

      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to claim ticket" });
    }
  });

  app.put("/api/tickets/:id", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updateData = insertTicketSchema.partial().parse(req.body);
      const ticket = await storage.updateTicket(parseInt(id), updateData);
      
      // Broadcast to WebSocket clients
      broadcastUpdate('ticket_updated', { ticket });

      res.json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Failed to update ticket" });
    }
  });

  app.get("/api/tickets/:id/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const messages = await storage.getTicketMessages(parseInt(id));
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to get ticket messages" });
    }
  });

  // Moderation logs
  app.get("/api/moderation-logs/:serverId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { serverId } = req.params;
      const logs = await storage.getModerationLogs(serverId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to get moderation logs" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Set<WebSocket>();

  function broadcastUpdate(type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return httpServer;
}
