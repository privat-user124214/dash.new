import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TicketCategoriesProps {
  serverId: string;
}

export default function TicketCategories({ serverId }: TicketCategoriesProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: [`/api/ticket-categories/${serverId}`],
    enabled: !!serverId,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: [`/api/tickets/${serverId}`],
    enabled: !!serverId,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/ticket-categories', {
        serverId,
        name: "Neue Kategorie",
        description: "Beschreibung hinzufügen",
        emoji: "📝",
        color: "#5865F2",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/ticket-categories/${serverId}`] });
      toast({
        title: "Kategorie erstellt",
        description: "Eine neue Ticket-Kategorie wurde erstellt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Kategorie konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const getCategoryStats = (categoryId: number) => {
    const categoryTickets = tickets.filter((ticket: any) => ticket.categoryId === categoryId);
    return {
      openTickets: categoryTickets.filter((t: any) => t.status === 'open').length,
      assignedTickets: categoryTickets.filter((t: any) => t.assignedTo).length,
      avgResponseTime: "2.5h", // Placeholder
    };
  };

  const getCategoryColor = (color: string) => {
    const colorMap: Record<string, string> = {
      "#5865F2": "discord-bg-blurple",
      "#ED4245": "discord-bg-red",
      "#57F287": "discord-bg-green",
      "#FEE75C": "discord-bg-yellow",
    };
    return colorMap[color] || "discord-bg-blurple";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white">Ticket System</h3>
        <div className="flex space-x-3">
          <Button
            onClick={() => createCategoryMutation.mutate()}
            className="discord-button-success"
            disabled={!serverId || createCategoryMutation.isPending}
          >
            <i className="fas fa-plus mr-2"></i>
            Neue Kategorie
          </Button>
          <Button className="discord-button-primary" disabled={!serverId}>
            <i className="fas fa-cog mr-2"></i>
            Einstellungen
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="discord-bg-secondary border-discord-tertiary">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full mb-4" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !serverId ? (
        <Card className="discord-bg-secondary border-discord-tertiary">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Wählen Sie einen Server aus um Ticket-Kategorien zu sehen</p>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card className="discord-bg-secondary border-discord-tertiary">
          <CardContent className="p-8 text-center">
            <i className="fas fa-ticket-alt text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-400 mb-4">Keine Ticket-Kategorien gefunden</p>
            <Button
              onClick={() => createCategoryMutation.mutate()}
              className="discord-button-primary"
              disabled={createCategoryMutation.isPending}
            >
              <i className="fas fa-plus mr-2"></i>
              Erste Kategorie erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: any) => {
            const stats = getCategoryStats(category.id);
            return (
              <Card key={category.id} className="discord-bg-secondary border-discord-tertiary slide-up">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${getCategoryColor(category.color)} rounded-lg flex items-center justify-center`}>
                        <span className="text-white text-lg">{category.emoji || "📝"}</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{category.name}</h4>
                        <p className="text-gray-400 text-sm">{category.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                      title="Kategorie bearbeiten"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Offene Tickets:</span>
                      <span className="text-white font-medium">{stats.openTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Zugewiesene:</span>
                      <span className="text-white font-medium">{stats.assignedTickets}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Durchschnittliche Zeit:</span>
                      <span className="text-white font-medium">{stats.avgResponseTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
