import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { label: 'Home', href: '/home' },
    { label: 'About', href: '/about' },
    { label: 'Intelligence', href: '/stories' },
    { label: 'Globe', href: '/' },
    { label: 'Contact', href: '/contact' },
  ]

  const contactEmails = [
    'hello@theperipheral.org',
    'support@theperipheral.org',
  ]

  return (
    <footer className="border-t border-brand-neutral-100 dark:border-brand-navy py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Left: Brand */}
          <div>
            <h3 className="text-lg font-semibold text-brand-ink dark:text-white mb-2">
              The Peripheral
            </h3>
            <p className="text-sm text-brand-warm-600 dark:text-brand-warm-400">
              The truth is out of focus.
            </p>
          </div>

          {/* Center: Links */}
          <div>
            <h4 className="text-sm font-semibold text-brand-ink dark:text-white mb-3">
              Links
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-warm-600 dark:text-brand-warm-400 hover:text-brand-ink dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Contact */}
          <div>
            <h4 className="text-sm font-semibold text-brand-ink dark:text-white mb-3">
              Contact
            </h4>
            <ul className="space-y-2">
              {contactEmails.map((email) => (
                <li key={email}>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-brand-warm-600 dark:text-brand-warm-400 hover:text-brand-ink dark:hover:text-white transition-colors"
                  >
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="pt-8 border-t border-brand-neutral-100 dark:border-brand-navy">
          <p className="text-sm text-brand-warm-600 dark:text-brand-warm-400 text-center">
            &copy; {currentYear} The Peripheral. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
