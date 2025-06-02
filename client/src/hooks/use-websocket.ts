import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    const { type, data: payload } = data;

    switch (type) {
      case 'warning_added':
        queryClient.invalidateQueries({ queryKey: [`/api/warnings/${payload.serverId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${payload.serverId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/moderation-logs/${payload.serverId}`] });
        
        toast({
          title: "Neue Verwarnung",
          description: `Eine neue Verwarnung wurde ausgesprochen.`,
        });
        break;

      case 'warning_removed':
        queryClient.invalidateQueries({ queryKey: [`/api/warnings/${payload.warning.serverId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${payload.warning.serverId}`] });
        
        toast({
          title: "Verwarnung entfernt",
          description: "Eine Verwarnung wurde entfernt.",
        });
        break;

      case 'ticket_created':
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${payload.serverId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${payload.serverId}`] });
        
        toast({
          title: "Neues Ticket",
          description: `Ticket #${payload.ticket.id} wurde erstellt.`,
        });
        break;

      case 'ticket_claimed':
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${payload.ticket.serverId}`] });
        
        toast({
          title: "Ticket beansprucht",
          description: `Ticket #${payload.ticket.id} wurde beansprucht.`,
        });
        break;

      case 'ticket_updated':
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${payload.ticket.serverId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/tickets/${payload.ticket.id}/messages`] });
        
        if (payload.ticket.status === 'closed') {
          toast({
            title: "Ticket geschlossen",
            description: `Ticket #${payload.ticket.id} wurde geschlossen.`,
          });
        }
        break;

      case 'category_added':
        queryClient.invalidateQueries({ queryKey: [`/api/ticket-categories/${payload.serverId}`] });
        
        toast({
          title: "Neue Kategorie",
          description: `Kategorie "${payload.category.name}" wurde erstellt.`,
        });
        break;

      case 'category_updated':
        queryClient.invalidateQueries({ queryKey: [`/api/ticket-categories/${payload.category.serverId}`] });
        break;

      case 'category_deleted':
        queryClient.invalidateQueries({ queryKey: ['/api/ticket-categories'] });
        
        toast({
          title: "Kategorie gelöscht",
          description: "Eine Ticket-Kategorie wurde gelöscht.",
        });
        break;

      default:
        console.log('Unknown WebSocket message type:', type);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    connected: wsRef.current?.readyState === WebSocket.OPEN,
    reconnecting: reconnectAttempts.current > 0,
  };
}
