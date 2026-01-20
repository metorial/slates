import { randomBytes } from 'crypto';
import type {
  DeploymentProvider,
  SlateDeployment,
} from '../../../prisma/generated/client';
import { SlateDeploymentStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

export class DeploymentProviderFixtures extends BaseFixture {
  async default(overrides?: Partial<DeploymentProvider>): Promise<DeploymentProvider> {
    const { oid, id } = getId('deploymentProvider');
    const identifier = `provider-${randomBytes(4).toString('hex')}`;

    return this.db.deploymentProvider.create({
      data: {
        oid,
        id,
        name: `Test Provider ${identifier}`,
        identifier,
        ...overrides,
      },
    });
  }

  async functionBay(overrides?: Partial<DeploymentProvider>): Promise<DeploymentProvider> {
    return this.default({
      name: 'Function Bay',
      identifier: 'function-bay',
      ...overrides,
    });
  }
}

export class SlateDeploymentFixtures extends BaseFixture {
  async default(data: {
    slateVersionOid: bigint;
    slateOid: bigint;
    providerOid: bigint;
    status?: SlateDeploymentStatus;
    overrides?: Partial<SlateDeployment>;
  }): Promise<SlateDeployment> {
    const { oid, id } = getId('slateDeployment');

    return this.db.slateDeployment.create({
      data: {
        oid,
        id,
        status: data.status || SlateDeploymentStatus.pending,
        slateVersionOid: data.slateVersionOid,
        slateOid: data.slateOid,
        providerOid: data.providerOid,
        providerDeploymentInfo: {},
        ...data.overrides,
      },
    });
  }

  async succeeded(data: {
    slateVersionOid: bigint;
    slateOid: bigint;
    providerOid: bigint;
    functionId?: string;
    overrides?: Partial<SlateDeployment>;
  }): Promise<SlateDeployment> {
    const functionId = data.functionId || `fn_${randomBytes(4).toString('hex')}`;
    const providerDeploymentInfo = { functionId };

    const deployment = await this.default({
      slateVersionOid: data.slateVersionOid,
      slateOid: data.slateOid,
      providerOid: data.providerOid,
      status: SlateDeploymentStatus.succeeded,
      overrides: {
        providerDeploymentInfo,
        ...data.overrides,
      },
    });

    await this.db.slateVersion.update({
      where: { oid: data.slateVersionOid },
      data: {
        activeDeploymentOid: deployment.oid,
        providerDeploymentInfo,
        status: 'active',
      },
    });

    return deployment;
  }
}
