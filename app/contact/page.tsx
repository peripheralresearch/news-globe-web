import { Navigation, Footer } from '@/app/components/landing'

const contacts = [
  {
    label: 'General Enquiries',
    email: 'hello@theperipheral.org',
    description: 'Questions about The Peripheral, partnerships, or media enquiries.',
  },
  {
    label: 'Information & Tips',
    email: 'info@theperipheral.org',
    description: 'Submit tips, source information, or intelligence leads.',
  },
  {
    label: 'Technical Support',
    email: 'support@theperipheral.org',
    description: 'Bug reports, API access requests, or technical issues.',
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      {/* Hero */}
      <section className="bg-brand-yellow py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-5xl font-bold text-black mb-4">
            Get in touch
          </h1>
          <p className="text-lg text-black/70">
            Reach the team behind The Peripheral.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-8">
          {contacts.map((c) => (
            <div key={c.email} className="border-b border-slate-200 pb-8 last:border-0">
              <h2 className="text-lg font-semibold text-slate-900 mb-1">
                {c.label}
              </h2>
              <p className="text-sm text-slate-500 mb-3">
                {c.description}
              </p>
              <a
                href={`mailto:${c.email}`}
                className="group/email relative overflow-hidden inline-block px-1 py-0.5 font-medium text-slate-900"
              >
                <span className="absolute inset-0 bg-brand-yellow -translate-x-full group-hover/email:translate-x-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10">{c.email}</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Beta Access */}
      <section className="bg-black py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Request Early Access
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            The Peripheral is in early access. Journalists, analysts, and researchers — reach out and we&apos;ll get you set up.
          </p>
          <a
            href="mailto:hello@theperipheral.org"
            className="group/btn relative overflow-hidden inline-block bg-brand-yellow text-black font-medium px-8 py-3"
          >
            <span className="absolute inset-0 bg-white -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10">hello@theperipheral.org</span>
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
