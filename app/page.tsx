import Link from 'next/link'
import Image from 'next/image'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white text-black dark:bg-black dark:text-white">

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6">

        {/* Logo: black on light, white on dark */}
        <Image
          src="/icons/peripheral.png"
          alt="The Peripheral"
          width={420}
          height={420}
          className="mb-12 block dark:hidden"
          priority
        />
        <Image
          src="/icons/peripheral-white.png"
          alt="The Peripheral"
          width={420}
          height={420}
          className="mb-12 hidden dark:block"
          priority
        />

        <h1 className="text-5xl sm:text-6xl font-light tracking-tight mb-4">
          The Peripheral
        </h1>

        <p className="text-neutral-500 dark:text-neutral-400 text-lg sm:text-xl max-w-md text-center leading-relaxed mb-12">
          From noise to knowledge.
        </p>

        <Link
          href="/map"
          className="border border-neutral-300 dark:border-neutral-700 text-sm tracking-wide px-8 py-3 rounded-full hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300"
        >
          Open the Globe
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-900 px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-400 dark:text-neutral-500 text-xs tracking-wide">
          <span>&copy; {new Date().getFullYear()} The Peripheral</span>

          <div className="flex gap-6">
            <a href="mailto:hello@theperipheral.org" className="hover:text-black dark:hover:text-white transition-colors">
              hello@theperipheral.org
            </a>
            <a href="mailto:support@theperipheral.org" className="hover:text-black dark:hover:text-white transition-colors">
              support@theperipheral.org
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
