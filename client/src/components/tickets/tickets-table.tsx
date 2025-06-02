import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import TicketModal from "./ticket-modal";

interface TicketsTableProps {
  serverId: string;
}

export default function TicketsTable({ serverId }: TicketsTableProps) {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
    queryKey: [`/api/tickets/${serverId}`],
    enabled: !!serverId,
  });

  const { data: categories = [] } = useQuery({
    queryKey: [`/api/ticket-categories/${serverId}`],
    enabled: !!serverId,
  });

  const claimTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return apiRequest('PUT', `/api/tickets/${ticketId}/claim`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${serverId}`] });
      toast({
        title: "Ticket beansprucht",
        description: "Das Ticket wurde erfolgreich Ihnen zugewiesen.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ticket konnte nicht beansprucht werden.",
        variant: "destructive",
      });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: number; status: string }) => {
      return apiRequest('PUT', `/api/tickets/${ticketId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${serverId}`] });
      toast({
        title: "Ticket aktualisiert",
        description: "Der Ticket-Status wurde erfolgreich geändert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ticket konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: "Offen", color: "discord-bg-yellow text-black" },
      assigned: { label: "Zugewiesen", color: "discord-bg-green text-white" },
      waiting: { label: "Wartend", color: "discord-bg-blurple text-white" },
      closed: { label: "Geschlossen", color: "bg-gray-600 text-white" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;
    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        {config.label}
      </Badge>
    );
  };

  const getCategoryBadge = (categoryId: number) => {
    const category = categories.find((c: any) => c.id === categoryId);
    if (!category) return <Badge variant="outline">Unbekannt</Badge>;
    
    const colorClass = category.color === "#5865F2" ? "discord-bg-blurple" :
                      category.color === "#ED4245" ? "discord-bg-red" :
                      category.color === "#57F287" ? "discord-bg-green" :
                      "discord-bg-yellow";
    
    return (
      <Badge className={`${colorClass} text-white px-2 py-1 text-xs font-medium`}>
        {category.emoji} {category.name}
      </Badge>
    );
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

  const filteredTickets = tickets.filter((ticket: any) => {
    const statusMatch = statusFilter === "all" || ticket.status === statusFilter;
    const categoryMatch = categoryFilter === "all" || ticket.categoryId.toString() === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  return (
    <>
      <Card className="discord-bg-secondary border-discord-tertiary">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg font-semibold text-white">Aktive Tickets</CardTitle>
            <div className="flex space-x-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48 discord-bg-tertiary text-white border-gray-600 focus:border-discord-blurple">
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent className="discord-bg-tertiary border-gray-600">
                  <SelectItem value="all" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                    Alle Kategorien
                  </SelectItem>
                  {categories.map((category: any) => (
                    <SelectItem 
                      key={category.id} 
                      value={category.id.toString()}
                      className="text-white hover:discord-bg-blurple focus:discord-bg-blurple"
                    >
                      {category.emoji} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 discord-bg-tertiary text-white border-gray-600 focus:border-discord-blurple">
                  <SelectValue placeholder="Alle Status" />
                </SelectTrigger>
                <SelectContent className="discord-bg-tertiary border-gray-600">
                  <SelectItem value="all" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                    Alle Status
                  </SelectItem>
                  <SelectItem value="open" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                    Offen
                  </SelectItem>
                  <SelectItem value="assigned" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                    Zugewiesen
                  </SelectItem>
                  <SelectItem value="waiting" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                    Wartend
                  </SelectItem>
                  <SelectItem value="closed" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                    Geschlossen
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {ticketsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="w-16 h-6" />
                  <Skeleton className="w-24 h-6" />
                  <Skeleton className="w-32 h-6" />
                  <Skeleton className="w-48 h-6" />
                  <Skeleton className="w-20 h-6" />
                </div>
              ))}
            </div>
          ) : !serverId ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Wählen Sie einen Server aus um Tickets zu sehen</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-ticket-alt text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-400">
                {tickets.length === 0 ? "Keine Tickets gefunden" : "Keine Tickets entsprechen den Filterkriterien"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-discord-tertiary">
                    <TableHead className="text-gray-400">Ticket ID</TableHead>
                    <TableHead className="text-gray-400">Kategorie</TableHead>
                    <TableHead className="text-gray-400">Benutzer</TableHead>
                    <TableHead className="text-gray-400">Betreff</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Zugewiesen an</TableHead>
                    <TableHead className="text-gray-400">Erstellt</TableHead>
                    <TableHead className="text-gray-400">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket: any) => (
                    <TableRow 
                      key={ticket.id} 
                      className="border-discord-tertiary hover:discord-bg-tertiary transition-colors"
                    >
                      <TableCell>
                        <span className="discord-text-blurple font-mono font-medium">#{ticket.id}</span>
                      </TableCell>
                      <TableCell>
                        {getCategoryBadge(ticket.categoryId)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <img 
                            src={`https://cdn.discordapp.com/embed/avatars/${ticket.userId.slice(-1)}.png`}
                            alt="User Avatar" 
                            className="w-6 h-6 rounded-full" 
                          />
                          <span className="text-white">User #{ticket.userId.slice(-4)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {ticket.subject}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ticket.status)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {ticket.assignedTo ? `@${ticket.assignedTo.slice(-4)}` : 'Nicht zugewiesen'}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatTimeAgo(ticket.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-discord-blurple hover:text-blue-300"
                            onClick={() => handleViewTicket(ticket)}
                            title="Anzeigen"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          {ticket.status === 'open' && !ticket.assignedTo && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-discord-yellow hover:text-yellow-300"
                              onClick={() => claimTicketMutation.mutate(ticket.id)}
                              disabled={claimTicketMutation.isPending}
                              title="Beanspruchen"
                            >
                              <i className="fas fa-hand-paper"></i>
                            </Button>
                          )}
                          {ticket.status !== 'closed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-discord-green hover:text-green-300"
                              onClick={() => updateTicketMutation.mutate({ ticketId: ticket.id, status: 'closed' })}
                              disabled={updateTicketMutation.isPending}
                              title="Schließen"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TicketModal
        ticket={selectedTicket}
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false);
          setSelectedTicket(null);
        }}
        serverId={serverId}
      />
    </>
  );
}
