import { useNavigate, useLocation } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

interface UpgradePromptProps {
  title?: string;
  description?: string;
  /** If true, renders inline; otherwise renders as a card */
  inline?: boolean;
}

export function UpgradePrompt({
  title = 'Upgrade your plan',
  description = 'This feature requires a higher plan.',
  inline = false,
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const billingPath = location.pathname.startsWith('/agent')
    ? '/agent/billing'
    : location.pathname.startsWith('/superadmin')
    ? '/superadmin/billing'
    : '/admin/billing';

  if (inline) {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-800">{title}</p>
          <p className="text-xs text-amber-700">{description}</p>
        </div>
        <Button
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-white flex-shrink-0"
          onClick={() => navigate(billingPath)}
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardContent className="pt-6 flex flex-col items-center text-center p-8">
        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Zap className="h-6 w-6 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
        <Button
          className="bg-amber-500 hover:bg-amber-600 text-white"
          onClick={() => navigate(billingPath)}
        >
          <Zap className="h-4 w-4 mr-2" />
          View plans
        </Button>
      </CardContent>
    </Card>
  );
}
