"use client"

import { useState } from "react"
import { Lock, ArrowRight, AlertCircle, X, Phone, MessageCircle, Globe, ChevronRight, Moon, Sun } from "lucide-react"

export const CRISIS_CONTACTS = [
  {
    name: "Into The Light Indonesia",
    description: "Hotline kesehatan mental nasional",
    contact: "119 ext. 8",
    type: "phone",
    href: "tel:119",
    color: "#0FA57C",
    bg: "#E6F7F2",
  },
  {
    name: "Yayasan Pulih",
    description: "Konseling & dukungan psikologis",
    contact: "(021) 788-42580",
    type: "phone",
    href: "tel:0217884258",
    color: "#6B5B4A",
    bg: "#EDE8E3",
  },
  {
    name: "Hotline Kemenkes RI",
    description: "Layanan kesehatan jiwa pemerintah",
    contact: "1500-454",
    type: "phone",
    href: "tel:1500454",
    color: "#0284C7",
    bg: "#E0F2FE",
  },
  {
    name: "Into The Light (Chat)",
    description: "Konseling via website resmi",
    contact: "intothelightid.org",
    type: "web",
    href: "https://www.intothelightid.org",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
]

export function CrisisModal({ onClose }) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crisis-modal-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white dark:bg-[#111A24] shadow-2xl shadow-black/10 dark:shadow-black/50 overflow-hidden"
        style={{ width: "calc(100% - 2rem)" }}
      >
        <div className="bg-[#FFF1F2] dark:bg-[#2A181A] px-6 pt-6 pb-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E08E8E] dark:bg-[#6B3030]">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 id="crisis-modal-title" className="text-base font-bold text-[#5A2A2A] dark:text-[#F2C4C4]">
                  Bantuan Segera
                </h2>
                <p className="text-xs text-[#8A5A5A] dark:text-[#B88A8A] mt-0.5">
                  Kamu tidak sendirian. Ada yang peduli.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8A5A5A] dark:text-[#B88A8A] transition-colors hover:bg-[#E8C8C8] dark:hover:bg-[#3A1A1A]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] mb-4 leading-relaxed">
            Jika kamu atau seseorang yang kamu kenal sedang dalam kondisi krisis,
            hubungi salah satu layanan di bawah ini sekarang:
          </p>

          <div className="flex flex-col gap-3">
            {CRISIS_CONTACTS.map((item) => (
              <a
                key={item.name}
                href={item.href}
                target={item.type === "web" ? "_blank" : undefined}
                rel={item.type === "web" ? "noopener noreferrer" : undefined}
                className="group flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-transparent dark:hover:bg-slate-800/40 p-3.5 transition-all duration-150 hover:border-transparent hover:shadow-md"
                style={{ "--hover-bg": item.bg }}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: item.bg }}
                >
                  {item.type === "phone" ? (
                    <Phone className="h-4 w-4" style={{ color: item.color }} />
                  ) : item.type === "chat" ? (
                    <MessageCircle className="h-4 w-4" style={{ color: item.color }} />
                  ) : (
                    <Globe className="h-4 w-4" style={{ color: item.color }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1E293B] dark:text-[#E2E8F0] truncate">{item.name}</p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] truncate">{item.description}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-bold" style={{ color: item.color }}>
                    {item.contact}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5" style={{ color: item.color }} />
                </div>
              </a>
            ))}
          </div>

          <p className="mt-5 text-center text-xs text-[#94A3B8] dark:text-[#475569] leading-relaxed">
            Semua layanan di atas gratis & tersedia 24 jam.
            <br />
            Meminta bantuan adalah tanda keberanian, bukan kelemahan.
          </p>
        </div>
      </div>
    </>
  )
}

export function LandingScreen({ onStart, onViewTimeline, isDark, toggleDark, mounted }) {
  const [showCrisis, setShowCrisis] = useState(false)

  return (
    <>
      <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#0A0F14] text-[#1E293B] dark:text-[#F1F5F9]">
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-25 dark:opacity-15" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_#E0F5EE_0%,_#F1F5F9_50%,_transparent_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_#0F2420_0%,_#0A0F14_80%,_transparent_100%)]" />

        <header className="z-10 flex items-center justify-between px-6 py-5 md:px-12">
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden animate-floating shadow-sm shadow-emerald-500/10">
              <img src="/logo.png" alt="TemanTeduh Logo" className="h-full w-full object-cover scale-[1.4]" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              TemanTeduh<span className="text-[#0FA57C]">.ai</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              type="button"
              onClick={() => setShowCrisis(true)}
              className="flex items-center gap-2 rounded-full bg-rose-100 dark:bg-[#3B1E22] px-4 py-2 text-sm font-semibold text-rose-700 dark:text-rose-300 transition-colors hover:bg-rose-200 dark:hover:bg-[#4E2429]"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Butuh Bantuan Segera?</span>
              <span className="sm:hidden">Darurat</span>
            </button>
          </div>
        </header>

        <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-16 pb-28 text-center z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#E0F5EE] dark:bg-[#0F2D24] px-4 py-1.5 text-sm font-medium text-[#0D9488] dark:text-[#34D399]">
            <Lock className="h-3.5 w-3.5" />
            100% Anonim &middot; Tanpa Registrasi
          </div>

          <h1 className="max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight md:text-5xl text-[#1E293B] dark:text-[#F1F5F9]">
            Teman Cerita Tanpa Menghakimi.
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-2 rounded-full bg-[#0FA57C] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-[#0FA57C]/15 transition-all duration-300 hover:bg-[#0D8F6B] hover:translate-y-[-1px] hover:shadow-xl hover:shadow-[#0FA57C]/20"
            >
              Mulai Cerita Sekarang
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onViewTimeline}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 px-6 py-4 text-base font-semibold text-[#475569] dark:text-[#94A3B8] transition-all duration-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-800 dark:hover:text-slate-200 shadow-md hover:shadow-lg"
            >
              Lihat Tren Emosiku
            </button>
          </div>
        </main>

        <footer className="absolute bottom-6 left-0 right-0 px-6 text-center z-10">
          <p className="text-xs text-[#64748B] dark:text-[#475569] leading-relaxed italic">
            *Catatan: TemanTeduh adalah asisten berbasis AI.*
          </p>
        </footer>
      </div>

      {showCrisis && <CrisisModal onClose={() => setShowCrisis(false)} />}
    </>
  )
}
