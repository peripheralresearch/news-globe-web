import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    { label: 'About', href: '/about' },
    { label: 'Intelligence', href: '/stories' },
    { label: 'Globe', href: '/map' },
    { label: 'Contact', href: '/contact' },
  ]

  const contactEmails = [
    'hello@theperipheral.org',
    'support@theperipheral.org',
  ]

  return (
    <footer className="border-t border-slate-200 dark:border-neutral-800 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Left: Brand */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              The Peripheral
            </h3>
            <p className="text-sm text-slate-600 dark:text-neutral-400">
              From noise to knowledge.
            </p>
          </div>

          {/* Center: Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Links
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Contact */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
              Contact
            </h4>
            <ul className="space-y-2">
              {contactEmails.map((email) => (
                <li key={email}>
                  <a
                    href={`mailto:${email}`}
                    className="text-sm text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {email}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: Copyright */}
        <div className="pt-8 border-t border-slate-200 dark:border-neutral-800">
          <p className="text-sm text-slate-600 dark:text-neutral-400 text-center">
            &copy; {currentYear} The Peripheral. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
