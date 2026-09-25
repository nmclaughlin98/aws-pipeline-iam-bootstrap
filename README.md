# AWS Pipeline IAM Bootstrap

Central CDK stack that creates GitHub Actions OIDC deploy roles for backend repos.

## Add a repository

1. Get the numeric IDs:

   ```bash
   gh api user --jq .id
   gh api repos/nmclaughlin98/NEW-REPO --jq '{ownerId: .owner.id, repoId: .id}'

---

## 🚀 Purpose

This repository decouples CI/CD deployment permissions from your application stacks (e.g. `testion-retail-backend`). By
running this stack once per AWS account, you achieve:

- **Keyless Authentication**: Uses GitHub Actions OpenID Connect (OIDC) to issue short-lived temporary AWS credentials.
- **No Circular Dependencies**: Solves the chicken-and-egg deployment issue where an app stack tries to grant
  permissions to its own deployment user/role.
- **Multi-Repository Support**: Manage deployment permissions for multiple GitHub repositories from a single central
  configuration file.

---

## 🛠️ How to Add a New Repository

1. Open [`lib/config.ts`](lib/config.ts).
2. Add your GitHub repository to `allowedRepositories`. Each entry must include the repository's numeric GitHub owner ID
   and repository ID, used to match GitHub's immutable OIDC subject:

```typescript
export const defaultConfig: PipelineBootstrapConfig = {
    allowedRepositories: [
        {
            repo: 'OWNER/REPOSITORY',
            roleName: 'repository-github-deploy-role',
            ownerId: '12345678',
            repoId: '1234567890',
        },
    ],
};
```

Replace the example values with the repository's actual name and numeric IDs. You can retrieve the IDs with GitHub CLI:

```bash
gh api repos/OWNER/REPOSITORY --jq '"ownerId=\(.owner.id) repoId=\(.id)"'
```

3. Deploy the updated stack:

```bash
npm run deploy
```

---

## ⚙️ Usage in GitHub Actions Workflows

In any of your backend repositories (e.g. `.github/workflows/deploy.yml`), configure AWS credentials using OIDC and the
generated role ARN:

```yaml
name: Deploy Stack
on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      id-token: write   # Required for GitHub OIDC authentication
      contents: read

    steps:
      - name: Checkout Code
        uses: actions/checkout@v7

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: eu-west-2
          role-to-assume: arn:aws:iam::334624057595:role/testion-retail-github-deploy-role

      - name: Deploy CDK Stack
        run: npx cdk deploy --require-approval never
```

---

## 📦 Project Structure

```text
aws-pipeline-iam-bootstrap/
├── bin/
│   └── app.ts                   # CDK Application Entrypoint
├── lib/
│   ├── config.ts                # Configuration & List of Allowed GitHub Repositories
│   └── pipeline-iam-stack.ts    # CDK Stack defining OIDC Provider & Deployment Roles
├── cdk.json                     # CDK Config
├── package.json                 # Node dependencies
└── README.md                    # Usage & Setup Guide
```
