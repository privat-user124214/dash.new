import { useAuth } from "@/lib/auth";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: any) => void;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-line' },
  { id: 'warnings', label: 'Verwarnungen', icon: 'fas fa-exclamation-triangle' },
  { id: 'tickets', label: 'Ticket System', icon: 'fas fa-ticket-alt' },
  { id: 'moderation', label: 'Moderation', icon: 'fas fa-shield-alt' },
  { id: 'settings', label: 'Einstellungen', icon: 'fas fa-cog' },
  { id: 'logs', label: 'Logs', icon: 'fas fa-file-alt' },
];

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <div className="w-64 discord-bg-secondary border-r border-discord-tertiary flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-discord-tertiary">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 discord-bg-blurple rounded-lg flex items-center justify-center">
            <i className="fas fa-robot text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">DiscordNova</h1>
            <p className="text-sm text-gray-400">Bot Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`nav-item w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
              activeSection === item.id
                ? 'active discord-bg-blurple text-white'
                : 'text-gray-300 hover:discord-bg-tertiary hover:text-white'
            }`}
          >
            <i className={`${item.icon} w-5`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-discord-tertiary">
        <div className="flex items-center space-x-3">
          <img 
            src={user?.avatar 
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
              : 'https://cdn.discordapp.com/embed/avatars/0.png'
            }
            alt="User Avatar" 
            className="w-10 h-10 rounded-full" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.username || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
          <button 
            onClick={logout}
            className="text-gray-400 hover:text-white transition-colors"
            title="Abmelden"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
