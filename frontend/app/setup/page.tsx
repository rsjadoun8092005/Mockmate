"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function SetupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Get User Session (Require login for RLS)
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        alert("Authentication Required! Please setup OAuth in Supabase and login before creating an interview.")
        setLoading(false)
        return
      }

      const formData = new FormData(e.currentTarget)
      const companyName = formData.get('companyName') as string
      const jobDescription = formData.get('jobDescription') as string
      const resumeFile = formData.get('resume') as File

      // 2. Parse PDF Resume
      const parseForm = new FormData()
      parseForm.append('resume', resumeFile)
      
      const parseRes = await fetch('/api/parse-resume', {
        method: 'POST',
        body: parseForm
      })
      
      if (!parseRes.ok) throw new Error("Failed to parse the uploaded resume. Ensure it's a valid PDF.")
      
      const { text: resumeText } = await parseRes.json()

      // 3. Save Interview Context to Supabase
      const { data: interview, error: dbError } = await supabase
        .from('interviews')
        .insert({
          user_id: user.id,
          company_name: companyName,
          job_description: jobDescription,
          resume_text: resumeText,
          status: 'PENDING'
        })
        .select()
        .single()

      if (dbError) throw dbError

      // 4. Redirect to the Interview Room
      router.push(`/interview/${interview.id}`)

    } catch (error: any) {
      console.error(error)
      alert(error.message || "An error occurred during setup.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-50 selection:bg-indigo-500/30">
      <Card className="w-full max-w-2xl bg-slate-900/80 border-slate-800 backdrop-blur-xl shadow-2xl">
        <CardHeader className="space-y-3">
          <CardTitle className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-500">
            Interview Setup
          </CardTitle>
          <CardDescription className="text-slate-400 text-base">
            Upload your resume and the target job description so MockMate AI can dynamically tailor the interview to your profile.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-slate-300 font-medium">Target Company Name</Label>
              <Input 
                id="companyName" 
                name="companyName" 
                required 
                placeholder="e.g. Meta, Google, Stripe..." 
                className="bg-slate-950/50 border-slate-800 focus-visible:ring-indigo-500 text-slate-100 placeholder:text-slate-600 transition-colors"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobDescription" className="text-slate-300 font-medium">Job Description (JD)</Label>
              <textarea 
                id="jobDescription" 
                name="jobDescription" 
                required
                rows={6}
                className="flex w-full rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                placeholder="Paste the full job description here..." 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume" className="text-slate-300 font-medium">Upload Resume (PDF only)</Label>
              <Input 
                id="resume" 
                name="resume" 
                type="file" 
                accept="application/pdf"
                required 
                className="bg-slate-950/50 border-slate-800 focus-visible:ring-indigo-500 cursor-pointer file:text-slate-300 file:bg-slate-800 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded-md file:font-medium file:transition-colors hover:file:bg-slate-700 text-slate-400"
              />
            </div>
          </CardContent>
          <CardFooter className="pt-4 pb-8">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-full h-14 text-lg font-medium transition-all hover:scale-[1.02] shadow-[0_0_30px_-5px_rgba(79,70,229,0.4)]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Interview Context'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
