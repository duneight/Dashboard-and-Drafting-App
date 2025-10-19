'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { usePathname } from 'next/navigation'

export function Navbar() {
  const pathname = usePathname()
  
  // Get current season year
  const currentYear = new Date().getFullYear()

  const navLinks = [
    { href: '/dashboard', label: `${currentYear} Season` },
    { href: '/hall-of-fame', label: 'Hall of Fame' },
    { href: '/wall-of-shame', label: 'Wall of Shame' },
    { href: '/draft', label: 'Draft Hub' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 ml-4 flex items-center">
          <Home className="h-6 w-6 text-accent hover:text-accent/80 transition-colors" />
        </Link>
        <nav className="flex items-center gap-4 text-sm lg:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative transition-colors hover:text-foreground/80 ${
                pathname === link.href 
                  ? 'text-foreground font-semibold' 
                  : 'text-foreground/60'
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
