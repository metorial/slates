import { createSignalClient } from '@metorial-services/signal-client';
import type { Tenant } from '../prisma/generated/client';
import { db } from './db';
import { env } from './env';

export let signal: ReturnType<typeof createSignalClient> = createSignalClient({
  endpoint: env.signal.SIGNAL_API_URL
});

export let signalTriggerSender = await signal.sender.upsert({
  name: 'Slates Triggers',
  identifier: env.signal.SIGNAL_SENDER_IDENTIFIER
});

export let getTenantAndSenderForSignal = async (tenant: Tenant) => {
  if (!tenant.signalTenantId) {
    let newTenant = await signal.tenant.upsert({
      name: tenant.name,
      identifier: tenant.identifier
    });

    tenant = await db.tenant.update({
      where: { id: tenant.id },
      data: { signalTenantId: newTenant.id }
    });
  }

  return {
    sender: signalTriggerSender,
    tenant: {
      id: tenant.signalTenantId,
      identifier: tenant.identifier
    }
  };
};

console.log(`Signal sender ID: ${signalTriggerSender.id}`);
