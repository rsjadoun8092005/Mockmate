"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { LiveKitRoom, RoomAudioRenderer, useConnectionState } from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2 } from 'lucide-react'
import CodeEditor from '@/components/CodeEditor'

export default function InterviewRoom() {
  const params = useParams()
  const interviewId = params.id as string
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Fetch LiveKit token
    const fetchToken = async () => {
      try {
        const resp = await fetch(`/api/token?room=${interviewId}`)
        const data = await resp.json()
        if (data.token) {
          setToken(data.token)
        } else {
          console.error("Failed to fetch token:", data.error)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchToken()
  }, [interviewId])

  if (!token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-lg">Generating LiveKit Token...</span>
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={false}
      audio={true}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      className="flex h-screen w-full bg-slate-950 text-slate-50"
    >
      <div className="flex w-full h-full">
        {/* Left Side: Audio & Agent Status */}
        <div className="w-1/3 border-r border-slate-800 p-6 flex flex-col items-center justify-center bg-slate-900/50">
          <h2 className="text-3xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            MockMate AI
          </h2>
          
          <div className="h-64 w-full max-w-sm bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-center p-4 shadow-2xl">
             <p className="text-slate-500 text-sm">Audio Visualizer Mount Point</p>
          </div>
          
          <ConnectionStatus />
          <RoomAudioRenderer />
        </div>

        {/* Right Side: Code Editor */}
        <div className="w-2/3 p-6 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-300">Live Code Environment</h3>
            <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-xs font-medium">
              Phase 5
            </span>
          </div>
          <div className="flex-1 rounded-xl shadow-2xl overflow-hidden">
            <CodeEditor />
          </div>
        </div>
      </div>
    </LiveKitRoom>
  )
}

function ConnectionStatus() {
  const state = useConnectionState()
  return (
    <div className="mt-8 px-6 py-2 bg-slate-900 rounded-full text-sm border border-slate-800 text-slate-300">
      Room Status: <span className="font-semibold text-indigo-400 ml-2">{state}</span>
    </div>
  )
}
