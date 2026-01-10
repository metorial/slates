import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { renderWithLoader } from '@metorial-io/data-hooks';
import { Button, Flex, Text, Group, Badge, Input, Spacer, Error } from '@metorial-io/ui';
import { useUser, useUserTokens, useCreateUserToken, useRevokeUserToken } from '../../api/hooks';

function getTokenBadgeColor(status: string): 'green' | 'red' | 'gray' {
  if (status === 'active') return 'green';
  if (status === 'revoked') return 'red';
  return 'gray';
}

export let UserDetail = () => {
  let { tenantId, userId } = useParams<{ tenantId: string; userId: string }>();
  let user = useUser(tenantId, userId);
  let tokens = useUserTokens(tenantId, userId);
  let createToken = useCreateUserToken();
  let revokeToken = useRevokeUserToken();

  let [showCreateForm, setShowCreateForm] = useState(false);
  let [tokenName, setTokenName] = useState('');
  let [newTokenSecret, setNewTokenSecret] = useState<string | null>(null);

  let handleCreateToken = async () => {
    if (!tenantId || !userId || !tokenName.trim()) return;
    let [result, error] = await createToken.mutate({ tenantId, userId, name: tokenName.trim() });
    if (result?.secret) {
      setNewTokenSecret(result.secret);
    }
    if (!error) {
      setTokenName('');
      setShowCreateForm(false);
    }
  };

  let handleRevokeToken = async (tokenId: string) => {
    if (!tenantId || !userId) return;
    if (!confirm('Are you sure you want to revoke this token? This cannot be undone.')) return;
    await revokeToken.mutate({ tenantId, userId, tokenId });
  };

  return renderWithLoader({ user, tokens })(({ user, tokens }) => (
    <Flex direction="column" gap={24}>
      <Link to={`/tenants/${tenantId}/users`} style={{ color: '#64748b', fontSize: 14 }}>
        ← Back to Users
      </Link>

      <Group.Wrapper>
        <Group.Header
          title={user.data!.name}
          description={
            <Flex gap={8}>
              <Badge color="gray" size="1" style={{ fontFamily: 'monospace' }}>
                {user.data!.identifier}
              </Badge>
              <Badge color={user.data!.status === 'active' ? 'green' : 'gray'} size="1">
                {user.data!.status}
              </Badge>
            </Flex>
          }
        />
        <Group.Content>
          <Flex direction="column" gap={16}>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">ID</Text>
              <Text size="1" style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '4px 8px', borderRadius: 4 }}>
                {user.data!.id}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center" style={{ paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
              <Text size="2" color="gray600">Scope</Text>
              <Text size="2" weight="medium">{user.data!.scope?.identifier ?? '-'}</Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text size="2" color="gray600">Created</Text>
              <Text size="2" weight="medium">{new Date(user.data!.createdAt).toLocaleString()}</Text>
            </Flex>
          </Flex>
        </Group.Content>
      </Group.Wrapper>

      {newTokenSecret && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: 20 }}>
          <Flex direction="column" gap={12}>
            <Text size="2" weight="strong" style={{ color: '#166534' }}>
              Token Created Successfully
            </Text>
            <Text size="2" color="gray600">
              Copy this token now. You won't be able to see it again.
            </Text>
            <Flex
              style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 6,
                padding: '12px 16px',
                fontFamily: 'monospace',
                fontSize: 13,
                wordBreak: 'break-all'
              }}
            >
              {newTokenSecret}
            </Flex>
            <Button variant="outline" onClick={() => setNewTokenSecret(null)}>
              Dismiss
            </Button>
          </Flex>
        </div>
      )}

      <Group.Wrapper>
        <Group.Header
          title="API Tokens"
          description="API tokens allow this user to authenticate with the registry API. Tokens can be revoked at any time. The secret is only shown once when created."
        />
        <Group.Content>
          {showCreateForm ? (
            <Flex direction="column" gap={16}>
              <Input
                label="Token Name"
                placeholder="e.g., Production API Key"
                value={tokenName}
                onChange={e => setTokenName(e.target.value)}
              />
              {createToken.error && (
                <Error>{String(createToken.error)}</Error>
              )}
              <Flex gap={8}>
                <Button
                  onClick={handleCreateToken}
                  loading={createToken.isLoading}
                  disabled={!tokenName.trim()}
                >
                  Create Token
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </Flex>
            </Flex>
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
                  <Flex
                    key={token.id}
                    align="center"
                    justify="space-between"
                    style={{
                      padding: '14px 16px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8
                    }}
                  >
                    <Flex direction="column" gap={4}>
                      <Flex align="center" gap={8}>
                        <Text size="2" weight="medium">{token.name}</Text>
                        <Badge color={getTokenBadgeColor(token.status)} size="1">
                          {token.status}
                        </Badge>
                      </Flex>
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
                    {token.status === 'active' && (
                      <Button
                        variant="outline"
                        size="1"
                        onClick={() => handleRevokeToken(token.id)}
                        style={{ color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        Revoke
                      </Button>
                    )}
                  </Flex>
                ))}
              </Flex>
            );
          })()}
        </Group.Content>
      </Group.Wrapper>
    </Flex>
  ));
}
