import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTenants } from '../api/hooks';

interface Tenant {
  id: string;
  identifier: string;
  name: string;
}

interface TenantContextValue {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  tenants: Tenant[];
  isLoading: boolean;
}

let TenantContext = createContext<TenantContextValue | null>(null);

export let TenantProvider = ({ children }: { children: ReactNode }) => {
  let [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(null);

  let { data, isLoading } = useTenants();
  let tenants = data?.items ?? [];

  // Restore from localStorage on mount
  useEffect(() => {
    let stored = localStorage.getItem('selectedTenant');
    if (stored) {
      try {
        setSelectedTenantState(JSON.parse(stored));
      } catch {
        localStorage.removeItem('selectedTenant');
      }
    }
  }, []);

  // Auto-select first tenant if none selected and tenants are loaded
  useEffect(() => {
    if (!selectedTenant && tenants.length > 0 && !localStorage.getItem('selectedTenant')) {
      setSelectedTenant(tenants[0]!);
    }
  }, [tenants, selectedTenant]);

  let setSelectedTenant = (tenant: Tenant | null) => {
    setSelectedTenantState(tenant);
    if (tenant) {
      localStorage.setItem('selectedTenant', JSON.stringify(tenant));
    } else {
      localStorage.removeItem('selectedTenant');
    }
  };

  return (
    <TenantContext.Provider value={{ selectedTenant, setSelectedTenant, tenants, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export let useTenantContext = () => {
  let ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenantContext must be used within TenantProvider');
  return ctx;
}

// Helper hook that requires a tenant - returns undefined if no tenant selected
export let useSelectedTenantId = (): string | undefined => {
  let { selectedTenant } = useTenantContext();
  return selectedTenant?.id;
}
