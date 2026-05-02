# AGENTS.md

Visão geral da arquitetura do projeto SolarAnalytics para desenvolvedores e agentes de IA.

## Descrição do Projeto

**SolarAnalytics** — plataforma de análise inteligente de faturas de energia elétrica para empresas do setor solar. Atende concessionárias **Energisa (Paraíba)** e **Neo Energia (Pernambuco)**. O usuário faz upload de uma fatura (PDF ou imagem) e a IA identifica cada item de cobrança, gera gráficos e aponta alertas.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Framework | TanStack Start 1.x |
| Frontend | React 19, TanStack Router v1 (file-based) |
| Build | Vite 7 |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js + react-chartjs-2 |
| IA | `@anthropic-ai/sdk` via Netlify AI Gateway |
| Deploy | Netlify |

## Estrutura de Diretórios

```
src/
  routes/
    __root.tsx              # Layout raiz: head, scripts, lang=pt-BR
    index.tsx               # Página principal: upload, seleção de concessionária, resultados
    api/
      analyze-bill.ts       # POST /api/analyze-bill — processa fatura com Claude
  styles.css                # Tailwind + fonte do sistema
public/
  favicon.ico
netlify.toml                # Build command, publish dir, dev settings
package.json                # Dependências e scripts
tsconfig.json               # TypeScript strict, alias @/* → src/*
vite.config.ts              # Plugins: TanStack Start, Tailwind, Netlify
```

## Fluxo da Aplicação

1. Usuário seleciona a concessionária (Energisa PB ou Neo Energia PE)
2. Usuário faz upload da fatura (PDF/imagem, máx 10 MB)
3. Frontend envia `POST /api/analyze-bill` com `multipart/form-data`
4. API route converte o arquivo para base64 e chama o Claude via Anthropic SDK
5. Claude retorna JSON estruturado com itens, alertas e resumo
6. Frontend exibe gráficos (Doughnut + Bar) e tabela de detalhamento

## Rota de API

### `POST /api/analyze-bill`

**Request:** `multipart/form-data`
- `file`: PDF, JPG, PNG ou WEBP (máx 10 MB)
- `concessionaria`: `"energisa"` | `"neoenergia"`

**Response:** JSON
```typescript
{
  concessionaria: string
  cliente: string
  mes_referencia: string
  total_fatura: number
  consumo_kwh: number
  itens: Array<{ nome: string; valor: number; percentual: number; descricao?: string }>
  alertas: string[]
  economia_solar?: string
  resumo: string
}
```

## Modelo de IA

Usa `claude-haiku-4-5-20251001` com system prompt especializado em faturas brasileiras (TUSD, TE, ICMS, PIS/COFINS, COSIP, Bandeiras Tarifárias). PDFs são enviados como `document` block; imagens como `image` block.

## Variáveis de Ambiente (Netlify AI Gateway)

Injetadas automaticamente pelo Netlify: `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`. Para desenvolvimento local, usar `netlify dev`.

## Convenções

- TypeScript strict — sem `any` implícito
- Alias `@/*` → `src/*`
- Tailwind para todo estilo; estado local com hooks React
- Sem gerenciador de estado global
