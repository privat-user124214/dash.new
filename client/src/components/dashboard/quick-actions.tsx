import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface QuickActionsProps {
  serverId: string;
}

export default function QuickActions({ serverId }: QuickActionsProps) {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    if (!serverId) {
      toast({
        title: "Kein Server ausgewählt",
        description: "Bitte wählen Sie zuerst einen Server aus.",
        variant: "destructive",
      });
      return;
    }

    // Placeholder actions
    switch (action) {
      case 'createTicketCategory':
        toast({
          title: "Feature kommt bald",
          description: "Ticket-Kategorie-Erstellung wird implementiert.",
        });
        break;
      case 'bulkWarningCheck':
        toast({
          title: "Feature kommt bald",
          description: "Bulk-Verwarnungsprüfung wird implementiert.",
        });
        break;
      case 'exportLogs':
        toast({
          title: "Feature kommt bald",
          description: "Log-Export wird implementiert.",
        });
        break;
      case 'serverSettings':
        toast({
          title: "Feature kommt bald",
          description: "Server-Konfiguration wird implementiert.",
        });
        break;
    }
  };

  const actions = [
    {
      id: 'createTicketCategory',
      icon: 'fas fa-plus-circle',
      label: 'Ticket Kategorie',
      description: 'Neue Kategorie erstellen',
      color: 'discord-button-primary'
    },
    {
      id: 'bulkWarningCheck',
      icon: 'fas fa-search',
      label: 'Verwarnungen prüfen',
      description: 'Bulk-Überprüfung',
      color: 'discord-button-success'
    },
    {
      id: 'exportLogs',
      icon: 'fas fa-download',
      label: 'Logs exportieren',
      description: 'Daten herunterladen',
      color: 'discord-button-warning'
    },
    {
      id: 'serverSettings',
      icon: 'fas fa-server',
      label: 'Server Config',
      description: 'Einstellungen anpassen',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  return (
    <Card className="discord-bg-secondary border-discord-tertiary">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Schnellaktionen</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`${action.color} text-white p-6 h-auto flex flex-col items-center space-y-2 transition-transform hover:scale-105`}
              disabled={!serverId}
            >
              <i className={`${action.icon} text-2xl`}></i>
              <div className="text-center">
                <p className="text-sm font-medium">{action.label}</p>
                <p className="text-xs opacity-80">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
        
        {!serverId && (
          <p className="text-gray-400 text-center mt-4 text-sm">
            Wählen Sie einen Server aus um Aktionen durchzuführen
          </p>
        )}
      </CardContent>
    </Card>
  );
}
