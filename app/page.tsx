import {
  Navigation,
  NewsTicker,
  Hero,
  HowItWorks,
  ForProfessionals,
  StatsBanner,
  Footer,
} from '@/app/components/landing'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-black">
      <Navigation />
      <NewsTicker />
      <Hero />
      <HowItWorks />
      <ForProfessionals />
      <StatsBanner />
      <Footer />
    </main>
  )
}
