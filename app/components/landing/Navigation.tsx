'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface NavigationProps {
  variant?: 'default' | 'transparent'
  /** Globe controls — when provided, renders theme/map-style toggles in the nav */
  theme?: 'light' | 'dark'
  mapStyle?: 'street' | 'satellite'
  onToggleTheme?: () => void
  onToggleMapStyle?: () => void
}

export default function Navigation({
  variant = 'default',
  theme = 'dark',
  mapStyle,
  onToggleTheme,
  onToggleMapStyle,
}: NavigationProps) {
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
    { label: 'Globe', href: '/globe' },
    { label: 'Media', href: '/globe-video' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ]

  const isTransparent = variant === 'transparent'
  const hasGlobeControls = isTransparent && onToggleTheme && onToggleMapStyle
  const isLight = theme === 'light'

  // --- Derive all classes based on variant + theme ---

  let navClasses: string
  if (isTransparent) {
    if (isLight) {
      navClasses = `absolute top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
        isScrolled
          ? 'bg-white/60 backdrop-blur-md border-brand-neutral-100'
          : 'bg-transparent border-transparent'
      }`
    } else {
      navClasses = `absolute top-0 left-0 right-0 z-50 border-b transition-all duration-500 ${
        isScrolled
          ? 'bg-black/40 backdrop-blur-md border-white/10'
          : 'bg-transparent border-transparent'
      }`
    }
  } else {
    navClasses = `sticky top-0 z-50 border-b transition-all duration-200 ${
      isScrolled
        ? 'bg-white/90 dark:bg-brand-abyss/90 backdrop-blur-md border-brand-neutral-100 dark:border-brand-navy'
        : 'bg-white dark:bg-brand-abyss border-brand-neutral-100 dark:border-brand-navy'
    }`
  }

  const linkClasses = isTransparent
    ? `group/link relative overflow-hidden text-sm transition-colors duration-500 px-1 py-0.5 ${
        isLight ? 'text-brand-warm-600 hover:text-brand-ink' : 'text-white/70 hover:text-white'
      }`
    : 'group/link relative overflow-hidden text-sm text-brand-warm-600 dark:text-brand-warm-400 hover:text-brand-ink dark:hover:text-white transition-colors px-1 py-0.5'

  const mobileLinkClasses = isTransparent
    ? `group/link relative text-sm transition-colors duration-500 overflow-hidden px-1 py-0.5 ${
        isLight ? 'text-brand-warm-600 hover:text-brand-ink' : 'text-white/70 hover:text-white'
      }`
    : 'group/link relative text-sm text-brand-warm-600 dark:text-brand-warm-400 hover:text-brand-ink dark:hover:text-white transition-colors overflow-hidden px-1 py-0.5'

  const mobileMenuBtnClasses = isTransparent
    ? `md:hidden p-2 ml-auto transition-colors duration-500 ${
        isLight ? 'text-brand-warm-600 hover:text-brand-ink' : 'text-white/70 hover:text-white'
      }`
    : 'md:hidden p-2 text-brand-warm-600 dark:text-brand-warm-400 hover:text-brand-ink dark:hover:text-white ml-auto'

  const mobileMenuBgClasses = isTransparent
    ? `md:hidden py-4 border-t transition-colors duration-500 ${
        isLight ? 'border-brand-neutral-100 bg-white/60 backdrop-blur-md' : 'border-white/10 bg-black/40 backdrop-blur-md'
      }`
    : 'md:hidden py-4 border-t border-brand-neutral-100 dark:border-brand-navy'

  const controlBtnClasses = isTransparent
    ? `p-2 transition-colors duration-500 ${
        isLight ? 'text-brand-warm-600 hover:text-brand-ink' : 'text-white/60 hover:text-white'
      }`
    : ''

  const mobileControlClasses = isTransparent
    ? `flex items-center gap-2 text-sm transition-colors duration-500 ${
        isLight ? 'text-brand-warm-600 hover:text-brand-ink' : 'text-white/70 hover:text-white'
      }`
    : ''

  const logoTextClasses = isTransparent
    ? `text-xl md:text-2xl font-bold tracking-widest uppercase bg-brand-yellow px-3 py-1 transition-colors duration-500 ${
        isLight ? 'text-brand-ink' : 'text-brand-ink'
      }`
    : 'text-xl md:text-2xl font-bold tracking-widest uppercase text-brand-ink dark:text-white bg-brand-yellow px-3 py-1'

  // Yellow sweep span — use -101% to avoid subpixel bleed
  const yellowSweep = (
    <span className="absolute inset-0 bg-brand-yellow -translate-x-[101%] group-hover/link:translate-x-0 transition-transform duration-300 ease-out" />
  )

  const yellowSweepBtn = (
    <span className="absolute inset-0 bg-brand-yellow -translate-x-[101%] group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
  )

  const satelliteIconStyle = isLight
    ? { opacity: 0.6 }
    : { filter: 'invert(1)' as const, opacity: 0.6 }

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row: nav links | logo centered | controls */}
        <div className="relative flex items-center justify-between h-20">
          {/* Left: Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={linkClasses}
              >
                {yellowSweep}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Center: Logo */}
          <Link
            href="/"
            className="group/logo absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-transform duration-200 hover:scale-[1.03] active:scale-[0.99]"
          >
            <span className={`${logoTextClasses} transition-shadow duration-200 group-hover/logo:shadow-[0_0_0_1px_rgba(250,212,77,0.35)]`}>
              The Peripheral
            </span>
            {!isTransparent && (
              <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-brand-warm-400 mt-2">
                The truth is out of focus
              </span>
            )}
          </Link>

          {/* Right: Globe controls or CTA */}
          <div className="hidden md:flex items-center gap-2">
            {hasGlobeControls ? (
              <>
                <button
                  onClick={onToggleTheme}
                  className={controlBtnClasses}
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={onToggleMapStyle}
                  className={controlBtnClasses}
                  title={`Switch to ${mapStyle === 'street' ? 'satellite' : 'street'} view`}
                >
                  {mapStyle === 'street' ? (
                    <img
                      src="/icons/satellite.png"
                      alt=""
                      className="h-5 w-5"
                      style={satelliteIconStyle}
                      aria-hidden="true"
                    />
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  )}
                </button>
              </>
            ) : (
              <a
                href="mailto:hello@theperipheral.org"
                className="inline-block group/btn relative overflow-hidden bg-brand-ink text-white text-sm font-medium px-6 py-2"
              >
                {yellowSweepBtn}
                <span className="relative z-10 group-hover/btn:text-brand-ink transition-colors duration-300">Join Waitlist</span>
              </a>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={mobileMenuBtnClasses}
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
          <div className={mobileMenuBgClasses}>
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className={mobileLinkClasses}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {yellowSweep}
                  <span className="relative z-10">{link.label}</span>
                </Link>
              ))}
              {hasGlobeControls ? (
                <div className={`flex items-center gap-4 pt-2 border-t transition-colors duration-500 ${
                  isLight ? 'border-brand-neutral-100' : 'border-white/10'
                }`}>
                  <button onClick={onToggleTheme} className={mobileControlClasses}>
                    {theme === 'dark' ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  </button>
                  <button onClick={onToggleMapStyle} className={mobileControlClasses}>
                    {mapStyle === 'street' ? (
                      <img src="/icons/satellite.png" alt="" className="h-4 w-4" style={satelliteIconStyle} aria-hidden="true" />
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    )}
                    {mapStyle === 'street' ? 'Satellite' : 'Street map'}
                  </button>
                </div>
              ) : (
                <a
                  href="mailto:hello@theperipheral.org"
                  className="inline-block group/btn relative overflow-hidden bg-brand-ink text-white text-sm font-medium px-6 py-2 text-center"
                >
                  {yellowSweepBtn}
                  <span className="relative z-10 group-hover/btn:text-brand-ink transition-colors duration-300">Join Waitlist</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
