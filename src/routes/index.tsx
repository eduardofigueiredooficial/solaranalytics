import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Sun,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  Zap,
  TrendingDown,
  BarChart2,
  X,
  Loader2,
} from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
)

export const Route = createFileRoute('/')({
  component: Home,
})

type Concessionaria = 'energisa' | 'neoenergia'

interface BillItem {
  nome: string
  valor: number
  percentual?: number
  descricao?: string
}

interface BillAnalysis {
  concessionaria: string
  cliente: string
  mes_referencia: string
  total_fatura: number
  consumo_kwh: number
  itens: BillItem[]
  alertas: string[]
  economia_solar?: string
  resumo: string
}

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [concessionaria, setConcessionaria] = useState<Concessionaria>('energisa')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<BillAnalysis | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  function handleFile(f: File) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(f.type)) {
      setError('Formato não suportado. Use PDF, JPG, PNG ou WEBP.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10 MB.')
      return
    }
    setError(null)
    setFile(f)
    setAnalysis(null)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('concessionaria', concessionaria)
      const res = await fetch('/api/analyze-bill', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(err.error || `Erro ${res.status}`)
      }
      const data: BillAnalysis = await res.json()
      setAnalysis(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao analisar fatura')
    } finally {
      setLoading(false)
    }
  }

  const chartColors = [
    'rgba(245, 158, 11, 0.85)',
    'rgba(16, 185, 129, 0.85)',
    'rgba(59, 130, 246, 0.85)',
    'rgba(239, 68, 68, 0.85)',
    'rgba(139, 92, 246, 0.85)',
    'rgba(236, 72, 153, 0.85)',
    'rgba(20, 184, 166, 0.85)',
    'rgba(251, 146, 60, 0.85)',
  ]

  const doughnutData = analysis
    ? {
        labels: analysis.itens.map((i) => i.nome),
        datasets: [
          {
            data: analysis.itens.map((i) => i.valor),
            backgroundColor: chartColors.slice(0, analysis.itens.length),
            borderWidth: 0,
          },
        ],
      }
    : null

  const barData = analysis
    ? {
        labels: analysis.itens.map((i) => i.nome),
        datasets: [
          {
            label: 'Valor (R$)',
            data: analysis.itens.map((i) => i.valor),
            backgroundColor: chartColors.slice(0, analysis.itens.length),
            borderRadius: 6,
          },
        ],
      }
    : null

  const concessionariaName =
    concessionaria === 'energisa' ? 'Energisa (Paraíba)' : 'Neo Energia (Pernambuco)'

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="bg-amber-400 p-2 rounded-xl">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">SolarAnalytics</h1>
            <p className="text-xs text-gray-500">Análise Inteligente de Faturas de Energia</p>
          </div>
          <div className="ml-auto flex gap-2">
            <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-medium">
              Energisa PB
            </span>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
              Neo Energia PE
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Entenda sua Fatura de Energia
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Faça o upload da fatura do seu cliente e descubra exatamente o que está sendo cobrado.
            Suportamos faturas da <strong>Energisa (Paraíba)</strong> e{' '}
            <strong>Neo Energia (Pernambuco)</strong>.
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit}>
            {/* Concessionária selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Concessionária
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    { id: 'energisa', label: 'Energisa', sub: 'Paraíba', color: 'amber' },
                    { id: 'neoenergia', label: 'Neo Energia', sub: 'Pernambuco', color: 'green' },
                  ] as const
                ).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConcessionaria(c.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      concessionaria === c.id
                        ? c.color === 'amber'
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-green-400 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Zap
                      className={`w-5 h-5 ${
                        concessionaria === c.id
                          ? c.color === 'amber'
                            ? 'text-amber-500'
                            : 'text-green-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">{c.label}</p>
                      <p className="text-xs text-gray-500">{c.sub}</p>
                    </div>
                    {concessionaria === c.id && (
                      <CheckCircle
                        className={`w-4 h-4 ml-auto ${
                          c.color === 'amber' ? 'text-amber-500' : 'text-green-500'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-amber-400 bg-amber-50'
                  : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-amber-300 hover:bg-amber-50/40'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-10 h-10 text-green-500" />
                  <p className="font-semibold text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                      setAnalysis(null)
                    }}
                    className="text-xs text-red-500 flex items-center gap-1 hover:underline mt-1"
                  >
                    <X className="w-3 h-3" /> Remover
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="w-10 h-10 text-gray-400" />
                  <div>
                    <p className="font-semibold text-gray-700">
                      Arraste a fatura aqui ou clique para selecionar
                    </p>
                    <p className="text-sm text-gray-400 mt-1">PDF, JPG, PNG ou WEBP — até 10 MB</p>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="mt-5 w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando fatura...
                </>
              ) : (
                <>
                  <BarChart2 className="w-5 h-5" />
                  Analisar Fatura
                </>
              )}
            </button>
          </form>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm text-gray-500 mb-1">Total da Fatura</p>
                <p className="text-3xl font-bold text-red-500">
                  R$ {analysis.total_fatura.toFixed(2).replace('.', ',')}
                </p>
                <p className="text-xs text-gray-400 mt-1">{analysis.mes_referencia}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm text-gray-500 mb-1">Consumo</p>
                <p className="text-3xl font-bold text-blue-500">{analysis.consumo_kwh} kWh</p>
                <p className="text-xs text-gray-400 mt-1">
                  R$ {analysis.consumo_kwh > 0 ? (analysis.total_fatura / analysis.consumo_kwh).toFixed(2).replace('.', ',') : '—'}/kWh médio
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-sm text-gray-500 mb-1">Concessionária</p>
                <p className="text-xl font-bold text-gray-900">{analysis.concessionaria}</p>
                <p className="text-xs text-gray-400 mt-1">{analysis.cliente}</p>
              </div>
            </div>

            {/* Resumo IA */}
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 p-5">
              <div className="flex items-start gap-3">
                <Sun className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Análise do Assistente</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{analysis.resumo}</p>
                  {analysis.economia_solar && (
                    <div className="mt-3 flex items-start gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                      <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{analysis.economia_solar}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Alertas */}
            {analysis.alertas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Alertas Identificados
                </h3>
                <ul className="space-y-2">
                  {analysis.alertas.map((alerta, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      {alerta}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Charts */}
            {mounted && doughnutData && barData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    Distribuição dos Itens (R$)
                  </h3>
                  <div className="max-w-xs mx-auto">
                    <Doughnut
                      data={doughnutData}
                      options={{
                        responsive: true,
                        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
                      }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Valor por Item (R$)</h3>
                  <Bar
                    data={barData}
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, ticks: { callback: (v) => `R$ ${v}` } },
                        x: { ticks: { font: { size: 10 } } },
                      },
                    }}
                  />
                </div>
              </div>
            )}

            {/* Detalhamento */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Detalhamento dos Itens</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {analysis.itens.map((item, i) => (
                  <div key={i} className="px-6 py-4 flex items-center gap-4">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: chartColors[i % chartColors.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm">{item.nome}</p>
                      {item.descricao && (
                        <p className="text-xs text-gray-500 mt-0.5">{item.descricao}</p>
                      )}
                    </div>
                    {item.percentual !== undefined && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.percentual.toFixed(1)}%
                      </span>
                    )}
                    <p
                      className={`font-semibold text-sm tabular-nums ${item.valor < 0 ? 'text-green-600' : 'text-gray-900'}`}
                    >
                      {item.valor < 0 ? '- ' : ''}R${' '}
                      {Math.abs(item.valor).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="font-bold text-lg text-red-500">
                  R$ {analysis.total_fatura.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* How it works */}
        {!analysis && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              {
                icon: Upload,
                title: '1. Faça o upload',
                desc: 'Selecione a fatura em PDF ou foto da conta de energia.',
              },
              {
                icon: Zap,
                title: '2. IA analisa',
                desc: 'Nossa inteligência artificial identifica cada item da cobrança.',
              },
              {
                icon: BarChart2,
                title: '3. Veja os gráficos',
                desc: 'Entenda visualmente o que pesa mais na conta do seu cliente.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 text-center"
              >
                <div className="bg-amber-100 w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <item.icon className="w-5 h-5 text-amber-600" />
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
