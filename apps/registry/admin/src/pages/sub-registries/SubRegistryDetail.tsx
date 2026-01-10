import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Flex, Text, Group, Badge, Input, Spacer, Error } from '@metorial-io/ui';
import { useSubRegistry, useTenant, useAddSubRegistryFilter, useRemoveSubRegistryFilter } from '../../api/hooks';

function getFilterTypeDescription(filterType: 'scope_type' | 'prefix' | 'package'): string {
  if (filterType === 'scope_type') return 'Filter by owner type: show only user-owned or workspace-owned slates';
  if (filterType === 'prefix') return 'Filter by identifier prefix: e.g., "@myorg/" matches all slates starting with @myorg/';
  return 'Include a specific slate by its exact identifier';
}

export let SubRegistryDetail = () => {
  let { tenantId, subRegistryId } = useParams<{ tenantId: string; subRegistryId: string }>();
  let tenant = useTenant(tenantId ?? '');
  let subRegistry = useSubRegistry(tenantId, subRegistryId!);
  let addFilter = useAddSubRegistryFilter();
  let removeFilter = useRemoveSubRegistryFilter();

  let [showAddForm, setShowAddForm] = useState(false);
  let [filterType, setFilterType] = useState<'scope_type' | 'prefix' | 'package'>('scope_type');
  let [filterValue, setFilterValue] = useState('');

  let handleAddFilter = async () => {
    if (!tenantId || !subRegistryId || !filterValue.trim()) return;
    let [, error] = await addFilter.mutate({ tenantId, subRegistryId, type: filterType, value: filterValue.trim() });
    if (!error) {
      setFilterValue('');
      setShowAddForm(false);
    }
  };

  let handleRemoveFilter = async (filterId: string) => {
    if (!tenantId || !subRegistryId) return;
    if (!confirm('Are you sure you want to remove this filter?')) return;
    await removeFilter.mutate({ tenantId, subRegistryId, filterId });
  };

  return renderWithLoader({ subRegistry })(({ subRegistry }) => (
    <Flex direction="column" gap={24}>
      <Link to={`/tenants/${tenantId}/sub-registries`} style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Sub-Registries
      </Link>

      <Group.Wrapper>
        <Group.Header
          title={subRegistry.data!.name}
          description={
            <Badge color="gray" size="1" style={{ fontFamily: 'monospace' }}>
              {subRegistry.data!.identifier}
            </Badge>
          }
        />
        <Group.Content>
          <Flex direction="column" gap={16}>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">ID</Text>
              <Text size="1" style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                {subRegistry.data!.id}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">Tenant</Text>
              <Text size="2" weight="medium">{tenant.data?.name ?? '-'}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text size="2" color="gray600">Created</Text>
              <Text size="2" weight="medium">{new Date(subRegistry.data!.createdAt).toLocaleString()}</Text>
            </Flex>
          </Flex>
        </Group.Content>
      </Group.Wrapper>

      <Group.Wrapper>
        <Group.Header
          title="Filters"
          description="Filters control which slates appear in this sub-registry. Multiple filters use OR logic - a slate appears if it matches any filter."
        />
        <Group.Content>
          {showAddForm ? (
            <Flex direction="column" gap={16}>
              <Flex direction="column" gap={8}>
                <Text size="2" weight="medium">Filter Type</Text>
                <select
                  value={filterType}
                  onChange={e => {
                    setFilterType(e.target.value as any);
                    setFilterValue('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    fontSize: 14
                  }}
                >
                  <option value="scope_type">Scope Type</option>
                  <option value="prefix">Prefix</option>
                  <option value="package">Package</option>
                </select>
                <Text size="1" color="gray600">
                  {getFilterTypeDescription(filterType)}
                </Text>
              </Flex>

              {filterType === 'scope_type' ? (
                <Flex direction="column" gap={8}>
                  <Text size="2" weight="medium">Scope Type</Text>
                  <select
                    value={filterValue}
                    onChange={e => setFilterValue(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      fontSize: 14
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="user">User</option>
                    <option value="workspace">Workspace</option>
                  </select>
                </Flex>
              ) : (
                <Input
                  label={filterType === 'prefix' ? 'Prefix' : 'Package Identifier'}
                  placeholder={filterType === 'prefix' ? 'e.g., @myorg/' : 'e.g., @myorg/my-slate'}
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                />
              )}

              {addFilter.error && (
                <Error>{String(addFilter.error)}</Error>
              )}

              <Flex gap={8}>
                <Button
                  onClick={handleAddFilter}
                  loading={addFilter.isLoading}
                  disabled={!filterValue.trim()}
                >
                  Add Filter
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </Flex>
            </Flex>
          ) : (
            <Button variant="outline" onClick={() => setShowAddForm(true)}>
              + Add Filter
            </Button>
          )}

          <Spacer size={24} />

          {!subRegistry.data!.filters || subRegistry.data!.filters.length === 0 ? (
            <Text size="2" color="gray600">No filters configured. All slates will be visible.</Text>
          ) : (
            <Flex direction="column" gap={12}>
              {subRegistry.data!.filters.map(filter => (
                <Flex
                  key={filter.id}
                  align="center"
                  justify="space-between"
                  style={{
                    padding: '14px 16px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8
                  }}
                >
                  <Flex align="center" gap={12}>
                    <Badge color="blue" size="1">{filter.type}</Badge>
                    <Text size="2" weight="medium" style={{ fontFamily: 'monospace' }}>{filter.value}</Text>
                  </Flex>
                  <Button
                    variant="outline"
                    size="1"
                    onClick={() => handleRemoveFilter(filter.id)}
                    style={{ color: '#dc2626', borderColor: '#fecaca' }}
                  >
                    Remove
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}
        </Group.Content>
      </Group.Wrapper>
    </Flex>
  ));
}
