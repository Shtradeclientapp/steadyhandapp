'use client'
import { useState, useEffect } from 'react'

const PRESETS = [
  {
    id: 'none',
    label: 'Single payment',
    description: 'Full amount paid on completion',
    milestones: [{ label: 'Completion', description: 'Full payment on job completion', percent: 100 }],
  },
  {
    id: 'deposit',
    label: 'Deposit + completion',
    description: '50% upfront, 50% on completion',
    milestones: [
      { label: 'Deposit', description: 'Paid before work begins', percent: 50 },
      { label: 'Completion', description: 'Paid on job completion', percent: 50 },
    ],
  },
  {
    id: 'thirds',
    label: 'Three milestones',
    description: 'Deposit, progress and completion',
    milestones: [
      { label: 'Deposit', description: 'Paid before work begins', percent: 30 },
      { label: 'Progress', description: 'Paid at agreed midpoint', percent: 40 },
      { label: 'Completion', description: 'Paid on job completion', percent: 30 },
    ],
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Set your own milestones and weightings',
    milestones: [],
  },
]

export function MilestoneEditor({ scope, currentQuote, onSave }: any) {
  const [mode, setMode] = useState<string>('custom')
  const [milestones, setMilestones] = useState<any[]>(scope?.milestones || [])
  const [editing, setEditing] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (scope?.milestones) setMilestones(scope.milestones)
  }, [scope])

  const total = milestones.reduce((sum: number, m: any) => sum + Number(m.percent), 0)
  const isValid = total === 100
  const price = Number(currentQuote?.total_price || 0)

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    setMode(presetId)
    if (presetId !== 'custom') setMilestones(preset.milestones)
  }

  const updateMilestone = (i: number, field: string, value: string) => {
    setMilestones(prev => {
      const updated = [...prev]
      updated[i] = { ...updated[i], [field]: field === 'percent' ? Number(value) : value }
      return updated
    })
  }

  const addMilestone = () => {
    setMilestones(prev => [...prev, { label: 'New milestone', description: '', percent: 0 }])
  }

  const removeMilestone = (i: number) => {
    setMilestones(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    await onSave(milestones)
    setSaving(false)
    setEditing(false)
  }

  const inp = { width: '100%', padding: '7px 10px', border: '1.5px solid rgba(28,43,50,0.15)', borderRadius: '6px', fontSize: '13px', background: '#F4F8F7', color: '#0A0A0A', outline: 'none', boxSizing: 'border-box' as const }

  return (
    <div style={{ padding: '24px 32px', borderBottom: '1px solid #F0F0F0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: '#9AA5AA', fontWeight: 600, margin: 0 }}>Payment milestones</p>
        <button type="button" onClick={() => setEditing(!editing)}
          style={{ fontSize: '11px', color: '#2E6A8F', background: 'rgba(46,106,143,0.08)', border: '1px solid rgba(46,106,143,0.2)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}>
          {editing ? 'Cancel' : 'Edit milestones'}
        </button>
      </div>

      {editing && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 24px', gap: '6px', marginBottom: '4px' }}>
              {['Milestone', 'Description', '%', ''].map(h => (
                <p key={h} style={{ fontSize: '10px', color: '#9AA5AA', margin: 0 }}>{h}</p>
              ))}
            </div>
            {milestones.map((m: any, i: number) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 24px', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <input type="text" value={m.label} onChange={e => updateMilestone(i, 'label', e.target.value)} style={{ ...inp, marginBottom: 0 }} />
                <input type="text" value={m.description} onChange={e => updateMilestone(i, 'description', e.target.value)} placeholder="When is this due?" style={{ ...inp, marginBottom: 0 }} />
                <div style={{ position: 'relative' as const }}>
                  <input type="number" min="0" max="100" value={m.percent} onChange={e => updateMilestone(i, 'percent', e.target.value)} style={{ ...inp, marginBottom: 0, paddingRight: '20px' }} />
                  <span style={{ position: 'absolute' as const, right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#7A9098' }}>%</span>
                </div>
                <button type="button" onClick={() => removeMilestone(i)} style={{ background: 'none', border: 'none', color: '#D4522A', cursor: 'pointer', fontSize: '16px', padding: 0 }}>×</button>
              </div>
            ))}
            <button type="button" onClick={addMilestone}
              style={{ fontSize: '12px', color: '#2E7D60', background: 'rgba(46,125,96,0.08)', border: '1px dashed rgba(46,125,96,0.3)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', marginTop: '4px' }}>
              + Add milestone
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: isValid ? 'rgba(46,125,96,0.06)' : 'rgba(212,82,42,0.06)', border: '1px solid ' + (isValid ? 'rgba(46,125,96,0.2)' : 'rgba(212,82,42,0.2)'), borderRadius: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: isValid ? '#2E7D60' : '#D4522A', fontWeight: 500 }}>
              {isValid ? '✓ Milestones add up to 100%' : 'Total: ' + total + '% — must equal 100%'}
            </span>
            <button type="button" onClick={handleSave} disabled={!isValid || saving}
              style={{ background: isValid ? '#2E7D60' : 'rgba(28,43,50,0.2)', color: 'white', padding: '8px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 500, border: 'none', cursor: isValid ? 'pointer' : 'not-allowed', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save milestones →'}
            </button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div style={{ padding: '16px', textAlign: 'center' as const, background: '#F4F8F7', borderRadius: '8px' }}>
          <p style={{ fontSize: '13px', color: '#7A9098', margin: 0 }}>No milestones set — click Edit milestones to configure payment structure</p>
        </div>
      ) : (
        milestones.map((m: any, i: number) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px solid #F8F8F8' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0A', marginBottom: '2px' }}>{m.label}</p>
              <p style={{ fontSize: '12px', color: '#7A9098' }}>{m.description}</p>
            </div>
            <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: '20px' }}>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#0A0A0A' }}>{m.percent}%</p>
              {price > 0 && <p style={{ fontSize: '12px', color: '#7A9098' }}>${Math.round(price * m.percent / 100).toLocaleString()}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}