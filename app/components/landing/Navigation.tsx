'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Intelligence', href: '/stories' },
    { label: 'Signals', href: '/signals' },
    { label: 'Globe', href: '/globe' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  const handleGlobeClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    window.dispatchEvent(new Event('globe-wipe-start'))
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-200 ${
        isScrolled
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-md border-slate-200 dark:border-neutral-800'
          : 'bg-white dark:bg-black border-slate-200 dark:border-neutral-800'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row: nav links | logo centered | CTA */}
        <div className="relative flex items-center justify-between h-20">
          {/* Left: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group/link relative overflow-hidden text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors px-1 py-0.5"
                {...(link.href === '/globe' ? { onClick: handleGlobeClick } : {})}
              >
                <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/link:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Center: Logo + Slogan */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center"
          >
            <span className="text-xl md:text-2xl font-bold tracking-widest uppercase text-slate-900 dark:text-white bg-brand-yellow px-3 py-1">
              The Peripheral
            </span>
            <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-slate-500 dark:text-neutral-500 mt-2">
              From noise to knowledge
            </span>
          </Link>

          {/* Right: CTA Button */}
          <div className="hidden md:block">
            <a
              href="mailto:hello@theperipheral.org"
              className="inline-block group/btn relative overflow-hidden bg-black text-white text-sm font-medium px-6 py-2"
            >
              <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 group-hover/btn:text-black transition-colors duration-300">Join Waitlist</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white ml-auto"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-neutral-800">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="group/link relative text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors overflow-hidden px-1 py-0.5"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false)
                    if (link.href === '/globe') handleGlobeClick(e)
                  }}
                >
                  <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/link:translate-x-0 transition-transform duration-300 ease-out" />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              ))}
              <a
                href="mailto:hello@theperipheral.org"
                className="inline-block group/btn relative overflow-hidden bg-black text-white text-sm font-medium px-6 py-2 text-center"
              >
                <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 group-hover/btn:text-black transition-colors duration-300">Join Waitlist</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
