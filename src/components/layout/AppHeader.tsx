import { useState } from 'react'
import { Sparkles, Info } from 'lucide-react'
import { NoticeDialog } from './NoticeDialog'

export function AppHeader() {
  const [showNotice, setShowNotice] = useState(false)

  return (
    <>
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-surface" />
          </div>
          <span className="text-lg font-semibold text-primary">AI Draw Nexus</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowNotice(true)}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-primary"
          >
            <Info className="h-4 w-4" />
            <span>使用须知</span>
          </button>
          <span className="text-sm text-muted">简体中文</span>
        </div>
      </header>

      <NoticeDialog open={showNotice} onOpenChange={setShowNotice} />
    </>
  )
}
