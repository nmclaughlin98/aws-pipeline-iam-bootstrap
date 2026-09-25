export type DeployPermission = 'cdk-deploy' | 'dynamodb-seed';

export interface RepositoryConfig {
  /** GitHub repository in owner/repo form */
  repo: string;
  /** IAM role name GitHub Actions will assume */
  roleName: string;
  /** GitHub numeric owner ID — required for immutable OIDC sub claims */
  ownerId: string;
  /** GitHub numeric repository ID — required for immutable OIDC sub claims */
  repoId: string;
  /** What this role may do after it has been assumed */
  permissions: DeployPermission[];
  /** DynamoDB tables this role may seed. Only used when permissions includes dynamodb-seed */
  seedTables?: string[];
}

export interface StaticUserConfig {
  userName: string;
  permissions: DeployPermission[];
  seedTables?: string[];
}

export interface PipelineBootstrapConfig {
  account?: string;
  region?: string;
  allowedRepositories: RepositoryConfig[];
  staticUsers?: StaticUserConfig[];
}

export const defaultConfig: PipelineBootstrapConfig = {
  allowedRepositories: [
    {
      repo: 'nmclaughlin98/testion-retail-backend',
      roleName: 'testion-retail-github-deploy-role',
      ownerId: '43157431',
      repoId: '1323645756',
      permissions: ['cdk-deploy', 'dynamodb-seed'],
      seedTables: ['TestionRetail'],
    },
    {
      repo: 'nmclaughlin98/blockbuster-theatre-backend',
      roleName: 'blockbuster-theatre-backend-github-deploy-role',
      ownerId: '43157431',
      repoId: '1388093480',
      permissions: ['cdk-deploy', 'dynamodb-seed'],
      seedTables: ['blockbuster-theatre-movies'],
    },
  ],
  staticUsers: [
    {
      userName: 'pipeline-bootstrap-user',
      permissions: ['cdk-deploy'],
    },
  ],
};