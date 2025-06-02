import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsCardsProps {
  serverId: string;
}

export default function StatsCards({ serverId }: StatsCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: [`/api/dashboard/stats/${serverId}`],
    enabled: !!serverId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="discord-bg-secondary border-discord-tertiary">
            <CardContent className="p-6">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats || !serverId) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="discord-bg-secondary border-discord-tertiary">
          <CardContent className="p-6 text-center">
            <p className="text-gray-400">Bitte wählen Sie einen Server aus</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      title: "Gesamte Mitglieder",
      value: stats.totalMembers.toLocaleString(),
      icon: "fas fa-users",
      color: "discord-bg-blurple",
      change: "+12%",
      changeLabel: "letzte 30 Tage",
      changeType: "positive"
    },
    {
      title: "Aktive Tickets",
      value: stats.activeTickets.toString(),
      icon: "fas fa-ticket-alt",
      color: "discord-bg-yellow",
      change: "+5",
      changeLabel: "seit gestern",
      changeType: "neutral"
    },
    {
      title: "Verwarnungen (24h)",
      value: stats.warnings24h.toString(),
      icon: "fas fa-exclamation-triangle",
      color: "discord-bg-red",
      change: "-3",
      changeLabel: "vs. gestern",
      changeType: "positive"
    },
    {
      title: "Bot Uptime",
      value: stats.uptime,
      icon: "fas fa-check-circle",
      color: "discord-bg-green",
      change: "",
      changeLabel: "7 Tage",
      changeType: "neutral"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card key={index} className="discord-bg-secondary border-discord-tertiary slide-up">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <i className={`${stat.icon} text-white ${stat.color === 'discord-bg-yellow' ? 'text-black' : ''}`}></i>
              </div>
            </div>
            {(stat.change || stat.changeLabel) && (
              <div className="mt-4 flex items-center">
                {stat.change && (
                  <span className={`text-sm ${
                    stat.changeType === 'positive' ? 'discord-text-green' : 
                    stat.changeType === 'negative' ? 'discord-text-red' : 
                    'text-gray-400'
                  }`}>
                    {stat.change}
                  </span>
                )}
                <span className="text-gray-400 text-sm ml-2">{stat.changeLabel}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
