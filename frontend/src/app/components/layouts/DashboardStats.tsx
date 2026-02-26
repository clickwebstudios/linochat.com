import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

interface DashboardStatsProps {
  /**
   * Array of stat cards to display
   */
  stats?: StatCardProps[];
  
  /**
   * Custom stat cards as children
   */
  children?: ReactNode;
  
  /**
   * Number of columns for grid layout
   */
  columns?: 1 | 2 | 3 | 4;
  
  /**
   * Custom className for the grid
   */
  className?: string;
}

/**
 * Dashboard stats component with flexible slot composition
 * 
 * @example
 * // Using stats prop
 * <DashboardStats 
 *   stats={[
 *     { title: 'Active Chats', value: 24, icon: MessageCircle, iconColor: 'text-blue-600' },
 *     { title: 'Open Tickets', value: 156, icon: Ticket, iconColor: 'text-orange-600' }
 *   ]}
 * />
 * 
 * @example
 * // Using children slot for custom cards
 * <DashboardStats>
 *   <CustomStatCard />
 *   <AnotherCustomCard />
 * </DashboardStats>
 */
export function DashboardStats({ 
  stats, 
  children, 
  columns = 4,
  className = ''
}: DashboardStatsProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  // If children provided, use slot-based composition
  if (children) {
    return (
      <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
        {children}
      </div>
    );
  }

  // Otherwise render from stats array
  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {stats?.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  {stat.trend && (
                    <p className={`text-xs mt-1 ${stat.trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.value}
                    </p>
                  )}
                </div>
                <Icon className={`h-8 w-8 ${stat.iconColor || 'text-gray-600'}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Individual stat card component for custom composition
 */
export function StatCard({ title, value, icon: Icon, iconColor, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={`text-xs mt-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value}
              </p>
            )}
          </div>
          <Icon className={`h-8 w-8 ${iconColor || 'text-gray-600'}`} />
        </div>
      </CardContent>
    </Card>
  );
}
