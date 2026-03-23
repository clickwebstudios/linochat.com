import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { api } from '../../api/client';
import { Link2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import type { FrubixConfig } from '../../types/frubix';

interface IntegrationsTabProps {
  project: { id: string };
}

export function IntegrationsTab({ project }: IntegrationsTabProps) {
  const [frubix, setFrubix] = useState<FrubixConfig>({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    api.get<any>(`/projects/${project.id}/integrations`).then((res) => {
      if (res.success && res.data?.frubix) {
        setFrubix(res.data.frubix);
        setIsConnected(res.data.frubix.enabled === true || res.data.frubix.connected === true);
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
              <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <Link2 className="h-5 w-5 text-secondary" />
              </div>
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
    </div>
  );
}
