'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import clsx from 'clsx'

const STAGES = [
  { num: 1, label: 'Request',   path: '/request',   color: 'var(--s1)' },
  { num: 2, label: 'Shortlist', path: '/shortlist',  color: 'var(--s2)' },
  { num: 3, label: 'Agreement', path: '/agreement',  color: 'var(--s3)' },
  { num: 4, label: 'Delivery',  path: '/delivery',   color: 'var(--s4)' },
  { num: 5, label: 'Sign-off',  path: '/signoff',    color: 'var(--s5)' },
  { num: 6, label: 'Warranty',  path: '/warranty',   color: 'var(--s6)' },
]

// Status-to-stage mapping
const STATUS_STAGE: Record<string, number> = {
  draft: 0, matching: 0, shortlisted: 2, agreement: 3,
  delivery: 4, signoff: 5, warranty: 6, complete: 6,
}

export function Nav({ jobStatus }: { jobStatus?: string }) {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-9 bg-mist/95 backdrop-blur-md border-b border-ink/10">
      <button
        onClick={() => router.push('/dashboard')}
        className="font-display text-[22px] text-terra tracking-wide cursor-pointer"
      >
        STEADYHAND
      </button>
      <div className="flex items-center gap-2">
        {profile && (
          <span className="text-[13px] text-muted mr-1">{profile.full_name}</span>
        )}
        <button
          onClick={() => router.push('/dashboard')}
          className="text-[13px] text-muted px-3 py-1.5 rounded-md hover:bg-mist-d transition-colors"
        >
          Dashboard
        </button>
        <button
          onClick={signOut}
          className="text-[13px] text-ink border border-ink/20 px-3 py-1.5 rounded-md hover:bg-mist-d transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}

export function CycleRail({ jobId, currentStatus }: { jobId: string; currentStatus: string }) {
  const router = useRouter()
  const completedStage = STATUS_STAGE[currentStatus] ?? 0

  return (
    <div className="fixed top-[60px] left-0 right-0 z-40 bg-mist-l border-b border-ink/10 flex">
      {STAGES.map((stage) => {
        const isDone   = stage.num < completedStage
        const isActive = stage.num === completedStage
        const isLocked = stage.num > completedStage

        return (
          <button
            key={stage.num}
            onClick={() => !isLocked && router.push(`/dashboard/${jobId}/${stage.path.slice(1)}`)}
            disabled={isLocked}
            className={clsx(
              'flex-1 min-w-0 py-2.5 flex flex-col items-center gap-[3px] border-r border-ink/10 last:border-r-0 relative transition-colors',
              isLocked ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-mist-d'
            )}
            style={isActive ? { '--active-color': stage.color } as React.CSSProperties : undefined}
          >
            {/* Active underline */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: stage.color }} />
            )}

            {/* Number badge */}
            <div
              className={clsx(
                'w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold border-[1.5px] transition-all',
                isDone   ? 'text-white border-transparent' :
                isActive ? 'bg-transparent' :
                           'bg-mist border-ink/20 text-muted'
              )}
              style={
                isDone   ? { background: 'var(--s1)', borderColor: 'var(--s1)' } :
                isActive ? { borderColor: stage.color, color: stage.color } :
                undefined
              }
            >
              {isDone ? '✓' : stage.num}
            </div>

            <span
              className={clsx('text-[10px] text-center leading-tight transition-colors',
                isDone || isActive ? 'font-medium' : 'text-muted'
              )}
              style={isDone ? { color: 'var(--s1)' } : isActive ? { color: stage.color } : undefined}
            >
              {stage.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
