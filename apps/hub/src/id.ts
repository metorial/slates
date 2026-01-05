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
  slateVersionDiscovery: idType.sorted('shvd'),
  slateDeployment: idType.sorted('shdpl'),
  slateEvent: idType.sorted('shsev'),
  slateSpecification: idType.sorted('shspe'),
  slateSpecificationChange: idType.sorted('shspc'),
  slateAction: idType.sorted('shac'),
  slateConfigSchema: idType.sorted('shcs'),
  slateAuthMethod: idType.sorted('sham'),

  slateInstance: idType.sorted('shin'),
  slateInstanceConfig: idType.sorted('shic'),
  slateAuthConfig: idType.sorted('shiac'),
  slateInstanceEvent: idType.sorted('hsiev'),
  slateInstanceOAuthSetup: idType.sorted('shios'),

  slateInvocation: idType.sorted('shiv'),

  slateOAuthCredentials: idType.sorted('shoc'),
  slateToolCall: idType.sorted('shtc'),
  slateSession: idType.sorted('shses')
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
