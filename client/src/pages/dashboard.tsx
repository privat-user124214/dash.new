import { useState } from "react";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import StatsCards from "@/components/dashboard/stats-cards";
import RecentActivity from "@/components/dashboard/recent-activity";
import QuickActions from "@/components/dashboard/quick-actions";
import WarningsTable from "@/components/warnings/warnings-table";
import TicketCategories from "@/components/tickets/ticket-categories";
import TicketsTable from "@/components/tickets/tickets-table";
import { useWebSocket } from "@/hooks/use-websocket";

type ActiveSection = 'dashboard' | 'warnings' | 'tickets' | 'moderation' | 'settings' | 'logs';

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('dashboard');
  const [selectedServerId, setSelectedServerId] = useState<string>('');

  // Connect to WebSocket for real-time updates
  useWebSocket();

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <StatsCards serverId={selectedServerId} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentActivity serverId={selectedServerId} />
              <QuickActions serverId={selectedServerId} />
            </div>
          </div>
        );
      
      case 'warnings':
        return (
          <div className="space-y-6">
            <WarningsTable serverId={selectedServerId} />
          </div>
        );
      
      case 'tickets':
        return (
          <div className="space-y-6">
            <TicketCategories serverId={selectedServerId} />
            <TicketsTable serverId={selectedServerId} />
          </div>
        );
      
      case 'moderation':
        return (
          <div className="discord-bg-secondary rounded-xl p-6 border border-discord-tertiary">
            <h3 className="text-xl font-bold text-white mb-4">Moderation Tools</h3>
            <p className="text-gray-300">Moderationstools werden hier implementiert...</p>
          </div>
        );
      
      case 'settings':
        return (
          <div className="discord-bg-secondary rounded-xl p-6 border border-discord-tertiary">
            <h3 className="text-xl font-bold text-white mb-4">Bot Einstellungen</h3>
            <p className="text-gray-300">Bot-Konfigurationseinstellungen werden hier implementiert...</p>
          </div>
        );
      
      case 'logs':
        return (
          <div className="discord-bg-secondary rounded-xl p-6 border border-discord-tertiary">
            <h3 className="text-xl font-bold text-white mb-4">System Logs</h3>
            <p className="text-gray-300">Systemlogs und Audit-Trail werden hier implementiert...</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden discord-bg-dark">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          activeSection={activeSection}
          selectedServerId={selectedServerId}
          onServerChange={setSelectedServerId}
        />
        
        <main className="flex-1 overflow-y-auto discord-bg-dark p-6">
          <div className="fade-in">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
