# SolarAnalytics — Análise de Faturas de Energia

Sistema de análise inteligente de faturas de energia elétrica para empresas de energia solar. Desenvolvido para atender clientes nas concessionárias **Energisa (Paraíba)** e **Neo Energia (Pernambuco)**.

## O que faz

- Upload de faturas em **PDF, JPG, PNG ou WEBP** (até 10 MB)
- Análise automática com IA (Claude) identificando cada item de cobrança
- Gráficos interativos mostrando a distribuição dos valores
- Alertas sobre cobranças incomuns, bandeiras tarifárias e multas
- Estimativa de economia potencial com energia solar

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Framework | TanStack Start (React 19) |
| Roteamento | TanStack Router v1 (file-based) |
| Build | Vite 7 |
| Estilos | Tailwind CSS 4 |
| Gráficos | Chart.js + react-chartjs-2 |
| IA | Anthropic Claude via Netlify AI Gateway |
| Deploy | Netlify |

## Como rodar localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Para emular Netlify AI Gateway localmente, use o CLI do Netlify
npx netlify dev
```

> **Nota:** A análise de faturas com IA requer o Netlify AI Gateway. Em desenvolvimento local, use `netlify dev` para que as variáveis de ambiente sejam injetadas automaticamente. É necessário ter ao menos um deploy em produção no Netlify para que o AI Gateway seja ativado.

## Estrutura de arquivos principais

```
src/
  routes/
    __root.tsx           # Layout raiz com metadados
    index.tsx            # Página principal com upload e resultados
    api/
      analyze-bill.ts    # API route que chama o Claude para analisar a fatura
  styles.css             # Estilos globais (Tailwind)
```
