import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { renderWithLoader, useForm } from '@metorial-io/data-hooks';
import { Button, Flex, Text, Group, Badge, Input, Spacer, Error, Datalist } from '@metorial-io/ui';
import { useSubRegistry, useTenant, useAddSubRegistryFilter, useRemoveSubRegistryFilter } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MonoCode, MonoText, Select, Card } from '../../components/styled';

let getFilterTypeDescription = (filterType: 'scope_type' | 'prefix' | 'package'): string => {
  if (filterType === 'scope_type') return 'Filter by scope: enter a scope ID or identifier to show only slates owned by that scope';
  if (filterType === 'prefix') return 'Filter by identifier prefix: e.g., "@myorg/" matches all slates starting with @myorg/';
  return 'Include a specific slate by its exact identifier';
};

export let SubRegistryDetail = () => {
  let { tenantId, subRegistryId } = useParams<{ tenantId: string; subRegistryId: string }>();
  let tenant = useTenant(tenantId ?? '');
  let subRegistry = useSubRegistry(tenantId, subRegistryId!);
  let addFilter = useAddSubRegistryFilter();
  let removeFilter = useRemoveSubRegistryFilter();

  let [showAddForm, setShowAddForm] = useState(false);
  let [filterToRemove, setFilterToRemove] = useState<string | null>(null);

  let filterForm = useForm({
    initialValues: {
      filterType: 'scope_type' as 'scope_type' | 'prefix' | 'package',
      filterValue: ''
    },
    onSubmit: async values => {
      if (!tenantId || !subRegistryId || !values.filterValue.trim()) return;
      let [, error] = await addFilter.mutate({ tenantId, subRegistryId, type: values.filterType, value: values.filterValue.trim() });
      if (!error) {
        filterForm.setFieldValue('filterValue', '');
        setShowAddForm(false);
      }
    },
    schema: yup =>
      yup.object({
        filterType: yup.string().oneOf(['scope_type', 'prefix', 'package']).required(),
        filterValue: yup.string().required()
      })
  });

  let handleRemoveFilter = async () => {
    if (!tenantId || !subRegistryId || !filterToRemove) return;
    await removeFilter.mutate({ tenantId, subRegistryId, filterId: filterToRemove });
    setFilterToRemove(null);
  };

  return renderWithLoader({ subRegistry })(({ subRegistry }) => (
    <Flex direction="column" gap={24}>
      <BackLink to={`/tenants/${tenantId}/sub-registries`}>Back to Sub-Registries</BackLink>

      <Group.Wrapper>
        <Group.Header
          title={subRegistry.data!.name}
          description={
            <Badge color="gray" size="1">
              <code>{subRegistry.data!.identifier}</code>
            </Badge>
          }
        />
        <Group.Content>
          <Datalist
            items={[
              { label: 'ID', value: <MonoCode>{subRegistry.data!.id}</MonoCode> },
              { label: 'Tenant', value: tenant.data?.name ?? '-' },
              { label: 'Created', value: new Date(subRegistry.data!.createdAt).toLocaleString() }
            ]}
          />
        </Group.Content>
      </Group.Wrapper>

      <Group.Wrapper>
        <Group.Header
          title="Filters"
          description="Filters control which slates appear in this sub-registry. Multiple filters use OR logic - a slate appears if it matches any filter."
        />
        <Group.Content>
          {showAddForm ? (
            <form onSubmit={filterForm.handleSubmit}>
              <Flex direction="column" gap={16}>
                <Flex direction="column" gap={8}>
                  <Text size="2" weight="medium">Filter Type</Text>
                  <Select
                    value={filterForm.values.filterType}
                    onChange={e => {
                      filterForm.setFieldValue('filterType', e.target.value as 'scope_type' | 'prefix' | 'package');
                      filterForm.setFieldValue('filterValue', '');
                    }}
                  >
                    <option value="scope_type">Scope</option>
                    <option value="prefix">Prefix</option>
                    <option value="package">Package</option>
                  </Select>
                  <Text size="1" color="gray600">
                    {getFilterTypeDescription(filterForm.values.filterType)}
                  </Text>
                </Flex>

                <Input
                  label={filterForm.values.filterType === 'scope_type' ? 'Scope ID or Identifier' : filterForm.values.filterType === 'prefix' ? 'Prefix' : 'Package Identifier'}
                  placeholder={filterForm.values.filterType === 'scope_type' ? 'e.g., scope_abc123 or myorg' : filterForm.values.filterType === 'prefix' ? 'e.g., @myorg/' : 'e.g., @myorg/my-slate'}
                  value={filterForm.values.filterValue}
                  onChange={e => filterForm.setFieldValue('filterValue', e.target.value)}
                />

                {addFilter.error && (
                  <Error>{String(addFilter.error)}</Error>
                )}

                <Flex gap={8}>
                  <Button
                    type="submit"
                    loading={addFilter.isLoading}
                    disabled={!filterForm.values.filterValue.trim()}
                  >
                    Add Filter
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
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
                <Card key={filter.id}>
                  <Flex align="center" justify="space-between">
                    <Flex align="center" gap={12}>
                      <Badge color="blue" size="1">{filter.type}</Badge>
                      <Text size="2" weight="medium">
                        <MonoText>{filter.value}</MonoText>
                      </Text>
                    </Flex>
                    <Button
                      variant="outline"
                      size="1"
                      color="red"
                      onClick={() => setFilterToRemove(filter.id)}
                    >
                      Remove
                    </Button>
                  </Flex>
                </Card>
              ))}
            </Flex>
          )}
        </Group.Content>
      </Group.Wrapper>

      <ConfirmDialog
        open={filterToRemove !== null}
        onOpenChange={open => !open && setFilterToRemove(null)}
        title="Remove Filter"
        description="Are you sure you want to remove this filter? This will change which slates appear in this sub-registry."
        confirmLabel="Remove Filter"
        onConfirm={handleRemoveFilter}
        destructive
        loading={removeFilter.isLoading}
      />
    </Flex>
  ));
}
