'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Requests', href: '/admin/requests', icon: '📋' },
  { label: 'Tours', href: '/admin/tours', icon: '✈️' },
  { label: 'Content Library', href: '/admin/content', icon: '📦' },
  { label: 'Quotes', href: '/admin/quotes', icon: '💬' },
  { label: 'Departures', href: '/admin/departures', icon: '📅' },
  { label: 'Clients', href: '/admin/clients', icon: '👥' },
  { label: 'Finance', href: '/admin/finance', icon: '💰' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: '#7A9A4A' }} />
        <span className="font-semibold text-gray-900 text-sm leading-tight">
          Safari Adventure Tour
        </span>
      </div>
      <nav className="flex flex-col gap-1 text-sm flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 transition ${
                isActive
                  ? 'bg-[#7A9A4A]/10 text-[#4C5E2A] font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 w-full text-left"
      >
        <span>🚪</span>
        <span>Log out</span>
      </button>
    </aside>
  )
}