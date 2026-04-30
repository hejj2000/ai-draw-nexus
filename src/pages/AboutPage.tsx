import { AppSidebar, AppHeader } from '@/components/layout'
import { Github } from 'lucide-react'

export function AboutPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <AppHeader />
        <div className="flex flex-1 items-start justify-center px-8 pt-12">
          <div className="w-full max-w-3xl space-y-8">
            {/* 开源信息 */}
            <section className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-primary">
                <Github className="h-5 w-5" />
                开源项目
              </h2>
              <p className="text-sm leading-relaxed text-muted">
                本项目基于 MIT 协议开源，欢迎自由使用和二次开发。
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
