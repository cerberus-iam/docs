import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Cerberus IAM',
  description:
    'Enterprise-grade Identity and Access Management API built with Express.js and TypeScript',
  head: [['link', { rel: 'icon', href: '/favicon.ico' }]],
  ignoreDeadLinks: [
    // Localhost URLs are expected in development guides
    /^http:\/\/localhost/,
    // Links to missing pages that will be created later
    /consent$/,
    /auth-flow$/,
    /patterns$/,
    /testing$/,
    /tokens$/,
    /cryptography$/,
    /auth\/index$/,
    /oauth2\/index$/,
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API Reference', link: '/api/overview' },
      { text: 'Architecture', link: '/architecture/overview' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Cerberus IAM?', link: '/guide/introduction' },
            { text: 'Features', link: '/guide/features' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Environment Variables', link: '/guide/environment' },
            { text: 'Database Setup', link: '/guide/database' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Authentication', link: '/guide/authentication' },
            { text: 'Authorization & RBAC', link: '/guide/authorization' },
            { text: 'Multi-Tenancy', link: '/guide/multi-tenancy' },
            { text: 'OAuth2 & OIDC', link: '/guide/oauth2' },
          ],
        },
        {
          text: 'Integration',
          items: [
            { text: 'OAuth2 Client Setup', link: '/guide/oauth2-client' },
            { text: 'API Keys', link: '/guide/api-keys' },
            { text: 'Webhooks', link: '/guide/webhooks' },
            { text: 'Session Management', link: '/guide/sessions' },
          ],
        },
        {
          text: 'Deployment',
          items: [
            { text: 'Docker Deployment', link: '/guide/docker' },
            { text: 'Production Checklist', link: '/guide/production' },
            { text: 'Monitoring & Logging', link: '/guide/monitoring' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/overview' },
            { text: 'Error Handling', link: '/api/errors' },
          ],
        },
        {
          text: 'Authentication',
          items: [
            { text: 'Register', link: '/api/auth/register' },
            { text: 'Login', link: '/api/auth/login' },
            { text: 'Logout', link: '/api/auth/logout' },
            { text: 'Email Verification', link: '/api/auth/verify-email' },
            { text: 'Password Reset', link: '/api/auth/password-reset' },
            { text: 'Invitations', link: '/api/auth/invitations' },
          ],
        },
        {
          text: 'OAuth2 & OIDC',
          items: [
            { text: 'Authorization', link: '/api/oauth2/authorize' },
            { text: 'Token Exchange', link: '/api/oauth2/token' },
            { text: 'Refresh Token', link: '/api/oauth2/refresh' },
            { text: 'UserInfo', link: '/api/oauth2/userinfo' },
            { text: 'Token Introspection', link: '/api/oauth2/introspect' },
            { text: 'Token Revocation', link: '/api/oauth2/revoke' },
            { text: 'JWKS', link: '/api/oauth2/jwks' },
            { text: 'Discovery', link: '/api/oauth2/discovery' },
          ],
        },
        {
          text: 'User Profile',
          items: [
            { text: 'Get Profile', link: '/api/me/profile' },
            { text: 'Sessions', link: '/api/me/sessions' },
            { text: 'MFA Enrollment', link: '/api/me/mfa' },
            { text: 'Data Export', link: '/api/me/export' },
          ],
        },
        {
          text: 'Admin: Users',
          items: [
            { text: 'List Users', link: '/api/admin/users/list' },
            { text: 'Get User', link: '/api/admin/users/get' },
            { text: 'Create User', link: '/api/admin/users/create' },
            { text: 'Update User', link: '/api/admin/users/update' },
            { text: 'Delete User', link: '/api/admin/users/delete' },
            { text: 'Manage Roles', link: '/api/admin/users/roles' },
          ],
        },
        {
          text: 'Admin: Roles & Permissions',
          items: [
            { text: 'List Roles', link: '/api/admin/roles/list' },
            { text: 'Create Role', link: '/api/admin/roles/create' },
            { text: 'Update Role', link: '/api/admin/roles/update' },
            { text: 'Delete Role', link: '/api/admin/roles/delete' },
            { text: 'List Permissions', link: '/api/admin/permissions/list' },
          ],
        },
        {
          text: 'Admin: Teams',
          items: [
            { text: 'List Teams', link: '/api/admin/teams/list' },
            { text: 'Create Team', link: '/api/admin/teams/create' },
            { text: 'Update Team', link: '/api/admin/teams/update' },
            { text: 'Delete Team', link: '/api/admin/teams/delete' },
          ],
        },
        {
          text: 'Admin: OAuth2 Clients',
          items: [
            { text: 'List Clients', link: '/api/admin/clients/list' },
            { text: 'Create Client', link: '/api/admin/clients/create' },
            { text: 'Update Client', link: '/api/admin/clients/update' },
            { text: 'Revoke Client', link: '/api/admin/clients/revoke' },
          ],
        },
        {
          text: 'Admin: Other',
          items: [
            { text: 'Organisation Settings', link: '/api/admin/organisation' },
            { text: 'API Keys', link: '/api/admin/api-keys' },
            { text: 'Webhooks', link: '/api/admin/webhooks' },
            { text: 'Invitations', link: '/api/admin/invitations' },
            { text: 'Audit Logs', link: '/api/admin/audit-logs' },
          ],
        },
      ],
      '/architecture/': [
        {
          text: 'Architecture',
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Application Structure', link: '/architecture/structure' },
            { text: 'Middleware Pipeline', link: '/architecture/middleware' },
            { text: 'Service Layer', link: '/architecture/services' },
          ],
        },
        {
          text: 'Data Layer',
          items: [
            { text: 'Database Schema', link: '/architecture/database' },
            { text: 'Data Models', link: '/architecture/models' },
            { text: 'Relationships', link: '/architecture/relationships' },
          ],
        },
        {
          text: 'Security',
          items: [
            { text: 'Security Overview', link: '/architecture/security' },
            { text: 'Authentication Flow', link: '/architecture/auth-flow' },
            { text: 'Token Management', link: '/architecture/tokens' },
            { text: 'Cryptography', link: '/architecture/cryptography' },
          ],
        },
        {
          text: 'Development',
          items: [
            { text: 'Testing Strategy', link: '/architecture/testing' },
            { text: 'Development Workflow', link: '/architecture/workflow' },
            { text: 'Code Patterns', link: '/architecture/patterns' },
          ],
        },
        {
          text: 'Legal & Compliance',
          items: [
            { text: 'Compliance Workstream', link: '/legal/compliance-workstream' },
            { text: 'Data Retention', link: '/legal/data-retention' },
          ],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/cerberus-iam/api' }],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present Cerberus IAM',
    },
  },
});
