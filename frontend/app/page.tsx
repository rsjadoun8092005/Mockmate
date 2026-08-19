import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mic, Code, BarChart } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-indigo-500/30">
      <main className="mx-auto max-w-6xl px-6 py-24 sm:py-32 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="mb-6 inline-flex items-center rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm font-medium text-indigo-300">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            MockMate AI 2.0 is Live
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500 mb-8">
            Ace Your Next <br /> Tech Interview
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 sm:text-xl leading-relaxed">
            Experience ultra-realistic voice interviews with an AI technical recruiter.
            Practice coding in real-time and get actionable, rubric-based feedback.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/setup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-8 h-12 text-base transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]">
                Start Interview <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-32 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition-colors hover:bg-slate-800/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400">
              <Mic className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Audio-First Conversations</h3>
            <p className="text-slate-400">Low-latency voice interactions that feel like talking to a real human engineer.</p>
          </div>
          
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition-colors hover:bg-slate-800/50">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Code className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Live Code Collaboration</h3>
            <p className="text-slate-400">The AI watches you code in real-time, providing hints and evaluating your logic instantly.</p>
          </div>
          
          <div className="rounded-3xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm transition-colors hover:bg-slate-800/50 sm:col-span-2 lg:col-span-1">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <BarChart className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Deep Post-Mortem</h3>
            <p className="text-slate-400">Receive a detailed JSON rubric grading your communication, technical skills, and behavioral fit.</p>
          </div>
        </div>
      </main>

      {/* Background Gradients */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>
    </div>
  )
}
