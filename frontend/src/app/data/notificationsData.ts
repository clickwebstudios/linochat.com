export type NotificationType = 'alert' | 'security' | 'user' | 'billing' | 'system' | 'success';

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: NotificationType;
}

export const notificationsData: Notification[] = [
  {
    id: '1',
    title: 'High CPU usage detected',
    description: 'Server us-east-1 has exceeded 90% CPU for 15 minutes.',
    time: '2 min ago',
    read: false,
    type: 'alert',
  },
  {
    id: '2',
    title: 'New company registered',
    description: 'NovaTech Industries signed up for the Enterprise plan.',
    time: '15 min ago',
    read: false,
    type: 'user',
  },
  {
    id: '3',
    title: 'Failed login attempts',
    description: '5 failed login attempts for admin@techcorp.com.',
    time: '1 hour ago',
    read: false,
    type: 'security',
  },
  {
    id: '4',
    title: 'Invoice payment received',
    description: 'StartupXYZ paid invoice #INV-2024-0892 ($79.00).',
    time: '2 hours ago',
    read: true,
    type: 'billing',
  },
  {
    id: '5',
    title: 'System update completed',
    description: 'Platform v3.2.1 deployed successfully across all regions.',
    time: '3 hours ago',
    read: true,
    type: 'success',
  },
  {
    id: '6',
    title: 'New user onboarded',
    description: 'Sarah Chen joined Global Services Inc as an agent.',
    time: '5 hours ago',
    read: true,
    type: 'user',
  },
  {
    id: '7',
    title: 'Scheduled maintenance',
    description: 'Database maintenance window starts Dec 25 at 2:00 AM UTC.',
    time: '1 day ago',
    read: true,
    type: 'system',
  },
  {
    id: '8',
    title: 'New agent assigned',
    description: 'Michael Torres was assigned to the TechCorp Solutions team.',
    time: '1 day ago',
    read: true,
    type: 'user',
  },
  {
    id: '9',
    title: 'Disk space warning',
    description: 'Database server db-primary is at 85% storage capacity.',
    time: '2 days ago',
    read: true,
    type: 'alert',
  },
  {
    id: '10',
    title: 'SSL certificate renewed',
    description: 'SSL certificate for *.linochat.io renewed successfully. Expires Feb 2027.',
    time: '2 days ago',
    read: true,
    type: 'success',
  },
  {
    id: '11',
    title: 'Monthly billing cycle completed',
    description: 'All invoices for January 2026 have been processed. Total: $12,450.',
    time: '3 days ago',
    read: true,
    type: 'billing',
  },
  {
    id: '12',
    title: 'API rate limit exceeded',
    description: 'Company "Digital Dynamics" exceeded API rate limits on the chat endpoint.',
    time: '3 days ago',
    read: true,
    type: 'alert',
  },
  {
    id: '13',
    title: 'New security policy applied',
    description: 'Two-factor authentication is now required for all superadmin accounts.',
    time: '4 days ago',
    read: true,
    type: 'security',
  },
  {
    id: '14',
    title: 'Backup completed',
    description: 'Full system backup completed. Snapshot stored in us-west-2 region.',
    time: '5 days ago',
    read: true,
    type: 'system',
  },
  {
    id: '15',
    title: 'Company plan upgraded',
    description: 'Global Services Inc upgraded from Pro to Enterprise plan.',
    time: '5 days ago',
    read: true,
    type: 'billing',
  },
  {
    id: '16',
    title: 'Suspicious activity detected',
    description: 'Unusual login pattern detected for user maria@startupxyz.com from 3 countries.',
    time: '6 days ago',
    read: true,
    type: 'security',
  },
  {
    id: '17',
    title: 'Widget deployment verified',
    description: 'Chat widget successfully deployed on ecommerce-demo.com (Project: E-Commerce Site).',
    time: '1 week ago',
    read: true,
    type: 'success',
  },
  {
    id: '18',
    title: 'Database migration completed',
    description: 'Migration to PostgreSQL 16 completed with zero downtime.',
    time: '1 week ago',
    read: true,
    type: 'system',
  },
];
