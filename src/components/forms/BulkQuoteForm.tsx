'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, Send } from 'lucide-react'

interface LineItem {
  description: string
  sku: string
  quantity: number
}

export function BulkQuoteForm() {
  const searchParams = useSearchParams()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [items, setItems] = useState<LineItem[]>([{ description: '', sku: '', quantity: 5 }])
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '',
    project_type: '', project_location: '', timeline: 'flexible', special_requirements: '',
    shipping_name: '', shipping_line1: '', shipping_city: '', shipping_state: '', shipping_zip: '',
  })

  // Pre-fill from query params (from product page "Request bulk quote")
  useEffect(() => {
    const sku = searchParams.get('sku')
    const name = searchParams.get('name')
    const qty = searchParams.get('qty')
    if (sku || name) {
      setItems([{
        sku: sku ?? '',
        description: name ?? '',
        quantity: qty ? parseInt(qty) : 5,
      }])
    }
  }, [searchParams])

  const addItem = () => setItems([...items, { description: '', sku: '', quantity: 5 }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, items }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again or call us directly.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Quote Request Received!</h2>
        <p className="text-slate-600 mb-2">We&apos;ll review your request and send pricing to <strong>{form.email}</strong> within 4 business hours.</p>
        <p className="text-slate-500 text-sm">Questions? Call us at (913) 313-2691</p>
        <a href="/products" className="mt-6 inline-block text-orange-600 font-semibold hover:underline">
          Continue browsing →
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Contact Info */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="John Smith" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Company</label>
            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="Smith Roofing LLC" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="john@smithroofing.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="(555) 000-0000" />
          </div>
        </div>
      </div>

      {/* Products */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4">Products Needed</h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-5">
                {i === 0 && <label className="block text-sm font-semibold text-slate-700 mb-1">Product Description *</label>}
                <input
                  required
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
                  placeholder="e.g. 16-Mil Brown Super Heavy Duty 20x40"
                />
              </div>
              <div className="col-span-3">
                {i === 0 && <label className="block text-sm font-semibold text-slate-700 mb-1">SKU (if known)</label>}
                <input
                  value={item.sku}
                  onChange={e => updateItem(i, 'sku', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
                  placeholder="BHD-2040"
                />
              </div>
              <div className="col-span-3">
                {i === 0 && <label className="block text-sm font-semibold text-slate-700 mb-1">Quantity *</label>}
                <input
                  required
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
                />
              </div>
              <div className="col-span-1 flex justify-end">
                {i === 0 && <div className="mb-1 h-5" />}
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem}
          className="mt-3 flex items-center gap-2 text-sm text-orange-600 font-semibold hover:text-orange-700">
          <Plus className="w-4 h-4" /> Add another product
        </button>
      </div>

      {/* Project Details */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4">Project Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Type</label>
            <select value={form.project_type} onChange={e => setForm({...form, project_type: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm bg-white">
              <option value="">Select...</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="agricultural">Agricultural</option>
              <option value="industrial">Industrial</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Timeline</label>
            <select value={form.timeline} onChange={e => setForm({...form, timeline: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm bg-white">
              <option value="urgent">Urgent (ASAP)</option>
              <option value="1-2 weeks">1–2 Weeks</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Project Location / Jobsite City</label>
            <input value={form.project_location} onChange={e => setForm({...form, project_location: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="Kansas City, MO" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Special Requirements or Notes</label>
            <textarea value={form.special_requirements} onChange={e => setForm({...form, special_requirements: e.target.value})}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm resize-none"
              placeholder="Fire retardant required? Specific colors? Delivery date needed?" />
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div>
        <h2 className="text-xl font-black text-slate-900 mb-4">Shipping Address</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Recipient Name *</label>
            <input required value={form.shipping_name} onChange={e => setForm({...form, shipping_name: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="John Smith" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Street Address *</label>
            <input required value={form.shipping_line1} onChange={e => setForm({...form, shipping_line1: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="1234 Main St" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">City *</label>
            <input required value={form.shipping_city} onChange={e => setForm({...form, shipping_city: e.target.value})}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
              placeholder="Kansas City" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">State *</label>
              <input required value={form.shipping_state} onChange={e => setForm({...form, shipping_state: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
                placeholder="MO" maxLength={2} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">ZIP *</label>
              <input required value={form.shipping_zip} onChange={e => setForm({...form, shipping_zip: e.target.value})}
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-orange-400 text-sm"
                placeholder="64101" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-black text-lg py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-colors"
      >
        <Send className="w-5 h-5" />
        {submitting ? 'Sending…' : 'Submit Quote Request'}
      </button>
      <p className="text-center text-sm text-slate-400">
        We respond within 4 business hours · No commitment required
      </p>
    </form>
  )
}
