import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { api } from '../../api/client';
import { CheckCircle2, XCircle, ExternalLink, MessageCircle } from 'lucide-react';

function FrubixLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#6366F1" />
      <text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold" fontFamily="system-ui">F</text>
    </svg>
  );
}
import type { FrubixConfig } from '../../types/frubix';

interface IntegrationsTabProps {
  project: { id: string };
}

export function IntegrationsTab({ project }: IntegrationsTabProps) {
  const [frubix, setFrubix] = useState<FrubixConfig>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isFrubixManaged, setIsFrubixManaged] = useState(false);

  useEffect(() => {
    api.get<any>(`/projects/${project.id}/integrations`).then((res) => {
      if (res.success && res.data?.frubix) {
        setFrubix(res.data.frubix);
        setIsConnected(res.data.frubix.enabled === true || res.data.frubix.connected === true);
      }
      if (res.success && res.data?.frubix_managed?.enabled) {
        setIsFrubixManaged(true);
      }
    }).catch(() => {});
  }, [project.id]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Integrations</h2>
        <p className="text-sm text-muted-foreground mt-1">Connect external platforms to sync data with this project.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FrubixLogo className="h-10 w-10" />
              <div>
                <CardTitle className="text-base">Frubix</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Field service management — sync leads, jobs, and clients</p>
              </div>
            </div>
            {isConnected ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground gap-1">
                <XCircle className="h-3 w-3" /> Not connected
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isConnected ? (
            <div className="space-y-3">
              {frubix.url && (
                <p className="text-sm text-muted-foreground">
                  Connected to <span className="font-medium">{frubix.url}</span>
                </p>
              )}
              {frubix.connected_at && (
                <p className="text-xs text-muted-foreground">
                  Connected {new Date(frubix.connected_at).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Agents can create Frubix leads directly from tickets. AI can look up clients and manage appointments.
              </p>
              {frubix.url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={frubix.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open Frubix
                  </a>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Integrate with Frubix to automatically sync leads from tickets and enable AI appointment management.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="https://frubix.com" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Go to Frubix to connect
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isFrubixManaged && (
        <Card className="border-indigo-200 bg-indigo-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Chat Managed by Frubix</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Agent replies for this project are handled in Frubix</p>
                </div>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Customer messages from the widget are forwarded to Frubix. AI responses are disabled on LinoChat — all conversations are managed by Frubix agents.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
