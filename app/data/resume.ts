export const profile = {
  name: "Pedro Henrique Rolim Regenes",
  role: "Product Manager",
  tagline:
    "Da engenharia de software ao produto, sempre quis entender como as coisas funcionam por dentro — e, vez ou outra, por que travam. Hoje transformo isso em growth e produtos que aguentam o tranco (quase sempre).",
  location: "São Paulo, SP — BR",
  email: "phregenes@gmail.com",
  phone: "+55 11 91593-8203",
  linkedin: "linkedin.com/in/phregenes",
  linkedinUrl: "https://linkedin.com/in/phregenes",
  summary:
    "Product Manager com sólida base técnica em Engenharia de Software e Growth. Especialista em traduzir regras de negócio complexas, infraestrutura de pagamentos e automação via IA em soluções centradas no usuário, focadas em métricas de crescimento e eficiência operacional.",
};

export const skillGroups = [
  {
    id: "product",
    label: "Produto & Gestão",
    items: [
      "Product Management",
      "Agile (Scrum)",
      "Discovery",
      "OKRs / KPIs",
      "UX Journey",
      "Experimentação",
    ],
  },
  {
    id: "data",
    label: "Dados & Tech",
    items: [
      "GA4",
      "Meta Ads",
      "Automação (N8N / IA)",
      "APIs",
      "WebSockets",
      "SQL",
      "TypeScript / Next.js",
    ],
  },
];

export const education = [
  {
    program: "Fundamentos de Product Management",
    school: "TERA",
    year: "2026",
  },
  { program: "Técnico em Administração", school: "ETEC", year: "" },
  { program: "Desenvolvedor Full Stack", school: "SENAI", year: "" },
];

export type WorkParam = { label: string; value: string };

export type Experience = {
  id: string;
  code: string;
  org: string;
  role: string;
  duration: string;
  status: "ativo" | "concluído";
  summary: string;
  params: WorkParam[];
};

export const experiences: Experience[] = [
  {
    id: "vizo",
    code: "CASE.01",
    org: "Vizo",
    role: "Product Engineer",
    duration: "2025.11 → ATUAL",
    status: "ativo",
    summary:
      "Estruturação de fluxos de CRM, integração de gateways de pagamento internacionais e liderança técnica de produtos com IA.",
    params: [
      {
        label: "Gestão de Produto e Negócio",
        value:
          "Estruturação de fluxos de CRM e parametrização de mercado. Mapeamento de requisitos complexos e restrições locais para viabilizar a integração de gateways de pagamentos internacionais.",
      },
      {
        label: "Inovação e IA",
        value:
          "Liderança técnica na concepção e entrega da aplicação Chuzz. Arquitetura de automações com agentes de IA (N8N + WhatsApp API) para consultas de vouchers e reservas.",
      },
      {
        label: "Engagement",
        value:
          "Concepção de sistema de geofencing para notificações automáticas de proximidade, focando em retenção e aumento de tráfego para parceiros.",
      },
    ],
  },
  {
    id: "inner-ai",
    code: "CASE.02",
    org: "Inner AI",
    role: "Growth Product Engineer",
    duration: "2024.05 → 2025.08",
    status: "concluído",
    summary:
      "Otimização de conversão, growth analytics e estruturação de canais de aquisição descentralizada.",
    params: [
      {
        label: "Otimização de Conversão",
        value:
          "Desenvolvimento de mecanismo de fast checkout (email-only), mitigando pontos de fricção e escalando a taxa de conversão.",
      },
      {
        label: "Análise de Dados & Growth",
        value:
          "Monitoramento de métricas (GA4 / Meta Ads) e estruturação de análises operacionais para validação rápida de hipóteses.",
      },
      {
        label: "Modelos de Canais",
        value:
          "Estruturação de sistema de afiliados para alavancar crescimento orgânico e aquisição descentralizada.",
      },
    ],
  },
  {
    id: "pophaus-pm",
    code: "CASE.03",
    org: "Parque PopHaus",
    role: "Product Manager",
    duration: "2023.12 → 2024.05",
    status: "concluído",
    summary:
      "Coordenação de produto para site corporativo, checkout unificado e dashboard operacional, com implementação de Scrum e OKRs.",
    params: [
      {
        label: "Gestão de Fluxo e Entregas",
        value:
          "Coordenação dos processos de produto para site corporativo, checkout unificado e dashboard operacional.",
      },
      {
        label: "Metodologia Ágil e OKRs",
        value:
          "Implementação autônoma do framework Scrum, facilitação de ritos ágeis e introdução de OKRs para garantir previsibilidade e foco no valor do cliente.",
      },
    ],
  },
  {
    id: "pophaus-fe",
    code: "CASE.04",
    org: "Parque PopHaus",
    role: "Frontend Developer",
    duration: "2023.08 → 2023.12",
    status: "concluído",
    summary:
      "Gestão e reestruturação visual de aplicações comerciais, com foco em UI/UX e clean code.",
    params: [
      {
        label: "Desenvolvimento e Manutenção",
        value:
          "Gestão de aplicações (site comercial, checkout e dashboard) com reestruturação visual focada em UI/UX e clean code.",
      },
    ],
  },
  {
    id: "arcotech-pleno",
    code: "CASE.05",
    org: "Arcotech",
    role: "Desenvolvedor de Front-end Pleno",
    duration: "2022.03 → 2023.02",
    status: "concluído",
    summary:
      "Atuação em nova equipe dedicada ao desenvolvimento de uma tecnologia própria da empresa, em modelo híbrido em São Paulo.",
    params: [
      {
        label: "Nova Frente de Produto",
        value:
          "Entrada em outra equipe do time de engenharia, dedicada ao desenvolvimento de uma tecnologia própria da Arcotech.",
      },
    ],
  },
  {
    id: "arcotech-junior",
    code: "CASE.06",
    org: "Arcotech",
    role: "Desenvolvedor de Front-end Junior",
    duration: "2021.05 → 2022.03",
    status: "concluído",
    summary:
      "Construção de Design System com Storybook, TypeScript e JCSS, com testes automatizados via Jest para garantir a qualidade dos componentes.",
    params: [
      {
        label: "Design System",
        value:
          "Participação ativa na construção de um Design System utilizando Storybook, TypeScript e JCSS.",
      },
      {
        label: "Qualidade & Testes",
        value:
          "Implementação de testes com Jest para garantir a confiabilidade dos componentes entregues.",
      },
    ],
  },
];
