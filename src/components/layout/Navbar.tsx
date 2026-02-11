'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Plus } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Overview' },
  { href: '/compare', label: 'Compare' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-[var(--card-bg)] border-b border-[var(--border)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-[var(--primary)]" />
              <span className="font-semibold text-lg">AI Portfolio Tracker</span>
            </Link>

            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--secondary-text)] hover:text-[var(--foreground)] hover:bg-[var(--background)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <Link
            href="/portfolio/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Agent
          </Link>
        </div>
      </div>
    </nav>
  );
}
