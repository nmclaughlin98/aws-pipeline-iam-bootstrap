# 🛡️ AWS Pipeline IAM Bootstrap

Central Infrastructure as Code (IaC) repository built with **AWS CDK** to provision and manage GitHub Actions OIDC deployment roles and IAM permissions across all your AWS backend repositories.

---

## 🚀 Purpose

This repository decouples CI/CD deployment permissions from your application stacks (e.g. `testion-retail-backend`). By running this stack once per AWS account, you achieve:

- **Keyless Authentication**: Uses GitHub Actions OpenID Connect (OIDC) to issue short-lived temporary AWS credentials.
- **No Circular Dependencies**: Solves the chicken-and-egg deployment issue where an app stack tries to grant permissions to its own deployment user/role.
- **Multi-Repository Support**: Manage deployment permissions for multiple GitHub repositories from a single central configuration file.

---

## 🛠️ How to Add a New Repository

1. Open [`lib/config.ts`](file:///Users/niallmclaughlin/.gemini/antigravity/scratch/aws-pipeline-iam-bootstrap/lib/config.ts).
2. Add your new GitHub repository to `allowedRepositories`:

```typescript
export const defaultConfig: PipelineBootstrapConfig = {
  allowedRepositories: [
    {
      repo: 'nmclaughlin98/testion-retail-backend',
      roleName: 'testion-retail-github-deploy-role',
    },
    {
      repo: 'nmclaughlin98/my-new-service-backend',
      roleName: 'my-new-service-github-deploy-role',
    },
  ],
};
```

3. Deploy the updated stack:

```bash
npm run deploy
```

---

## ⚙️ Usage in GitHub Actions Workflows

In any of your backend repositories (e.g. `.github/workflows/deploy.yml`), configure AWS credentials using OIDC and the generated role ARN:

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
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: eu-west-2
          role-to-assume: arn:aws:iam::334624057595:role/testion-retail-github-deploy-role
          role-chaining: true

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
