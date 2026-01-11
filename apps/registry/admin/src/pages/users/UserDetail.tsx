import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { renderWithLoader, useForm } from '@metorial-io/data-hooks';
import { styled } from 'styled-components';
import { Button, Flex, Text, Group, Badge, Input, Spacer, Error, Datalist, Callout } from '@metorial-io/ui';
import { useUser, useUserTokens, useCreateUserToken, useRevokeUserToken } from '../../api/hooks';
import { BackLink } from '../../components/BackLink';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { MonoCode } from '../../components/styled';

let TokenSecret = styled.div<{ $copied?: boolean }>`
  background: ${p => (p.$copied ? '#f0fdf4' : '#fff')};
  border: 1px solid ${p => (p.$copied ? '#86efac' : '#e2e8f0')};
  border-radius: 6px;
  padding: 8px 12px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${p => (p.$copied ? '#86efac' : '#cbd5e1')};
  }
`;

let getTokenBadgeColor = (status: string): 'green' | 'red' | 'gray' => {
  if (status === 'active') return 'green';
  if (status === 'revoked') return 'red';
  return 'gray';
};

export let UserDetail = () => {
  let { tenantId, userId } = useParams<{ tenantId: string; userId: string }>();
  let user = useUser(tenantId, userId);
  let tokens = useUserTokens(tenantId, userId);
  let createToken = useCreateUserToken();
  let revokeToken = useRevokeUserToken();

  let [showCreateForm, setShowCreateForm] = useState(false);
  let [tokenToRevoke, setTokenToRevoke] = useState<string | null>(null);
  let [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  let tokenForm = useForm({
    initialValues: {
      tokenName: ''
    },
    onSubmit: async values => {
      if (!tenantId || !userId || !values.tokenName.trim()) return;
      let [, error] = await createToken.mutate({ tenantId, userId, name: values.tokenName.trim() });
      if (!error) {
        tokenForm.setFieldValue('tokenName', '');
        setShowCreateForm(false);
      }
    },
    schema: yup =>
      yup.object({
        tokenName: yup.string().required()
      })
  });

  let copyToClipboard = async (text: string, tokenId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedTokenId(tokenId);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  let handleRevokeToken = async () => {
    if (!tenantId || !userId || !tokenToRevoke) return;
    await revokeToken.mutate({ tenantId, userId, tokenId: tokenToRevoke });
    setTokenToRevoke(null);
  };

  return renderWithLoader({ user, tokens })(({ user, tokens }) => (
    <Flex direction="column" gap={24}>
      <BackLink to={`/tenants/${tenantId}/users`}>Back to Users</BackLink>

      <Group.Wrapper>
        <Group.Header
          title={user.data!.name}
          description={
            <Flex gap={8}>
              <Badge color="gray" size="1">
                <code>{user.data!.identifier}</code>
              </Badge>
              <Badge color={user.data!.status === 'active' ? 'green' : 'gray'} size="1">
                {user.data!.status}
              </Badge>
            </Flex>
          }
        />
        <Group.Content>
          <Datalist
            items={[
              { label: 'ID', value: <MonoCode>{user.data!.id}</MonoCode> },
              { label: 'Scope', value: user.data!.scope?.identifier ?? '-' },
              { label: 'Created', value: new Date(user.data!.createdAt).toLocaleString() }
            ]}
          />
        </Group.Content>
      </Group.Wrapper>

      <Group.Wrapper>
        <Group.Header
          title="API Tokens"
          description="API tokens allow this user to authenticate with the registry API. Tokens can be revoked at any time."
        />
        <Group.Content>
          {showCreateForm ? (
            <form onSubmit={tokenForm.handleSubmit}>
              <Flex direction="column" gap={16}>
                <Input
                  label="Token Name"
                  placeholder="e.g., Production API Key"
                  value={tokenForm.values.tokenName}
                  onChange={e => tokenForm.setFieldValue('tokenName', e.target.value)}
                />
                {createToken.error && (
                  <Error>{String(createToken.error)}</Error>
                )}
                <Flex gap={8}>
                  <Button
                    type="submit"
                    loading={createToken.isLoading}
                    disabled={!tokenForm.values.tokenName.trim()}
                  >
                    Create Token
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </Flex>
              </Flex>
            </form>
          ) : (
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              + Create Token
            </Button>
          )}

          <Spacer size={24} />

          {(() => {
            let tokenItems = tokens.data?.items ?? [];
            if (tokenItems.length === 0) {
              return <Text size="2" color="gray600">No tokens created yet.</Text>;
            }
            return (
              <Flex direction="column" gap={12}>
                {tokenItems.map(token => (
                  <Callout key={token.id} color="gray">
                    <Flex direction="column" gap={8}>
                      <Flex align="center" justify="space-between">
                        <Flex align="center" gap={8}>
                          <Text size="2" weight="medium">{token.name}</Text>
                          <Badge color={getTokenBadgeColor(token.status)} size="1">
                            {token.status}
                          </Badge>
                        </Flex>
                        {token.status === 'active' && (
                          <Button
                            variant="outline"
                            size="1"
                            color="red"
                            onClick={() => setTokenToRevoke(token.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </Flex>
                      <TokenSecret
                        $copied={copiedTokenId === token.id}
                        onClick={() => copyToClipboard(token.secret, token.id)}
                        title="Click to copy"
                      >
                        {copiedTokenId === token.id ? 'Copied!' : token.secret}
                      </TokenSecret>
                      <Flex gap={16}>
                        <Text size="1" color="gray600">
                          Created: {new Date(token.createdAt).toLocaleDateString()}
                        </Text>
                        {token.expiresAt && (
                          <Text size="1" color="gray600">
                            Expires: {new Date(token.expiresAt).toLocaleDateString()}
                          </Text>
                        )}
                      </Flex>
                    </Flex>
                  </Callout>
                ))}
              </Flex>
            );
          })()}
        </Group.Content>
      </Group.Wrapper>

      <ConfirmDialog
        open={tokenToRevoke !== null}
        onOpenChange={open => !open && setTokenToRevoke(null)}
        title="Revoke Token"
        description="Are you sure you want to revoke this token? This action cannot be undone and any applications using this token will lose access."
        confirmLabel="Revoke Token"
        onConfirm={handleRevokeToken}
        destructive
        loading={revokeToken.isLoading}
      />
    </Flex>
  ));
}
