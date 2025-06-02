import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecentActivityProps {
  serverId: string;
}

export default function RecentActivity({ serverId }: RecentActivityProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: [`/api/moderation-logs/${serverId}`],
    enabled: !!serverId,
  });

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'warn': return { icon: 'fas fa-exclamation-triangle', color: 'discord-bg-red' };
      case 'kick': return { icon: 'fas fa-user-times', color: 'discord-bg-yellow' };
      case 'ban': return { icon: 'fas fa-hammer', color: 'discord-bg-red' };
      case 'ticket_created': return { icon: 'fas fa-ticket-alt', color: 'discord-bg-yellow' };
      case 'user_joined': return { icon: 'fas fa-user-plus', color: 'discord-bg-blurple' };
      default: return { icon: 'fas fa-info-circle', color: 'discord-bg-blurple' };
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'gerade eben';
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`;
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Std`;
    return `vor ${Math.floor(diffInMinutes / 1440)} Tagen`;
  };

  return (
    <Card className="discord-bg-secondary border-discord-tertiary">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">Letzte Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !serverId ? (
          <p className="text-gray-400 text-center py-8">Wählen Sie einen Server aus um Aktivitäten zu sehen</p>
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Keine Aktivitäten gefunden</p>
        ) : (
          <div className="space-y-4">
            {logs.slice(0, 5).map((log: any) => {
              const activity = getActivityIcon(log.action);
              return (
                <div key={log.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <i className={`${activity.icon} text-xs text-white`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{log.reason || 'Moderation Action'}</p>
                    <p className="text-xs text-gray-400">
                      {log.targetId && `Benutzer: ${log.targetId.slice(0, 6)}...`} - {formatTimeAgo(log.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
