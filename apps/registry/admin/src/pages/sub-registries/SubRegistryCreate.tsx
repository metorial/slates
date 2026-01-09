import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Flex, Group, Spacer, Error, Callout } from '@metorial-io/ui';
import { useCreateSubRegistry } from '../../api/hooks';
import { useSelectedTenantId, useTenantContext } from '../../context/TenantContext';

export let SubRegistryCreate = () => {
  let navigate = useNavigate();
  let tenantId = useSelectedTenantId();
  let { selectedTenant } = useTenantContext();
  let createSubRegistry = useCreateSubRegistry();

  let [name, setName] = useState('');
  let [identifier, setIdentifier] = useState('');

  if (!selectedTenant || !tenantId) {
    return (
      <Callout color="yellow" size="3">
        Please select a tenant first.
      </Callout>
    );
  }

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await createSubRegistry.mutateAsync({ tenantId, name, identifier });
      navigate('/sub-registries');
    } catch (error) {
      console.error('Failed to create sub-registry:', error);
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <Link to="/sub-registries" style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Sub-Registries
      </Link>

      <div style={{ maxWidth: 480 }}>
        <Group.Wrapper>
          <Group.Header
            title="Create Sub-Registry"
            description={`Tenant: ${selectedTenant.name}`}
          />
          <Group.Content>
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap={20}>
                <Input
                  label="Name"
                  description="A display name for the sub-registry"
                  value={name}
                  onInput={setName}
                  placeholder="My Sub-Registry"
                  required
                />

                <Input
                  label="Identifier"
                  description="Lowercase letters, numbers, and hyphens only"
                  value={identifier}
                  onInput={setIdentifier}
                  placeholder="my-sub-registry"
                  pattern="[a-z0-9-]+"
                  required
                />

                {createSubRegistry.error && (
                  <Error>Error: {String(createSubRegistry.error)}</Error>
                )}

                <Spacer size={8} />

                <Flex gap={12}>
                  <Button type="submit" loading={createSubRegistry.isPending}>
                    Create Sub-Registry
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/sub-registries')}>
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Group.Content>
        </Group.Wrapper>
      </div>
    </Flex>
  );
}
