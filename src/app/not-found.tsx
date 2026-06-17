import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex items-center justify-center py-32 text-center">
      <div>
        <div className="text-6xl mb-4">⚽</div>
        <h1 className="text-4xl font-bold text-emerald-400 mb-2">404</h1>
        <p className="text-slate-400 mb-6">Esta página no existe</p>
        <Link
          href="/"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
