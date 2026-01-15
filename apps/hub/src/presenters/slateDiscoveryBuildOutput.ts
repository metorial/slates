export let slateDiscoveryBuildOutputPresenter = (buildOutput: any | null) => {
  if (!buildOutput) return null;

  return {
    object: 'slate.discovery.build_output',
    logs: buildOutput.logs ?? buildOutput.output ?? null,
    status: buildOutput.status ?? null,
    startedAt: buildOutput.startedAt ?? null,
    completedAt: buildOutput.completedAt ?? null
  };
};
