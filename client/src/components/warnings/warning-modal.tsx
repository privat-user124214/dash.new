import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverId: string;
}

export default function WarningModal({ isOpen, onClose, serverId }: WarningModalProps) {
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createWarningMutation = useMutation({
    mutationFn: async (data: { userId: string; reason: string; serverId: string }) => {
      return apiRequest('POST', '/api/warnings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/warnings/${serverId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/dashboard/stats/${serverId}`] });
      toast({
        title: "Verwarnung ausgesprochen",
        description: "Die Verwarnung wurde erfolgreich erstellt.",
      });
      handleClose();
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Verwarnung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId.trim() || !reason.trim()) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    createWarningMutation.mutate({
      userId: userId.trim(),
      reason: reason.trim(),
      serverId,
    });
  };

  const handleClose = () => {
    setUserId("");
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="discord-bg-secondary border-discord-tertiary text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            <i className="fas fa-exclamation-triangle discord-text-yellow mr-2"></i>
            Verwarnung aussprechen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="userId" className="text-gray-300">
              Benutzer ID oder @Mention
            </Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="123456789012345678 oder @Benutzer"
              className="discord-bg-tertiary border-gray-600 text-white focus:border-discord-blurple"
            />
            <p className="text-xs text-gray-400 mt-1">
              Geben Sie die Discord-Benutzer-ID oder einen @Mention ein
            </p>
          </div>

          <div>
            <Label htmlFor="reason" className="text-gray-300">
              Grund für die Verwarnung
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Spam in #general, Unhöfliches Verhalten, etc."
              rows={3}
              className="discord-bg-tertiary border-gray-600 text-white focus:border-discord-blurple resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              className="discord-button-danger"
              disabled={createWarningMutation.isPending}
            >
              {createWarningMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Wird erstellt...
                </>
              ) : (
                <>
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Verwarnung aussprechen
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
