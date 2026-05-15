import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@dypai-ai/client-sdk/react'
import { Loader2, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { appConfig } from '@/lib/app-config'

export function AdminLogin() {
  const navigate = useNavigate()
  const { signIn, isAuthenticated } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    navigate(appConfig.adminHomePath, { replace: true })
    return null
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) { toast.error(error.message ?? 'No se pudo iniciar sesión'); return }
    navigate(appConfig.adminHomePath)
  }

  return (
    <div className="grid min-h-screen place-items-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:text-white">
          <Radio className="h-4 w-4" /> Volver a la web pública
        </Link>
        <Card className="border-white/10 bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle>Acceso staff</CardTitle>
            <CardDescription className="text-zinc-400">Solo para personal de la emisora</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500" />
              <Input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required className="border-white/10 bg-white/5 text-white placeholder:text-zinc-500" />
              <Button type="submit" disabled={loading} className="w-full">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Entrar</Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col gap-1 border-t border-white/5 pt-4 text-center text-xs text-zinc-500">
            <span>{appConfig.name}</span>
            <a href="https://www.dypai.ai/" target="_blank" rel="noreferrer" className="opacity-60 hover:opacity-100">Powered by <span className="font-semibold tracking-wide">DYPAI</span></a>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
