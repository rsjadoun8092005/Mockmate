"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { useRoomContext } from '@livekit/components-react'

// Basic language options - ideally this is fetched dynamically from Supabase JD requirements
const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp']

export default function CodeEditor() {
  const room = useRoomContext()
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('// Start coding here...')
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const broadcastCodeState = useCallback((currentCode: string, lang: string) => {
    if (!room || room.state !== 'connected') return

    const payload = JSON.stringify({
      event: 'code_update',
      language: lang,
      content: currentCode
    })

    const encoder = new TextEncoder()
    const data = encoder.encode(payload)
    
    // Broadcast reliably to backend agent on the editor_state topic
    room.localParticipant.publishData(data, { reliable: true, topic: 'editor_state' })
  }, [room])

  const handleEditorChange = (value: string | undefined) => {
    const val = value || ''
    setCode(val)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    
    // Debounce data channel broadcast to every 1.5 seconds of typing
    debounceTimer.current = setTimeout(() => {
      broadcastCodeState(val, language)
    }, 1500)
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value
    setLanguage(newLang)
    broadcastCodeState(code, newLang)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Editor Header / Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <span className="text-slate-400 text-sm font-medium">Language:</span>
          <select 
            value={language}
            onChange={handleLanguageChange}
            className="bg-slate-800 text-slate-300 text-sm border-none rounded px-3 py-1 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
          >
            {LANGUAGES.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-400 flex items-center font-mono tracking-wider">
          <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
          SYNC ACTIVE
        </span>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 w-full h-full relative">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily: 'Consolas, "Courier New", monospace',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            padding: { top: 24, bottom: 24 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
          }}
        />
      </div>
    </div>
  )
}
