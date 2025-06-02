import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Handle Discord OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      handleDiscordCallback(code);
    }
  }, []);

  const handleDiscordCallback = async (code: string) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/discord', { code });
      const data = await response.json();
      
      // Store JWT token
      localStorage.setItem('auth_token', data.token);
      
      toast({
        title: "Erfolgreich angemeldet",
        description: `Willkommen zurück, ${data.user.username}!`,
      });
      
      setLocation('/');
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: "Es gab ein Problem bei der Anmeldung. Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDiscordLogin = () => {
    // Verwende die bereitgestellte OAuth URL mit angepasster redirect_uri
    const currentDomain = window.location.origin;
    const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=1379208014694973601&response_type=code&redirect_uri=${encodeURIComponent(currentDomain + '/auth/callback')}&scope=email+guilds.members.read+guilds`;
    
    window.location.href = discordAuthUrl;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center discord-bg-dark">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center discord-bg-dark p-4">
      <Card className="w-full max-w-md discord-bg-secondary border-discord-tertiary">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 discord-bg-blurple rounded-lg flex items-center justify-center mb-4">
            <i className="fas fa-robot text-white text-2xl"></i>
          </div>
          <CardTitle className="text-2xl font-bold text-white">DiscordNova</CardTitle>
          <CardDescription className="text-gray-400">
            Bot Dashboard - Melde dich mit Discord an
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDiscordLogin}
            className="w-full discord-button-primary text-lg py-6"
            disabled={loading}
          >
            <i className="fab fa-discord text-xl mr-3"></i>
            Mit Discord anmelden
          </Button>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400 mb-4">
              Funktionen des Dashboards:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle w-4 mr-2 discord-text-yellow"></i>
                Verwarnungen
              </div>
              <div className="flex items-center">
                <i className="fas fa-ticket-alt w-4 mr-2 discord-text-green"></i>
                Tickets
              </div>
              <div className="flex items-center">
                <i className="fas fa-shield-alt w-4 mr-2 discord-text-blurple"></i>
                Moderation
              </div>
              <div className="flex items-center">
                <i className="fas fa-chart-line w-4 mr-2 discord-text-red"></i>
                Statistiken
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
