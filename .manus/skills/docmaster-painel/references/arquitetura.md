# Arquitetura Detalhada — Projeto atestados-idab

## Repositório
- **GitHub:** `rickmateus8-code/atestados-idab`
- **Framework:** Vite + React + TypeScript + TailwindCSS v4
- **Backend:** Cloudflare Workers (Functions em `/functions/`)
- **Banco de Dados:** Cloudflare D1 (SQLite na borda)
- **Deploy:** Cloudflare Pages (deploy automático via push no branch `main`)

## Estrutura de Arquivos

```
atestados-idab/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── AttestationDocument.tsx   ← Documento A4 renderizado em React
│   │   ├── lib/
│   │   │   ├── pdfExport.ts              ← Exportação PDF (iframe isolado)
│   │   │   ├── apiClient.ts              ← Cliente para API do Worker
│   │   │   └── dateMask.ts               ← Máscara de data DD/MM/AAAA
│   │   ├── pages/
│   │   │   ├── Validation.tsx            ← Página de validação pública
│   │   │   ├── CreateAttestation.tsx     ← Formulário de criação
│   │   │   └── AttestationView.tsx       ← Visualização após criação
│   │   └── data/
│   │       └── attestations.ts           ← Tipos e interface AttestationData
│   └── public/
│       └── logos/                        ← Logos padrão (9 arquivos)
├── functions/
│   └── api/
│       ├── validate/[code].ts            ← Worker de validação
│       ├── create.ts                     ← Worker de criação
│       └── cfm/buscar.ts                 ← Proxy para API do CFM
└── wrangler.jsonc                        ← Configuração Cloudflare

```

## Interface AttestationData

```typescript
interface AttestationData {
  // Paciente
  patientName: string;
  cpf: string;
  dateOfBirth: string;
  sex: string;
  motherName: string;
  address: string;
  passportNumber?: string;

  // Médico / Instituição
  doctorName: string;
  crm: string;
  specialty: string;
  institution: string;
  unidade?: string;
  institutionAddress: string;
  city?: string;

  // Documento
  issueDate: string;
  issueTime?: string;
  clinicalCondition: string;
  cidCode?: string;
  cidName?: string;
  vaccinationContraindicated?: string;
  icd?: string;
  daysOff?: number;
  modoCarimbo?: boolean;

  // Visual
  logoLeft?: string;       // URL ou base64
  logoRight?: string;      // URL ou base64
  signatureColor?: 'blue' | 'black';
  signatureImage?: string; // base64 da foto da assinatura

  // Sistema
  validationCode: string;
  validationUrl: string;
  qrCodeData?: string;
}
```

## Domínios e Fluxo

| Domínio | Função |
|---|---|
| `docmaster.store` | Painel principal (em desenvolvimento) |
| `validaratestado.digital` | Validação pública de atestados |
| `validaratestado.digital/v/{CODIGO}` | URL direta do QR Code |

## Sites de Referência

| Site | Credenciais | Uso |
|---|---|---|
| `elitedoc.store` | `caiomuller@admin.com / 142536` | Referência de layout e funcionalidades |
| `atestado-valide.digital` | Público | Referência de validação |

## Banco Supabase (médicos)
- **URL:** `https://x76vx9m9drmibj6neelja.supabase.co`
- **Tabela:** `medicos_brasil` (~1.1M registros)
- **Campos:** `nome_medico`, `crm`, `uf_crm`, `especialidade`, `local_trabalho`, `cidade`, `uf_local`, `endereco`, `bairro`
- **Atenção:** Sempre usar filtro `uf_crm=eq.{UF}` para evitar timeout.
