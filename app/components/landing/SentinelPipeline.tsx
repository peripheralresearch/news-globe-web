'use client'

export default function SentinelPipeline() {
  return (
    <div className="w-full bg-[#091642] rounded-lg p-12">
      {/* Title */}
      <div className="text-center mb-16">
        <h3 className="text-2xl font-display tracking-wider text-[#FAD44D] mb-2">SENTINEL PIPELINE</h3>
        <p className="text-xs font-mono text-brand-warm-400">Collection → Enrichment → Output</p>
      </div>

      {/* Simple Linear Flow */}
      <div className="flex items-center justify-center gap-6">
        {/* Input */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-mono text-brand-warm-400 mb-2">INPUT</div>
          <div className="space-y-2">
            <div className="px-4 py-2 bg-[#13235C] border border-[#FAD44D]/20 rounded text-center">
              <div className="text-xs font-mono text-white">Telegram</div>
            </div>
            <div className="px-4 py-2 bg-[#13235C] border border-[#FAD44D]/20 rounded text-center">
              <div className="text-xs font-mono text-white">RSS</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-8 h-8 text-[#FAD44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Processing */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-mono text-brand-warm-400 mb-2">PROCESSING</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="px-3 py-2 bg-[#13235C] border border-[#FAD44D]/20 rounded text-center">
              <div className="text-xs font-mono text-white">NER</div>
            </div>
            <div className="px-3 py-2 bg-[#13235C] border border-[#FAD44D]/20 rounded text-center">
              <div className="text-xs font-mono text-white">Sentiment</div>
            </div>
            <div className="px-3 py-2 bg-[#13235C] border border-[#FAD44D]/20 rounded text-center">
              <div className="text-xs font-mono text-white">Clustering</div>
            </div>
            <div className="px-3 py-2 bg-[#13235C] border border-[#FAD44D]/20 rounded text-center">
              <div className="text-xs font-mono text-white">Geo</div>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <svg className="w-8 h-8 text-[#FAD44D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>

        {/* Output */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs font-mono text-brand-warm-400 mb-2">OUTPUT</div>
          <div className="px-6 py-4 bg-[#FAD44D] rounded text-center">
            <div className="text-sm font-display tracking-wide text-[#0D0D0D]">PERIPHERAL</div>
            <div className="text-xs font-mono text-[#13235C] mt-1">30K+ Stories</div>
          </div>
        </div>
      </div>
    </div>
  )
}
