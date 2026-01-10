import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Flex, Group, Input, Spacer, Text, Error } from '@metorial-io/ui';
import { useCreateUser } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';

export let UserCreate = () => {
  let navigate = useNavigate();
  let { tenantId } = useParams<{ tenantId: string }>();
  let createUser = useCreateUser();

  let [name, setName] = useState('');
  let [identifier, setIdentifier] = useState('');

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;

    let [, error] = await createUser.mutate({
      tenantId,
      name: name.trim(),
      identifier: identifier.trim()
    });

    if (!error) {
      navigate(`/tenants/${tenantId}/users`);
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <BackLink to={`/tenants/${tenantId}/users`}>Back to Users</BackLink>

      <div style={{ maxWidth: 480 }}>
        <Group.Wrapper>
          <Group.Header
            title="Create User"
            description="Create a new user who can publish slates and access the registry API. The identifier becomes their scope (@identifier)."
          />
          <Group.Content>
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap={20}>
                <Input
                  label="Name"
                  description="A display name for the user"
                  placeholder="John Doe"
                  value={name}
                  onInput={setName}
                  required
                />

                <Input
                  label="Identifier"
                  description={`Lowercase letters, numbers, and hyphens only. This becomes the user's scope: @${identifier || 'identifier'}`}
                  placeholder="johndoe"
                  value={identifier}
                  onInput={v => setIdentifier(v.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  pattern="[a-z0-9-]+"
                  required
                />

                {createUser.error && (
                  <Error>Error: {String(createUser.error)}</Error>
                )}

                <Spacer size={8} />

                <Flex gap={12}>
                  <Button type="submit" loading={createUser.isLoading}>
                    Create User
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(`/tenants/${tenantId}/users`)}>
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
