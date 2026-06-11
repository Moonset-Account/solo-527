import { DeployEnvLoader } from '../src/loaders/deploy-loader';

async function main() {
  const loader = new DeployEnvLoader({
    files: ['examples/deploy/deployment-flags.yaml'],
  });

  const flags = await loader.load();
  
  console.log('Total flags:', flags.length);
  
  const byEnv = new Map<string, typeof flags>();
  for (const f of flags) {
    if (!byEnv.has(f.environment)) byEnv.set(f.environment, []);
    byEnv.get(f.environment)!.push(f);
  }
  
  for (const [env, envFlags] of byEnv) {
    console.log(`\n--- ${env} ---`);
    console.log(`  Flag count: ${envFlags.length}`);
    const byCluster = new Map<string, typeof flags>();
    for (const f of envFlags) {
      const cluster = f.cluster || '(no cluster)';
      if (!byCluster.has(cluster)) byCluster.set(cluster, []);
      byCluster.get(cluster)!.push(f);
    }
    for (const [cluster, clusterFlags] of byCluster) {
      console.log(`  Cluster: ${cluster}`);
      for (const f of clusterFlags.sort((a, b) => a.key.localeCompare(b.key))) {
        console.log(`    ${f.key}: ${JSON.stringify(f.value)} (${f.type})`);
      }
    }
  }
}

main().catch(console.error);
