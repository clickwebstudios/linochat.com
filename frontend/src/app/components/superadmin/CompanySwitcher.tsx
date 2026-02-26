import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  projects_count: number;
  agents_count: number;
}

interface CompanySwitcherProps {
  selectedCompanyId: string | null;
  onCompanyChange: (companyId: string | null) => void;
}

export function CompanySwitcher({ selectedCompanyId, onCompanyChange }: CompanySwitcherProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  async function fetchCompanies() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch('/api/superadmin/companies?per_page=100', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCompanies(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const handleSelect = (companyId: string | null) => {
    onCompanyChange(companyId);
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      toast.success(`Switched to ${company?.name || 'company'}`);
    } else {
      toast.success('Showing all companies');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="truncate max-w-[150px]">
              {selectedCompany ? selectedCompany.name : 'All Companies'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Select Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleSelect(null)}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                  ALL
                </AvatarFallback>
              </Avatar>
              <span>All Companies</span>
            </div>
            {!selectedCompanyId && <Check className="h-4 w-4" />}
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {loading ? (
          <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
        ) : companies.length === 0 ? (
          <DropdownMenuItem disabled>No companies found</DropdownMenuItem>
        ) : (
          companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onClick={() => handleSelect(company.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {company.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{company.name}</span>
                    <span className="text-xs text-gray-500">
                      {company.projects_count} projects · {company.agents_count} agents
                    </span>
                  </div>
                </div>
                {selectedCompanyId === company.id && <Check className="h-4 w-4" />}
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => navigate('/superadmin/companies')}
          className="cursor-pointer text-blue-600"
        >
          Manage Companies →
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
