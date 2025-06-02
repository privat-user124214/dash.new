import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import WarningModal from "./warning-modal";

interface WarningsTableProps {
  serverId: string;
}

export default function WarningsTable({ serverId }: WarningsTableProps) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: warnings = [], isLoading } = useQuery({
    queryKey: [`/api/warnings/${serverId}`],
    enabled: !!serverId,
  });

  const { data: stats } = useQuery({
    queryKey: [`/api/dashboard/stats/${serverId}`],
    enabled: !!serverId,
  });

  const removeWarningMutation = useMutation({
    mutationFn: async (warningId: number) => {
      return apiRequest('DELETE', `/api/warnings/${warningId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/warnings/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${serverId}`] });
      toast({
        title: "Verwarnung entfernt",
        description: "Die Verwarnung wurde erfolgreich entfernt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Verwarnung konnte nicht entfernt werden.",
        variant: "destructive",
      });
    },
  });

  const renderWarningDots = (warningNumber: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((dot) => (
          <div
            key={dot}
            className={`w-2 h-2 rounded-full ${
              dot <= warningNumber ? 'discord-bg-red' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  const getWarningColor = (warningNumber: number) => {
    if (warningNumber >= 4) return 'discord-bg-red';
    if (warningNumber >= 3) return 'discord-bg-red';
    if (warningNumber >= 2) return 'discord-bg-yellow';
    return 'discord-bg-yellow';
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'vor weniger als 1 Stunde';
    if (diffInHours < 24) return `vor ${diffInHours} Stunden`;
    return `vor ${Math.floor(diffInHours / 24)} Tagen`;
  };

  return (
    <>
      <Card className="discord-bg-secondary border-discord-tertiary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white">Verwarnungssystem</CardTitle>
            <Button 
              onClick={() => setShowWarningModal(true)}
              className="discord-button-primary"
              disabled={!serverId}
            >
              <i className="fas fa-plus mr-2"></i>
              Verwarnung aussprechen
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Warning System Status */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="discord-bg-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Heute ausgesprochen</p>
                    <p className="text-2xl font-bold text-white">{stats.warnings24h}</p>
                  </div>
                  <i className="fas fa-calendar-day discord-text-yellow text-xl"></i>
                </div>
              </div>
              <div className="discord-bg-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Aktive Verwarnungen</p>
                    <p className="text-2xl font-bold text-white">{warnings.filter((w: any) => w.isActive).length}</p>
                  </div>
                  <i className="fas fa-exclamation-triangle discord-text-red text-xl"></i>
                </div>
              </div>
              <div className="discord-bg-tertiary rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Durchschnitt/Tag</p>
                    <p className="text-2xl font-bold text-white">8.3</p>
                  </div>
                  <i className="fas fa-chart-line discord-text-green text-xl"></i>
                </div>
              </div>
            </div>
          )}

          {/* Warnings Table */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : !serverId ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Wählen Sie einen Server aus um Verwarnungen zu sehen</p>
            </div>
          ) : warnings.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-check-circle text-4xl discord-text-green mb-4"></i>
              <p className="text-gray-400">Keine Verwarnungen gefunden</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-discord-tertiary">
                    <TableHead className="text-gray-400">Benutzer</TableHead>
                    <TableHead className="text-gray-400">Verwarnungen</TableHead>
                    <TableHead className="text-gray-400">Letzter Grund</TableHead>
                    <TableHead className="text-gray-400">Moderator</TableHead>
                    <TableHead className="text-gray-400">Datum</TableHead>
                    <TableHead className="text-gray-400">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warnings.map((warning: any) => (
                    <TableRow 
                      key={warning.id} 
                      className="border-discord-tertiary hover:discord-bg-tertiary transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={`https://cdn.discordapp.com/embed/avatars/${warning.userId.slice(-1)}.png`}
                            alt="User Avatar" 
                            className="w-8 h-8 rounded-full" 
                          />
                          <div>
                            <p className="text-white font-medium">User #{warning.userId.slice(-4)}</p>
                            <p className="text-gray-400 text-sm font-mono">#{warning.userId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className={`${getWarningColor(warning.warningNumber)} text-white px-2 py-1 rounded-full text-xs font-medium`}>
                            {warning.warningNumber}/4
                          </span>
                          {renderWarningDots(warning.warningNumber)}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {warning.reason}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        @{warning.moderatorId.slice(-4)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {formatTimeAgo(warning.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-discord-blurple hover:text-blue-300"
                            title="Verlauf anzeigen"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-discord-red hover:text-red-300"
                            onClick={() => removeWarningMutation.mutate(warning.id)}
                            disabled={removeWarningMutation.isPending}
                            title="Verwarnung entfernen"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
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

      <WarningModal 
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        serverId={serverId}
      />
    </>
  );
}
