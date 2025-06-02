import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TicketModalProps {
  ticket: any;
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
}

export default function TicketModal({ ticket, isOpen, onClose, serverId }: TicketModalProps) {
  const [newMessage, setNewMessage] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: [`/api/tickets/${ticket?.id}/messages`],
    enabled: !!ticket?.id && isOpen,
  });

  const { data: categories = [] } = useQuery({
    queryKey: [`/api/ticket-categories/${serverId}`],
    enabled: !!serverId,
  });

  useEffect(() => {
    if (ticket) {
      setNewStatus(ticket.status);
    }
  }, [ticket]);

  const claimTicketMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', `/api/tickets/${ticket.id}/claim`);
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
    mutationFn: async (status: string) => {
      return apiRequest('PUT', `/api/tickets/${ticket.id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${serverId}`] });
      toast({
        title: "Ticket aktualisiert",
        description: "Das Ticket wurde erfolgreich aktualisiert.",
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

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/ticket-messages', {
        ticketId: ticket.id,
        content,
        isStaff: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticket.id}/messages`] });
      setNewMessage("");
      toast({
        title: "Nachricht gesendet",
        description: "Ihre Nachricht wurde erfolgreich gesendet.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Nachricht konnte nicht gesendet werden.",
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

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'gerade eben';
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`;
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Std`;
    return `vor ${Math.floor(diffInMinutes / 1440)} Tagen`;
  };

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    updateTicketMutation.mutate(status);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  if (!ticket) return null;

  const category = categories.find((c: any) => c.id === ticket.categoryId);
  const categoryColor = category?.color === "#5865F2" ? "discord-bg-blurple" :
                        category?.color === "#ED4245" ? "discord-bg-red" :
                        category?.color === "#57F287" ? "discord-bg-green" :
                        "discord-bg-yellow";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="discord-bg-secondary border-discord-tertiary text-white max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b border-discord-tertiary pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">
                Ticket #{ticket.id} - {category?.name || 'Unbekannt'}
              </DialogTitle>
              <p className="text-gray-400">
                Erstellt von User #{ticket.userId.slice(-4)} - {formatTimeAgo(ticket.createdAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <i className="fas fa-times text-xl"></i>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          {/* Ticket Content */}
          <div className="flex-1 p-4">
            <div className="mb-4 p-4 discord-bg-tertiary rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                {getStatusBadge(ticket.status)}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Priorität: {ticket.priority || 'Normal'}</span>
                {ticket.assignedTo && <span>Zugewiesen an: @{ticket.assignedTo.slice(-4)}</span>}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-64 mb-4">
              {messagesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 discord-bg-tertiary rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">Keine Nachrichten in diesem Ticket</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message: any) => (
                    <div key={message.id} className="p-4 discord-bg-tertiary rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <img 
                          src={`https://cdn.discordapp.com/embed/avatars/${message.userId.slice(-1)}.png`}
                          alt="User Avatar" 
                          className="w-8 h-8 rounded-full" 
                        />
                        <span className="text-white font-medium">
                          {message.isStaff ? 'Staff' : 'User'} #{message.userId.slice(-4)}
                        </span>
                        <span className="text-gray-400 text-sm">{formatTimeAgo(message.createdAt)}</span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* New Message */}
            <div className="space-y-3">
              <Textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Antwort schreiben..."
                className="discord-bg-tertiary border-gray-600 text-white focus:border-discord-blurple resize-none"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="discord-button-primary"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Wird gesendet...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Antworten
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="border-t border-discord-tertiary p-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                {ticket.status === 'open' && !ticket.assignedTo && (
                  <Button
                    onClick={() => claimTicketMutation.mutate()}
                    disabled={claimTicketMutation.isPending}
                    className="discord-button-warning"
                  >
                    <i className="fas fa-hand-paper mr-2"></i>
                    Beanspruchen
                  </Button>
                )}
                {ticket.status !== 'closed' && (
                  <Button
                    onClick={() => handleStatusChange('closed')}
                    disabled={updateTicketMutation.isPending}
                    className="discord-button-success"
                  >
                    <i className="fas fa-check mr-2"></i>
                    Schließen
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <i className="fas fa-exchange-alt mr-2"></i>
                  Übertragen
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-gray-400">Status:</span>
                <Select value={newStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-40 discord-bg-tertiary text-white border-gray-600 focus:border-discord-blurple">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="discord-bg-tertiary border-gray-600">
                    <SelectItem value="open" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                      Offen
                    </SelectItem>
                    <SelectItem value="assigned" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                      In Bearbeitung
                    </SelectItem>
                    <SelectItem value="waiting" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                      Wartend auf Benutzer
                    </SelectItem>
                    <SelectItem value="closed" className="text-white hover:discord-bg-blurple focus:discord-bg-blurple">
                      Geschlossen
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
