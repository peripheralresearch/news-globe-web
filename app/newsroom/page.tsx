import type { Metadata } from 'next'
import { FrontPageTabloid } from './_components/templates/FrontPageTabloid'

export const metadata: Metadata = {
  title: 'Newsroom',
  description: 'Today’s front page.',
  openGraph: {
    title: 'Newsroom',
    description: 'Today’s front page.',
    images: ['/images/newspaper/sample-market.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Newsroom',
    description: 'Today’s front page.',
    images: ['/images/newspaper/sample-market.svg'],
  },
}

export default function NewsroomPage() {
  return (
    <div className="min-h-screen bg-neutral-50 p-2 sm:p-6">
      <FrontPageTabloid />
    </div>
  )
}
