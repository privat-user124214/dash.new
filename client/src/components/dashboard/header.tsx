import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HeaderProps {
  activeSection: string;
  selectedServerId: string;
  onServerChange: (serverId: string) => void;
}

const sectionTitles = {
  dashboard: { title: 'Dashboard', subtitle: 'Übersicht über Ihren Discord Bot' },
  warnings: { title: 'Verwarnungssystem', subtitle: 'Verwalten Sie Benutzerverwarnungen' },
  tickets: { title: 'Ticket System', subtitle: 'Support-Tickets verwalten und bearbeiten' },
  moderation: { title: 'Moderation', subtitle: 'Moderationstools und -einstellungen' },
  settings: { title: 'Einstellungen', subtitle: 'Bot-Konfiguration anpassen' },
  logs: { title: 'System Logs', subtitle: 'Protokolle und Aktivitätsverlauf' },
};

export default function Header({ activeSection, selectedServerId, onServerChange }: HeaderProps) {
  const { data: servers = [] } = useQuery({
    queryKey: ['/api/user/servers'],
  });

  const sectionInfo = sectionTitles[activeSection as keyof typeof sectionTitles] || sectionTitles.dashboard;

  return (
    <header className="discord-bg-secondary border-b border-discord-tertiary p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{sectionInfo.title}</h2>
          <p className="text-gray-400">{sectionInfo.subtitle}</p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Server Selector */}
          <div className="relative">
            <Select value={selectedServerId} onValueChange={onServerChange}>
              <SelectTrigger className="w-48 discord-bg-tertiary text-white border-gray-600 focus:border-discord-blurple">
                <SelectValue placeholder="Server auswählen" />
              </SelectTrigger>
              <SelectContent className="discord-bg-tertiary border-gray-600">
                {servers.map((server: any) => (
                  <SelectItem 
                    key={server.id} 
                    value={server.id}
                    className="text-white hover:discord-bg-blurple focus:discord-bg-blurple"
                  >
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Bot Status */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 discord-bg-green rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Bot Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
