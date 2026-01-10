import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Flex, Group, Spacer, Error } from '@metorial-io/ui';
import { useCreateTenant } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { FormWrapper } from '../../components/styled';

export let TenantCreate = () => {
  let navigate = useNavigate();
  let createTenant = useCreateTenant();

  let [name, setName] = useState('');
  let [identifier, setIdentifier] = useState('');

  let handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let [, error] = await createTenant.mutate({ name, identifier });
    if (!error) {
      navigate('/tenants');
    }
  };

  return (
    <Flex direction="column" gap={24}>
      <BackLink to="/tenants">Back to Tenants</BackLink>

      <FormWrapper>
        <Group.Wrapper>
          <Group.Header
            title="Create Tenant"
            description="Add a new tenant to manage slates and resources"
          />
          <Group.Content>
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap={20}>
                <Input
                  label="Name"
                  description="A display name for the tenant"
                  value={name}
                  onInput={setName}
                  placeholder="My Organization"
                  required
                />

                <Input
                  label="Identifier"
                  description="Lowercase letters, numbers, and hyphens only"
                  value={identifier}
                  onInput={setIdentifier}
                  placeholder="my-org"
                  pattern="[a-z0-9-]+"
                  required
                />

                {createTenant.error && (
                  <Error>Error: {String(createTenant.error)}</Error>
                )}

                <Spacer size={8} />

                <Flex gap={12}>
                  <Button type="submit" loading={createTenant.isLoading}>
                    Create Tenant
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/tenants')}>
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
          </Group.Content>
        </Group.Wrapper>
      </FormWrapper>
    </Flex>
  );
}
