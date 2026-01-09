import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Flex, Group, Spacer, Error } from '@metorial-io/ui';
import { useCreateSubRegistry } from '../../api/hooks';

export let SubRegistryCreate = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let createSubRegistry = useCreateSubRegistry();

  let [name, setName] = useState('');
  let [identifier, setIdentifier] = useState('');

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    try {
      await createSubRegistry.mutateAsync({ tenantId, name, identifier });
      navigate(`/tenants/${tenantId}/sub-registries`);
    } catch (error) {
      console.error('Failed to create sub-registry:', error);
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <Link to={`/tenants/${tenantId}/sub-registries`} style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Sub-Registries
      </Link>

      <div style={{ maxWidth: 480 }}>
        <Group.Wrapper>
          <Group.Header
            title="Create Sub-Registry"
            description="Create a new sub-registry for this tenant"
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
                  <Button type="button" variant="outline" onClick={() => navigate(`/tenants/${tenantId}/sub-registries`)}>
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
