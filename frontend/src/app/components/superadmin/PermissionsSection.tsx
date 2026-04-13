import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Check } from 'lucide-react';

// Predefined roles
const roleNames = ['Superadmin', 'Admin', 'Agent', 'Viewer', 'Billing Manager'];

const roleUserCounts: Record<string, number> = {
  Superadmin: 2,
  Admin: 5,
  Agent: 38,
  Viewer: 8,
  'Billing Manager': 3,
};

interface PermissionEntry {
  key: string;
  label: string;
  roles: Record<string, boolean>;
}

interface PermissionModule {
  module: string;
  description: string;
  permissions: PermissionEntry[];
}

const initialPermissionModules: PermissionModule[] = [
  {
    module: 'Dashboard',
    description: 'Platform overview and analytics',
    permissions: [
      { key: 'dashboard.view', label: 'View dashboard', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: true, 'Billing Manager': true } },
      { key: 'dashboard.manage', label: 'Customize widgets', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Live Chat',
    description: 'Real-time customer conversations',
    permissions: [
      { key: 'chats.view', label: 'View chats', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: true, 'Billing Manager': false } },
      { key: 'chats.manage', label: 'Send messages', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: false, 'Billing Manager': false } },
      { key: 'chats.transfer', label: 'Transfer chats', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: false, 'Billing Manager': false } },
      { key: 'chats.delete', label: 'Delete chats', roles: { Superadmin: true, Admin: false, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Tickets',
    description: 'Support ticket management',
    permissions: [
      { key: 'tickets.view', label: 'View tickets', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: true, 'Billing Manager': false } },
      { key: 'tickets.manage', label: 'Create & update tickets', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: false, 'Billing Manager': false } },
      { key: 'tickets.assign', label: 'Assign tickets', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'tickets.delete', label: 'Delete tickets', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Knowledge Base',
    description: 'Articles and help documentation',
    permissions: [
      { key: 'knowledge.view', label: 'View articles', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: true, 'Billing Manager': false } },
      { key: 'knowledge.manage', label: 'Create & edit articles', roles: { Superadmin: true, Admin: true, Agent: true, Viewer: false, 'Billing Manager': false } },
      { key: 'knowledge.publish', label: 'Publish articles', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'knowledge.delete', label: 'Delete articles', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Projects',
    description: 'Project configuration and management',
    permissions: [
      { key: 'projects.view', label: 'View projects', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'projects.manage', label: 'Create & edit projects', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'projects.delete', label: 'Delete projects', roles: { Superadmin: true, Admin: false, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Users & Team',
    description: 'User accounts and team management',
    permissions: [
      { key: 'users.view', label: 'View users', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'users.manage', label: 'Invite & edit users', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'users.roles', label: 'Assign roles', roles: { Superadmin: true, Admin: false, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'users.delete', label: 'Remove users', roles: { Superadmin: true, Admin: false, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Reports',
    description: 'Analytics and performance reports',
    permissions: [
      { key: 'reports.view', label: 'View reports', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: true, 'Billing Manager': true } },
      { key: 'reports.export', label: 'Export data', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': true } },
    ],
  },
  {
    module: 'Integrations',
    description: 'Third-party service connections',
    permissions: [
      { key: 'integrations.view', label: 'View integrations', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
      { key: 'integrations.manage', label: 'Configure integrations', roles: { Superadmin: true, Admin: true, Agent: false, Viewer: false, 'Billing Manager': false } },
    ],
  },
  {
    module: 'Billing',
    description: 'Plans, invoices, and payment settings',
    permissions: [
      { key: 'billing.view', label: 'View billing info', roles: { Superadmin: true, Admin: false, Agent: false, Viewer: false, 'Billing Manager': true } },
      { key: 'billing.manage', label: 'Manage billing', roles: { Superadmin: true, Admin: false, Agent: false, Viewer: false, 'Billing Manager': true } },
    ],
  },
];

export function PermissionsSection() {
  const [permissionModules, setPermissionModules] = useState<PermissionModule[]>(initialPermissionModules);
  const [hasChanges, setHasChanges] = useState(false);

  const handleToggle = (moduleIndex: number, permIndex: number, role: string) => {
    if (role === 'Superadmin') return; // Superadmin always locked on
    setPermissionModules((prev) => {
      const updated = prev.map((mod, mi) => {
        if (mi !== moduleIndex) return mod;
        return {
          ...mod,
          permissions: mod.permissions.map((perm, pi) => {
            if (pi !== permIndex) return perm;
            return {
              ...perm,
              roles: { ...perm.roles, [role]: !perm.roles[role] },
            };
          }),
        };
      });
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    // In a real app, this would persist to the backend
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Permissions</h2>
          <p className="text-sm text-muted-foreground">
            Configure what each role can access across the platform.
          </p>
        </div>
        <Button
          variant={hasChanges ? 'default' : 'outline'}
          size="sm"
          disabled={!hasChanges}
          onClick={handleSave}
          className={hasChanges ? 'bg-primary' : ''}
        >
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Permission</TableHead>
                {roleNames.map((role) => (
                  <TableHead key={role} className="text-center min-w-[110px]">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{role}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {roleUserCounts[role] || 0} users
                      </span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionModules.flatMap((mod, moduleIndex) => [
                <TableRow key={`header-${mod.module}`} className="bg-muted/50">
                  <TableCell
                    colSpan={roleNames.length + 1}
                    className="py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{mod.module}</span>
                      <span className="text-xs text-muted-foreground">{mod.description}</span>
                    </div>
                  </TableCell>
                </TableRow>,
                ...mod.permissions.map((perm, permIndex) => (
                  <TableRow key={perm.key}>
                    <TableCell className="pl-8 text-sm text-foreground">
                      {perm.label}
                    </TableCell>
                    {roleNames.map((role) => (
                      <TableCell key={role} className="text-center">
                        {role === 'Superadmin' ? (
                          <div className="flex justify-center">
                            <Check className="h-4 w-4 text-secondary" />
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <Switch
                              checked={perm.roles[role] || false}
                              onCheckedChange={() => handleToggle(moduleIndex, permIndex, role)}
                              className="data-[state=checked]:bg-primary"
                            />
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                )),
              ])}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
