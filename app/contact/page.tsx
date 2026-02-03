import { Navigation, NewsTicker, Footer } from '@/app/components/landing'

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
      <NewsTicker />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
          Contact
        </h1>
        <p className="text-lg text-slate-600 dark:text-neutral-400 mb-12">
          Get in touch with the team behind The Peripheral.
        </p>

        <div className="space-y-6">
          {contacts.map((c) => (
            <div
              key={c.email}
              className="bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {c.label}
              </h2>
              <p className="text-sm text-slate-600 dark:text-neutral-400 mb-3">
                {c.description}
              </p>
              <a
                href={`mailto:${c.email}`}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
              >
                {c.email}
              </a>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-neutral-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Beta Access
          </h2>
          <p className="text-slate-600 dark:text-neutral-400 mb-4">
            The Peripheral is currently in early access. If you&apos;re a journalist, analyst, or
            researcher interested in using the platform, reach out and we&apos;ll get you set up.
          </p>
          <a
            href="mailto:hello@theperipheral.org"
            className="inline-block bg-blue-600 dark:bg-blue-400 text-white dark:text-black font-medium px-8 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-300 transition-colors"
          >
            Request Access
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
