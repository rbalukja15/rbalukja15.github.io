export interface ExperienceEntry {
  role: string;
  org: string;
  period: string;
  line: string;
}

export const experience: ExperienceEntry[] = [
  {
    role: 'Senior Software Engineer, Full-Stack & Platform',
    org: 'Public-transport e-ticketing company',
    period: 'Jan 2023 – present',
    line: 'Multi-tenant Next.js webshop, Keycloak/Better Auth SSO, PWA ticket viewer, Kubernetes + GitLab CI/CD.',
  },
  {
    role: 'Software Development Engineer',
    org: 'Freelance — long-term client engagements',
    period: 'Oct 2018 – 2023',
    line: 'Multi-tenant food-retail SaaS (Django + pandas), Moneyfarm fintech features, geolocation platform.',
  },
  {
    role: 'Software Development Engineer',
    org: 'Division5',
    period: 'Sep 2020 – Apr 2022',
    line: 'Full-stack CMS and theatre ticketing apps on Node.js, React, and AWS.',
  },
  {
    role: 'Software Development Engineer',
    org: 'BinaryTree, Inc.',
    period: 'Nov 2019 – Apr 2020',
    line: 'Active Directory migration tooling (Power365 / PowerAD) on .NET Core.',
  },
  {
    role: 'Software Development Engineer',
    org: 'Kreatx',
    period: 'Apr 2019 – Apr 2020',
    line: 'Check-in/out system and HR & finance CMS on .NET.',
  },
];
