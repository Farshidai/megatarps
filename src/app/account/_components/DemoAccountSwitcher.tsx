import { setDemoAccount } from '../settings/actions'

const OPTIONS = [
  { value: 'guest', label: 'Signed out' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

/** DEMO MODE only: lets QA preview each account state via the demo_account cookie. */
export function DemoAccountSwitcher({ current, back = '/account' }: { current: string; back?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 flex flex-wrap items-center gap-2 text-xs">
      <span className="font-bold text-slate-500 uppercase tracking-wider mr-1">Demo: view as</span>
      {OPTIONS.map((o) => (
        <form key={o.value} action={setDemoAccount}>
          <input type="hidden" name="status" value={o.value} />
          <input type="hidden" name="back" value={back} />
          <button
            type="submit"
            aria-pressed={current === o.value}
            className={`px-3 py-1.5 rounded-full border font-semibold transition-colors ${
              current === o.value ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600 hover:border-orange-400 hover:text-orange-600'
            }`}
          >
            {o.label}
          </button>
        </form>
      ))}
    </div>
  )
}
