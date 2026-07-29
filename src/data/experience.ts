export interface ExperienceEntry {
  role: string;
  org: string;
  period: string;
  line: string;
}

export const experience: ExperienceEntry[] = [
  {
    role: 'Senior Software Engineer, Full-Stack & Platform',
    org: 'Ritech International AG — client: eos.uptrade (Siemens Mobility)',
    period: 'Jan 2023 – present',
    line: 'Ticketing for Deutsche Bahn, BVG Berlin and SSB Stuttgart; 8M+ tickets/month. Multi-tenant Next.js webshop, Keycloak/Better Auth SSO, PWA ticket viewer, Kubernetes + GitLab CI/CD.',
  },
  {
    role: 'Independent contractor',
    org: 'Long-term client engagements',
    period: 'Oct 2018 – present',
    line: 'Multi-tenant food-retail SaaS for a German product company (Django + pandas, ArgoCD/GitOps); Moneyfarm fintech features.',
  },
  {
    role: 'Software Developer → Team Lead',
    org: 'division5',
    period: 'Sep 2020 – Mar 2022',
    line: 'Full-stack CMS and theatre ticketing apps on Node.js, React and AWS; led code review and mentored juniors.',
  },
  {
    role: 'Software Developer',
    org: 'Binary Tree, Inc. (now Quest Software) — via Kreatx',
    period: 'Nov 2019 – Apr 2020',
    line: 'Active Directory migration tooling (Power365 / PowerAD) on .NET Core and React.',
  },
  {
    role: 'Software Developer',
    org: 'Kreatx',
    period: 'Mar 2019 – Apr 2020',
    line: 'Check-in/out system and HR & finance CMS on .NET; geolocation platform (React + Django) for a client.',
  },
];
