export default function ForProfessionals() {
  const audiences = [
    {
      title: 'For Journalists',
      features: [
        'Fast verification of breaking events',
        'Source chain tracking',
        'Entity relationship mapping',
        'Export to article format',
      ],
    },
    {
      title: 'For Analysts',
      features: [
        'OSINT data extraction',
        'Geospatial intelligence',
        'Temporal pattern analysis',
        'API access (coming soon)',
      ],
    },
  ]

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Built for Investigators
          </h2>
          <p className="text-lg text-slate-600 dark:text-neutral-400 max-w-2xl mx-auto">
            Professional tools for those who need verified intelligence fast
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="bg-slate-50 dark:bg-neutral-900 rounded-xl p-8 border border-slate-200 dark:border-neutral-800"
            >
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-6">
                {audience.title}
              </h3>
              <ul className="space-y-3">
                {audience.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-start gap-3 text-slate-600 dark:text-neutral-400"
                  >
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <a
            href="mailto:hello@theperipheral.org"
            className="inline-block bg-blue-600 dark:bg-blue-400 text-white dark:text-black font-medium px-8 py-3 rounded-full hover:bg-blue-700 dark:hover:bg-blue-300 transition-colors"
          >
            Request Beta Access
          </a>
        </div>
      </div>
    </section>
  )
}
