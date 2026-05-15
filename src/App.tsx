import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { DypaiProvider } from '@dypai-ai/client-sdk/react'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { dypai } from './lib/dypai'
import { AdminLayout } from './components/AdminLayout'
import { RequireAdmin } from './components/RequireAdmin'

import { Home } from './pages/Home'
import { SchedulePage } from './pages/Schedule'
import { Programs } from './pages/Programs'
import { ProgramDetail } from './pages/ProgramDetail'
import { Articles } from './pages/Articles'
import { ArticleDetail } from './pages/ArticleDetail'
import { MediaArchive } from './pages/MediaArchive'
import { Team } from './pages/Team'
import { Contact } from './pages/Contact'

import { AdminLogin } from './pages/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminPrograms } from './pages/admin/AdminPrograms'
import { AdminSchedule } from './pages/admin/AdminSchedule'
import { AdminHosts } from './pages/admin/AdminHosts'
import { AdminArticles } from './pages/admin/AdminArticles'
import { AdminMedia } from './pages/admin/AdminMedia'
import { AdminSponsors } from './pages/admin/AdminSponsors'
import { AdminBanners } from './pages/admin/AdminBanners'
import { AdminMessages } from './pages/admin/AdminMessages'
import { AdminSettings } from './pages/admin/AdminSettings'

const queryClient = new QueryClient()

export default function App() {
  return (
    <DypaiProvider client={dypai}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/programacion" element={<SchedulePage />} />
              <Route path="/programas" element={<Programs />} />
              <Route path="/programas/:slug" element={<ProgramDetail />} />
              <Route path="/noticias" element={<Articles />} />
              <Route path="/noticias/:slug" element={<ArticleDetail />} />
              <Route path="/multimedia" element={<MediaArchive />} />
              <Route path="/equipo" element={<Team />} />
              <Route path="/contacto" element={<Contact />} />

              {/* Auth */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin */}
              <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/programs" element={<AdminPrograms />} />
                <Route path="/admin/schedule" element={<AdminSchedule />} />
                <Route path="/admin/hosts" element={<AdminHosts />} />
                <Route path="/admin/articles" element={<AdminArticles />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/sponsors" element={<AdminSponsors />} />
                <Route path="/admin/banners" element={<AdminBanners />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </DypaiProvider>
  )
}
