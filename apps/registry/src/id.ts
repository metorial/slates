import { createIdGenerator, idType } from '@lowerdeck/id';
import { Worker as SnowflakeId } from 'snowflake-uuid';

export let ID = createIdGenerator({
  instance: idType.sorted('srin'),
  scope: idType.sorted('srsc'),
  user: idType.sorted('srus'),
  workspace: idType.sorted('srws'),
  userToken: idType.sorted('srutk'),
  readerToken: idType.sorted('srrtk'),
  slate: idType.sorted('srsl'),
  slateVersion: idType.sorted('srsv'),
  slateDocument: idType.sorted('srsd'),
  artifact: idType.sorted('sraf')
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
