import { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { storage } from "./storage";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Command definitions
const commands = [
  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Verwarnung an einen Benutzer aussprechen")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Der zu verwarnende Benutzer")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Grund für die Verwarnung")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Verwarnungen eines Benutzers anzeigen")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Benutzer dessen Verwarnungen angezeigt werden sollen")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("removewarning")
    .setDescription("Eine Verwarnung entfernen")
    .addIntegerOption(option =>
      option.setName("warning_id")
        .setDescription("ID der zu entfernenden Verwarnung")
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ein neues Support-Ticket erstellen")
    .addStringOption(option =>
      option.setName("category")
        .setDescription("Ticket-Kategorie")
        .setRequired(true))
    .addStringOption(option =>
      option.setName("subject")
        .setDescription("Betreff des Tickets")
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("DiscordNova Bot für diesen Server einrichten")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

// Helper function to check if user is server owner or has admin permissions
function hasAdminPermissions(member: any, guild: any): boolean {
  // Check if user is server owner
  if (guild.ownerId === member.id) {
    return true;
  }
  
  // Check if user has administrator permissions
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

// Helper function to check if user can moderate
function canModerate(member: any, guild: any): boolean {
  // Server owner can always moderate
  if (guild.ownerId === member.id) {
    return true;
  }
  
  // Check moderation permissions
  return member.permissions.has(PermissionFlagsBits.ModerateMembers) || 
         member.permissions.has(PermissionFlagsBits.Administrator);
}

client.once("ready", async () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  
  // Register slash commands
  if (client.application) {
    await client.application.commands.set(commands);
    console.log("Slash commands registered successfully");
  }
});

client.on("guildCreate", async (guild) => {
  console.log(`Bot joined guild: ${guild.name} (${guild.id})`);
  
  // Create server record in database
  try {
    await storage.createServer({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      ownerId: guild.ownerId,
      botJoined: true,
    });

    // Create default ticket categories
    const defaultCategories = [
      { name: "Support", description: "Allgemeine Hilfe", emoji: "🎧", color: "#5865F2" },
      { name: "Beschwerden", description: "Regelverstöße melden", emoji: "⚠️", color: "#ED4245" },
      { name: "Fragen", description: "Allgemeine Fragen", emoji: "❓", color: "#57F287" },
    ];

    for (const category of defaultCategories) {
      await storage.createTicketCategory({
        serverId: guild.id,
        ...category,
      });
    }

    console.log(`Server ${guild.name} setup completed`);
  } catch (error) {
    console.error("Error setting up server:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guildId, member, guild } = interaction;

  if (!guildId || !guild || !member) {
    await interaction.reply({ content: "Dieser Command kann nur in einem Server verwendet werden.", ephemeral: true });
    return;
  }

  try {
    switch (commandName) {
      case "setup":
        if (!hasAdminPermissions(member, guild)) {
          await interaction.reply({ content: "Du benötigst Administrator-Rechte um diesen Command zu verwenden.", ephemeral: true });
          return;
        }

        // Setup server in database
        let server = await storage.getServer(guildId);
        if (!server) {
          server = await storage.createServer({
            id: guildId,
            name: guild.name,
            icon: guild.icon,
            ownerId: guild.ownerId,
            botJoined: true,
          });
        } else {
          server = await storage.updateServer(guildId, { botJoined: true });
        }

        const embed = new EmbedBuilder()
          .setTitle("✅ DiscordNova Setup Complete")
          .setDescription("Der Bot wurde erfolgreich für diesen Server eingerichtet!")
          .setColor(0x5865F2)
          .addFields([
            { name: "Dashboard", value: `Zugriff über: ${process.env.DASHBOARD_URL || "http://localhost:5000"}`, inline: false },
            { name: "Features", value: "• Verwarnungssystem\n• Ticket System\n• Moderation Tools\n• Ausführliche Logs", inline: false },
          ])
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
        break;

      case "warn":
        if (!canModerate(member, guild)) {
          await interaction.reply({ content: "Du hast keine Berechtigung, Verwarnungen auszusprechen.", ephemeral: true });
          return;
        }

        const userToWarn = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason", true);

        // Get current warning count
        const currentCount = await storage.getActiveWarningsCount(userToWarn.id, guildId);
        const nextWarningNumber = currentCount + 1;

        // Create warning
        const warning = await storage.createWarning({
          userId: userToWarn.id,
          serverId: guildId,
          moderatorId: member.user.id,
          reason,
          warningNumber: nextWarningNumber,
        });

        // Log the action
        await storage.createModerationLog({
          serverId: guildId,
          moderatorId: member.user.id,
          targetId: userToWarn.id,
          action: "warn",
          reason,
          details: { warningNumber: nextWarningNumber, warningId: warning.id },
        });

        const warnEmbed = new EmbedBuilder()
          .setTitle("⚠️ Verwarnung ausgesprochen")
          .setColor(0xFEE75C)
          .addFields([
            { name: "Benutzer", value: `<@${userToWarn.id}>`, inline: true },
            { name: "Verwarnung", value: `${nextWarningNumber}/4`, inline: true },
            { name: "Moderator", value: `<@${member.user.id}>`, inline: true },
            { name: "Grund", value: reason, inline: false },
          ])
          .setTimestamp();

        if (nextWarningNumber >= 4) {
          warnEmbed.setColor(0xED4245);
          warnEmbed.setDescription("⚠️ **Maximale Anzahl an Verwarnungen erreicht!**");
        }

        await interaction.reply({ embeds: [warnEmbed] });
        break;

      case "warnings":
        if (!canModerate(member, guild)) {
          await interaction.reply({ content: "Du hast keine Berechtigung, Verwarnungen anzuzeigen.", ephemeral: true });
          return;
        }

        const userToCheck = interaction.options.getUser("user", true);
        const userWarnings = await storage.getWarningsByUser(userToCheck.id, guildId);

        const warningsEmbed = new EmbedBuilder()
          .setTitle(`📋 Verwarnungen für ${userToCheck.username}`)
          .setColor(0x5865F2)
          .setThumbnail(userToCheck.displayAvatarURL());

        if (userWarnings.length === 0) {
          warningsEmbed.setDescription("Keine aktiven Verwarnungen gefunden.");
        } else {
          const warningList = userWarnings.map(w => 
            `**${w.warningNumber}.** ${w.reason} - <@${w.moderatorId}> (${new Date(w.createdAt).toLocaleDateString()})`
          ).join("\n");

          warningsEmbed.setDescription(warningList);
          warningsEmbed.addFields([
            { name: "Aktive Verwarnungen", value: `${userWarnings.length}/4`, inline: true },
          ]);
        }

        await interaction.reply({ embeds: [warningsEmbed] });
        break;

      case "removewarning":
        if (!canModerate(member, guild)) {
          await interaction.reply({ content: "Du hast keine Berechtigung, Verwarnungen zu entfernen.", ephemeral: true });
          return;
        }

        const warningId = interaction.options.getInteger("warning_id", true);
        const warningToRemove = await storage.getWarning(warningId);

        if (!warningToRemove || warningToRemove.serverId !== guildId) {
          await interaction.reply({ content: "Verwarnung nicht gefunden oder gehört nicht zu diesem Server.", ephemeral: true });
          return;
        }

        await storage.deactivateWarning(warningId);

        // Log the action
        await storage.createModerationLog({
          serverId: guildId,
          moderatorId: member.user.id,
          targetId: warningToRemove.userId,
          action: "removewarning",
          reason: "Verwarnung entfernt",
          details: { warningId, originalReason: warningToRemove.reason },
        });

        const removeEmbed = new EmbedBuilder()
          .setTitle("✅ Verwarnung entfernt")
          .setColor(0x57F287)
          .addFields([
            { name: "Verwarnung ID", value: warningId.toString(), inline: true },
            { name: "Benutzer", value: `<@${warningToRemove.userId}>`, inline: true },
            { name: "Moderator", value: `<@${member.user.id}>`, inline: true },
          ])
          .setTimestamp();

        await interaction.reply({ embeds: [removeEmbed] });
        break;

      case "ticket":
        const categoryName = interaction.options.getString("category", true);
        const subject = interaction.options.getString("subject", true);

        // Get ticket categories for this server
        const categories = await storage.getTicketCategories(guildId);
        const category = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());

        if (!category) {
          const availableCategories = categories.map(c => c.name).join(", ");
          await interaction.reply({ 
            content: `Kategorie "${categoryName}" nicht gefunden. Verfügbare Kategorien: ${availableCategories}`, 
            ephemeral: true 
          });
          return;
        }

        // Create ticket
        const ticket = await storage.createTicket({
          serverId: guildId,
          userId: member.user.id,
          categoryId: category.id,
          subject,
        });

        const ticketEmbed = new EmbedBuilder()
          .setTitle("🎫 Ticket erstellt")
          .setColor(parseInt(category.color.replace("#", ""), 16))
          .addFields([
            { name: "Ticket ID", value: `#${ticket.id}`, inline: true },
            { name: "Kategorie", value: `${category.emoji} ${category.name}`, inline: true },
            { name: "Betreff", value: subject, inline: false },
            { name: "Status", value: "🟡 Offen", inline: true },
          ])
          .setTimestamp();

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            new ButtonBuilder()
              .setCustomId(`claim_ticket_${ticket.id}`)
              .setLabel("Beanspruchen")
              .setStyle(ButtonStyle.Primary)
              .setEmoji("✋"),
            new ButtonBuilder()
              .setCustomId(`close_ticket_${ticket.id}`)
              .setLabel("Schließen")
              .setStyle(ButtonStyle.Danger)
              .setEmoji("❌")
          );

        await interaction.reply({ embeds: [ticketEmbed], components: [actionRow] });
        break;

      default:
        await interaction.reply({ content: "Unbekannter Command.", ephemeral: true });
    }
  } catch (error) {
    console.error("Error handling interaction:", error);
    await interaction.reply({ content: "Ein Fehler ist aufgetreten.", ephemeral: true });
  }
});

// Handle button interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, guildId, member } = interaction;

  if (!guildId || !member) return;

  try {
    if (customId.startsWith("claim_ticket_")) {
      const ticketId = parseInt(customId.split("_")[2]);
      
      if (!canModerate(member, interaction.guild)) {
        await interaction.reply({ content: "Du hast keine Berechtigung, Tickets zu beanspruchen.", ephemeral: true });
        return;
      }

      const ticket = await storage.claimTicket(ticketId, member.user.id);

      const claimEmbed = new EmbedBuilder()
        .setTitle("✅ Ticket beansprucht")
        .setColor(0x57F287)
        .addFields([
          { name: "Ticket ID", value: `#${ticket.id}`, inline: true },
          { name: "Zugewiesen an", value: `<@${member.user.id}>`, inline: true },
        ])
        .setTimestamp();

      await interaction.reply({ embeds: [claimEmbed] });

    } else if (customId.startsWith("close_ticket_")) {
      const ticketId = parseInt(customId.split("_")[2]);
      
      if (!canModerate(member, interaction.guild)) {
        await interaction.reply({ content: "Du hast keine Berechtigung, Tickets zu schließen.", ephemeral: true });
        return;
      }

      const ticket = await storage.updateTicket(ticketId, { status: "closed" });

      const closeEmbed = new EmbedBuilder()
        .setTitle("❌ Ticket geschlossen")
        .setColor(0xED4245)
        .addFields([
          { name: "Ticket ID", value: `#${ticket.id}`, inline: true },
          { name: "Geschlossen von", value: `<@${member.user.id}>`, inline: true },
        ])
        .setTimestamp();

      await interaction.reply({ embeds: [closeEmbed] });
    }
  } catch (error) {
    console.error("Error handling button interaction:", error);
    await interaction.reply({ content: "Ein Fehler ist aufgetreten.", ephemeral: true });
  }
});

// Start the bot
export function startBot() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error("BOT_TOKEN environment variable is required");
    console.error("Please set BOT_TOKEN in your environment variables");
    return;
  }

  client.login(token);
}

export { client };
