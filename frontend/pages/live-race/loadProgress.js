// Weighted loading steps the Race Center actually waits on. `session` carries
// the heaviest work (FastF1 loads the whole session on first request), so it
// weighs the most. `stage` is the label shown while that step is the first
// one still outstanding.
export const LOAD_STEPS = [
    { id: 'schedule', weight: 1, stage: 'Connecting to timing feed' },
    { id: 'session', weight: 4, stage: 'Loading race session' },
    { id: 'positions', weight: 2, stage: 'Syncing car telemetry' },
    { id: 'track', weight: 1, stage: 'Mapping the circuit' },
    { id: 'pitstops', weight: 1, stage: 'Loading tyre and strategy data' },
    { id: 'weather', weight: 1, stage: 'Checking track conditions' },
    { id: 'trackStatus', weight: 1, stage: 'Reading race control messages' },
]

const TOTAL_WEIGHT = LOAD_STEPS.reduce((sum, s) => sum + s.weight, 0)

// doneIds: Set of completed step ids -> { fraction: 0..1, stage: string }
export function computeLoadProgress(doneIds) {
    const doneWeight = LOAD_STEPS.reduce((sum, s) => sum + (doneIds.has(s.id) ? s.weight : 0), 0)
    const pending = LOAD_STEPS.find(s => !doneIds.has(s.id))
    return { fraction: doneWeight / TOTAL_WEIGHT, stage: pending ? pending.stage : 'Green flag' }
}
