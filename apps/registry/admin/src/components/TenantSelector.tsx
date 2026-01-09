import { Select, Text } from '@metorial-io/ui';
import { useTenantContext } from '../context/TenantContext';

export let TenantSelector = () => {
  let { tenants, selectedTenant, setSelectedTenant, isLoading } = useTenantContext();

  if (isLoading) {
    return (
      <Text size="2" color="gray600" style={{ padding: '10px 0' }}>
        Loading tenants...
      </Text>
    );
  }

  if (tenants.length === 0) {
    return (
      <Text size="2" color="gray600" style={{ padding: '10px 0', fontStyle: 'italic' }}>
        No tenants available
      </Text>
    );
  }

  return (
    <Select
      size="2"
      value={selectedTenant?.id ?? ''}
      onChange={value => {
        let tenant = tenants.find(t => t.id === value);
        setSelectedTenant(tenant ?? null);
      }}
      placeholder="Select a tenant..."
      items={tenants.map(tenant => ({
        id: tenant.id,
        label: tenant.name
      }))}
    />
  );
}
