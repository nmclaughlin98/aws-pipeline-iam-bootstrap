export interface RepositoryConfig {
  /** GitHub repository name in format 'owner/repo' */
  repo: string;
  /** Custom role name suffix (optional) */
  roleName?: string;
}

export interface PipelineBootstrapConfig {
  /** AWS Account ID */
  account?: string;
  /** AWS Region */
  region?: string;
  /** List of GitHub repositories authorized to assume deployment roles via OIDC */
  allowedRepositories: RepositoryConfig[];
}

export const defaultConfig: PipelineBootstrapConfig = {
  allowedRepositories: [
    {
      repo: 'nmclaughlin98/testion-retail-backend',
      roleName: 'testion-retail-github-deploy-role',
    },
    // Add additional repositories here as needed, e.g.:
    // { repo: 'nmclaughlin98/another-backend-service', roleName: 'another-backend-deploy-role' }
  ],
};
