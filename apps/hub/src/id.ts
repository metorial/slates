import { createIdGenerator, idType } from '@lowerdeck/id';
import { Worker as SnowflakeId } from 'snowflake-uuid';

export let ID = createIdGenerator({
  hub: idType.sorted('shhub'),
  tenant: idType.sorted('shtn'),

  registry: idType.sorted('shreg'),
  registrySync: idType.sorted('shrsn'),

  deploymentProvider: idType.sorted('shdpv'),

  secret: idType.sorted('shsec'),

  slate: idType.sorted('shslt'),
  slateVersion: idType.sorted('shslv'),
  slateVersionDiscovery: idType.sorted('shsdd'),
  slateDeployment: idType.sorted('shsld'),
  slateEvent: idType.sorted('shsev'),
  slateSpecification: idType.sorted('shssp'),
  slateSpecificationChange: idType.sorted('shspc'),
  slateAction: idType.sorted('shsac'),
  slateConfigSchema: idType.sorted('shscs'),
  slateAuthMethod: idType.sorted('shsam'),

  slateInstance: idType.sorted('shsli'),
  slateInstanceConfig: idType.sorted('shslc'),
  slateAuthConfig: idType.sorted('shsla'),
  slateInstanceEvent: idType.sorted('hslev'),
  slateInstanceOAuthSetup: idType.sorted('shsox'),

  slateOAuthCredentials: idType.sorted('shsoc'),

  slateRun: idType.sorted('shslr')
});

let workerIdBits = 12;
let workerIdMask = (1 << workerIdBits) - 1;

let workerId = (() => {
  let array = new Uint16Array(1);
  crypto.getRandomValues(array);
  return array[0]! & workerIdMask;
})();

export let snowflake = new SnowflakeId(workerId, 0, {
  workerIdBits: workerIdBits,
  datacenterIdBits: 0,
  sequenceBits: 9,
  epoch: new Date('2025-06-01T00:00:00Z').getTime()
});
