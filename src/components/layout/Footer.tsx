import Link from 'next/link'
import { Phone, Mail, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-orange-500 text-white font-black text-lg px-3 py-1 rounded">MEGA</div>
              <span className="text-white font-bold text-xl">TARPS</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Premium heavy-duty tarps for contractors, farmers, and industry professionals.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-400" />
                <a href="tel:+19133132691" className="hover:text-white">(913) 313-2691</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400" />
                <a href="mailto:mfirooz@megatarps.com" className="hover:text-white">mfirooz@megatarps.com</a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 mt-0.5" />
                <span className="text-slate-400">Ships Nationwide</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/construction-roofing" className="hover:text-orange-400">Construction & Roofing</Link></li>
              <li><Link href="/products/agriculture-farming" className="hover:text-orange-400">Agriculture & Farming</Link></li>
              <li><Link href="/products/industrial-warehouse" className="hover:text-orange-400">Industrial & Warehouse</Link></li>
              <li><Link href="/products/general-purpose" className="hover:text-orange-400">General Purpose</Link></li>
              <li><Link href="/products?type=fire-retardant" className="hover:text-orange-400">Fire Retardant Tarps</Link></li>
              <li><Link href="/products?type=mesh" className="hover:text-orange-400">Mesh Tarps</Link></li>
              <li><Link href="/products?type=canvas" className="hover:text-orange-400">Canvas Tarps</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/resources#sizing" className="hover:text-orange-400">Tarp Sizing Guide</Link></li>
              <li><Link href="/resources#mil-thickness" className="hover:text-orange-400">Mil Thickness Explained</Link></li>
              <li><Link href="/resources#materials" className="hover:text-orange-400">Fire Retardant Ratings</Link></li>
              <li><Link href="/resources#faq" className="hover:text-orange-400">Grommet Spacing Guide</Link></li>
              <li><Link href="/bulk-quote" className="hover:text-orange-400">Bulk Pricing / RFQ</Link></li>
              <li><Link href="/about" className="hover:text-orange-400">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400">Contact</Link></li>
            </ul>
          </div>

          {/* Contractor */}
          <div>
            <h3 className="text-white font-semibold mb-4">For Contractors</h3>
            <ul className="space-y-2 text-sm mb-6">
              <li><Link href="/account" className="hover:text-orange-400">Contractor Login</Link></li>
              <li><Link href="/account/orders" className="hover:text-orange-400">Track Orders</Link></li>
              <li><Link href="/account/quotes" className="hover:text-orange-400">My Quotes</Link></li>
              <li><Link href="/bulk-quote" className="hover:text-orange-400">Request Bulk Quote</Link></li>
            </ul>
            <div className="bg-slate-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-white mb-1">Bulk Quote Response</p>
              <p className="text-xs text-slate-400">We respond within 4 business hours</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} MegaTarps. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
