import { createFileRoute } from '@tanstack/react-router'
import Anthropic from '@anthropic-ai/sdk'

export const Route = createFileRoute('/api/analyze-bill')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const concessionaria = formData.get('concessionaria') as string | null

        if (!file) {
          return Response.json({ error: 'Arquivo não enviado.' }, { status: 400 })
        }

        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
        ]
        if (!allowedTypes.includes(file.type)) {
          return Response.json(
            { error: 'Formato de arquivo não suportado. Use PDF, JPG, PNG ou WEBP.' },
            { status: 400 },
          )
        }

        const concessionariaLabel =
          concessionaria === 'energisa'
            ? 'Energisa (Paraíba)'
            : 'Neo Energia (Pernambuco)'

        const arrayBuffer = await file.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')

        const anthropic = new Anthropic()

        const systemPrompt = `Você é um especialista em faturas de energia elétrica brasileira, especialmente das concessionárias Energisa (Paraíba) e Neo Energia (Pernambuco).
Você trabalha para uma empresa de energia solar e precisa ajudar a entender exatamente o que está sendo cobrado na fatura de cada cliente.

Ao analisar uma fatura, identifique e extraia:
1. Dados do cliente e período de referência
2. Consumo em kWh
3. Todos os itens de cobrança com seus valores em reais (TUSD, TE, ICMS, PIS/COFINS, Contribuição de Iluminação Pública/COSIP, Bandeira Tarifária, juros, multas, outros)
4. Alertas sobre cobranças indevidas, bandeiras tarifárias, multas ou valores elevados
5. Oportunidades de economia com energia solar

IMPORTANTE: Responda APENAS com um JSON válido, sem texto adicional, no seguinte formato:
{
  "concessionaria": "nome da concessionária",
  "cliente": "nome do cliente ou 'Não identificado'",
  "mes_referencia": "mês/ano de referência",
  "total_fatura": 0.00,
  "consumo_kwh": 0,
  "itens": [
    {
      "nome": "Nome do Item",
      "valor": 0.00,
      "percentual": 0.0,
      "descricao": "breve descrição do que é este item"
    }
  ],
  "alertas": ["alerta 1", "alerta 2"],
  "economia_solar": "texto sobre potencial de economia com solar",
  "resumo": "parágrafo resumindo o que foi encontrado na fatura e os principais pontos de atenção"
}`

        let content: Anthropic.MessageParam['content']

        if (file.type === 'application/pdf') {
          content = [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data,
              },
            } as Anthropic.DocumentBlockParam,
            {
              type: 'text',
              text: `Analise esta fatura de energia da ${concessionariaLabel} e retorne o JSON estruturado conforme solicitado.`,
            },
          ]
        } else {
          const mediaType = file.type as
            | 'image/jpeg'
            | 'image/png'
            | 'image/webp'
            | 'image/gif'
          content = [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            } as Anthropic.ImageBlockParam,
            {
              type: 'text',
              text: `Analise esta fatura de energia da ${concessionariaLabel} e retorne o JSON estruturado conforme solicitado.`,
            },
          ]
        }

        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content }],
        })

        const rawText =
          message.content[0].type === 'text' ? message.content[0].text : ''

        // Extract JSON from the response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          return Response.json(
            { error: 'Não foi possível extrair os dados da fatura. Verifique se o arquivo é uma fatura de energia válida.' },
            { status: 422 },
          )
        }

        let billData
        try {
          billData = JSON.parse(jsonMatch[0])
        } catch {
          return Response.json(
            { error: 'Falha ao processar a resposta da análise. Tente novamente.' },
            { status: 500 },
          )
        }

        // Ensure percentuais are calculated if missing
        if (billData.itens && billData.total_fatura > 0) {
          billData.itens = billData.itens.map(
            (item: { nome: string; valor: number; percentual?: number; descricao?: string }) => ({
              ...item,
              percentual:
                item.percentual ?? (Math.abs(item.valor) / billData.total_fatura) * 100,
            }),
          )
        }

        return Response.json(billData)
      },
    },
  },
})
