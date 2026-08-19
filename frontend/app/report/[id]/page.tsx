"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Loader2, CheckCircle2, XCircle, ChevronRight } from 'lucide-react'

export default function ReportDashboard() {
  const params = useParams()
  const interviewId = params.id as string
  const supabase = createClient()
  
  const [evaluation, setEvaluation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEval = async () => {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('interview_id', interviewId)
        .single()
        
      if (data) {
        setEvaluation(data)
      }
      setLoading(false)
    }
    
    // Polling since evaluation generation is async
    const interval = setInterval(() => {
      if (!evaluation) fetchEval()
    }, 5000)
    
    fetchEval()
    return () => clearInterval(interval)
  }, [interviewId, evaluation, supabase])

  if (loading || !evaluation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-50 selection:bg-indigo-500/30">
        <Loader2 className="h-14 w-14 animate-spin text-indigo-500 mb-8" />
        <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Analyzing your performance...
        </h2>
        <p className="text-slate-400 mt-4 text-lg max-w-md text-center">
          Gemini Pro is reviewing your code logic and conversational transcript against the rubric.
        </p>
      </div>
    )
  }

  const metrics = typeof evaluation.communication_feedback === 'string' 
    ? JSON.parse(evaluation.communication_feedback) 
    : evaluation.communication_feedback

  return (
    <div className="min-h-screen bg-slate-950 p-6 lg:p-12 text-slate-50 selection:bg-indigo-500/30">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header Section */}
        <header className="border-b border-slate-800 pb-8 animate-in fade-in slide-in-from-top-8 duration-700">
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">
            Interview Post-Mortem
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Detailed analysis and rubric grading from MockMate AI.</p>
        </header>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <div className="md:col-span-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full"></div>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10">Overall Score</span>
            <div className="text-7xl font-black text-indigo-400 relative z-10">{evaluation.overall_score}<span className="text-3xl text-slate-600">/100</span></div>
          </div>
          
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col justify-center items-center sm:items-start p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <span className="text-slate-400 text-sm font-semibold tracking-wide mb-2 uppercase">Technical</span>
              <span className="text-4xl font-black text-slate-200">{metrics?.technical || 0}<span className="text-xl text-slate-600 font-bold">/100</span></span>
            </div>
            <div className="flex flex-col justify-center items-center sm:items-start p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <span className="text-slate-400 text-sm font-semibold tracking-wide mb-2 uppercase">Communication</span>
              <span className="text-4xl font-black text-slate-200">{metrics?.communication || 0}<span className="text-xl text-slate-600 font-bold">/100</span></span>
            </div>
            <div className="flex flex-col justify-center items-center sm:items-start p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <span className="text-slate-400 text-sm font-semibold tracking-wide mb-2 uppercase">Problem Solving</span>
              <span className="text-4xl font-black text-slate-200">{metrics?.problem_solving || 0}<span className="text-xl text-slate-600 font-bold">/100</span></span>
            </div>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-8 flex items-center text-emerald-400">
              <CheckCircle2 className="mr-3 h-7 w-7" /> Key Strengths
            </h3>
            <ul className="space-y-5">
              {evaluation.strengths?.map((str: string, i: number) => (
                <li key={i} className="flex items-start">
                  <ChevronRight className="h-6 w-6 text-emerald-500/70 mr-3 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-lg leading-relaxed">{str}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <h3 className="text-2xl font-bold mb-8 flex items-center text-rose-400">
              <XCircle className="mr-3 h-7 w-7" /> Areas for Improvement
            </h3>
            <ul className="space-y-5">
              {evaluation.weaknesses?.map((wk: string, i: number) => (
                <li key={i} className="flex items-start">
                  <ChevronRight className="h-6 w-6 text-rose-500/70 mr-3 shrink-0 mt-0.5" />
                  <span className="text-slate-300 text-lg leading-relaxed">{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
          <h3 className="text-2xl font-bold mb-6 text-indigo-400">Detailed Feedback</h3>
          <div className="p-6 bg-slate-950/50 rounded-2xl border border-slate-800/50">
            <p className="text-slate-300 leading-loose text-lg whitespace-pre-wrap">
              {evaluation.technical_feedback}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
