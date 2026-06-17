"use client"

import { ArrowLeft, ArrowRight, Moon, Sun } from "lucide-react"

// Setiap mood mendapat palet warna unik: border, bg hover, dan bg aktif
const MOODS = [
  {
    id: "sad",
    emoji: "😢",
    label: "Sedih",
    hover: "hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-100/30 dark:hover:bg-blue-950/20",
    active: "bg-blue-50/80 dark:bg-blue-950/40 ring-2 ring-blue-300 dark:ring-blue-800 shadow-md shadow-blue-100/50 dark:shadow-none",
    emoji_bg: "bg-blue-100/50 dark:bg-blue-900/20",
  },
  {
    id: "anxious",
    emoji: "😰",
    label: "Cemas",
    hover: "hover:bg-amber-50/50 hover:shadow-md hover:shadow-amber-100/30 dark:hover:bg-amber-950/20",
    active: "bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-300 dark:ring-amber-800 shadow-md shadow-amber-100/50 dark:shadow-none",
    emoji_bg: "bg-amber-100/50 dark:bg-amber-900/20",
  },
  {
    id: "overthinking",
    emoji: "🤯",
    label: "Overthinking",
    hover: "hover:bg-violet-50/50 hover:shadow-md hover:shadow-violet-100/30 dark:hover:bg-violet-950/20",
    active: "bg-violet-50/80 dark:bg-violet-950/40 ring-2 ring-violet-300 dark:ring-violet-800 shadow-md shadow-violet-100/50 dark:shadow-none",
    emoji_bg: "bg-violet-100/50 dark:bg-violet-900/20",
  },
  {
    id: "angry",
    emoji: "😡",
    label: "Marah",
    hover: "hover:bg-rose-50/50 hover:shadow-md hover:shadow-rose-100/30 dark:hover:bg-rose-950/20",
    active: "bg-rose-50/80 dark:bg-rose-950/40 ring-2 ring-rose-300 dark:ring-rose-800 shadow-md shadow-rose-100/50 dark:shadow-none",
    emoji_bg: "bg-rose-100/50 dark:bg-rose-900/20",
  },
  {
    id: "tired",
    emoji: "😴",
    label: "Lelah",
    hover: "hover:bg-purple-50/50 hover:shadow-md hover:shadow-purple-100/30 dark:hover:bg-purple-950/20",
    active: "bg-purple-50/80 dark:bg-purple-950/40 ring-2 ring-purple-300 dark:ring-purple-800 shadow-md shadow-purple-100/50 dark:shadow-none",
    emoji_bg: "bg-purple-100/50 dark:bg-purple-900/20",
  },
]

const FLOAT_DELAYS = ["", "delay-200", "delay-400", "", "delay-200"]

export function MoodScreen({ selectedMood, onSelectMood, onContinue, onBack, isDark, toggleDark, mounted }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#0A0F14] text-[#1E293B] dark:text-[#F1F5F9]">
      {/* Dot pattern background - extremely subtle for premium feel */}
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-25 dark:opacity-15" />
      
      <header className="z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-[#475569] dark:text-[#94A3B8] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
        {mounted && (
          <button
            type="button"
            onClick={toggleDark}
            aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#475569] dark:text-[#94A3B8] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
      </header>

      <main className="z-10 flex flex-1 flex-col items-center justify-center px-6 py-8 md:py-16">
        <div className="max-w-xl text-center mb-10">
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-4xl text-[#1E293B] dark:text-[#F1F5F9]">
            Lagi ngerasa gimana sekarang?
          </h1>
          <p className="text-sm md:text-base text-[#475569] dark:text-[#94A3B8]">
            Pilih mood kamu saat ini biar kita bisa ngobrol lebih nyambung.
          </p>
        </div>

        {/* 
          Flex-based wrap layout:
          Every card has identical width (w-[calc(50%-8px)] on mobile, w-40 on sm+).
          The last card centers naturally and is the exact same size as the others.
        */}
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-xl sm:max-w-2xl px-2">
          {MOODS.map((mood, index) => {
            const isActive = selectedMood?.id === mood.id
            const delayClass = FLOAT_DELAYS[index] ?? ""

            return (
              <button
                key={mood.id}
                type="button"
                onClick={() => onSelectMood(mood)}
                className={[
                  "mood-card-enter group flex flex-col items-center justify-center gap-3 rounded-2xl p-5",
                  "w-[calc(50%-8px)] sm:w-36 md:w-40 aspect-[1/1.05] transition-all duration-300",
                  "border border-slate-100 dark:border-slate-800/80",
                  isActive
                    ? mood.active
                    : `bg-white dark:bg-[#111A24]/90 ${mood.hover} hover:border-transparent dark:hover:border-transparent shadow-sm hover:translate-y-[-2px]`,
                ].join(" ")}
              >
                {/* Emoji container */}
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl transition-all duration-300 animate-floating ${delayClass} ${
                    isActive ? mood.emoji_bg : "bg-gray-50 dark:bg-black/10 group-hover:scale-105"
                  }`}
                  aria-hidden="true"
                >
                  {mood.emoji}
                </div>
                <span className="text-sm font-semibold tracking-wide text-[#1E293B] dark:text-[#E2E8F0] mt-1">
                  {mood.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="h-24 flex items-center justify-center">
          {selectedMood && (
            <button
              type="button"
              onClick={onContinue}
              className="msg-enter inline-flex items-center gap-2 rounded-full bg-[#0FA57C] px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-[#0FA57C]/15 transition-all duration-300 hover:bg-[#0D8F6B] hover:translate-y-[-1px] hover:shadow-xl hover:shadow-[#0FA57C]/20"
            >
              Yuk, Masuk ke Ruang Cerita
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
