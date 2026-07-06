export interface SkillGroup {
  group: string;
  items: string[];
}

export const skills: SkillGroup[] = [
  {
    group: 'Frontend',
    items: ['TypeScript', 'React', 'Next.js', 'Redux', 'React Query', 'TailwindCSS', 'MUI', 'Storybook'],
  },
  {
    group: 'Backend',
    items: ['Python', 'Django REST Framework', 'Flask', 'Node.js', '.NET Core'],
  },
  {
    group: 'Data & Databases',
    items: ['PostgreSQL', 'MySQL', 'SQL Server', 'Pandas (vectorised pipelines)'],
  },
  {
    group: 'DevOps & Cloud',
    items: ['Docker', 'Kubernetes', 'ArgoCD (GitOps)', 'GitLab CI/CD', 'GitHub Actions', 'AWS'],
  },
  {
    group: 'Auth & Identity',
    items: ['Keycloak', 'Better Auth', 'Auth0', 'OAuth 2.0 / OIDC'],
  },
  {
    group: 'Testing',
    items: ['Playwright', 'Cypress', 'Jest', 'React Testing Library', 'PyTest'],
  },
];
