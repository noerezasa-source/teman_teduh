"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Brain, Calendar, ChevronRight, Activity, Smile, Frown, Sparkles, RefreshCw } from "lucide-react"

const MOOD_META = {
  senang: { label: "Senang", emoji: "😊", color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40", val: 5 },
  tenang: { label: "Tenang", emoji: "😌", color: "text-teal-500 bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/40", val: 4 },
  netral: { label: "Netral", emoji: "😐", color: "text-slate-500 bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/40", val: 3 },
  lelah: { label: "Lelah", emoji: "🥱", color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40", val: 2 },
  marah: { label: "Marah", emoji: "😠", color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40", val: 2 },
  sedih: { label: "Sedih", emoji: "🥺", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40", val: 1 },
  cemas: { label: "Cemas", emoji: "😰", color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/40", val: 1 }
}

function getOrCreateUserId() {
  if (typeof window === "undefined") return ""
  let id = localStorage.getItem("tt_user_id")
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
    localStorage.setItem("tt_user_id", id)
  }
  return id
}

export function MoodTimeline({ onBack, isDark, toggleDark }) {
  const [history, setHistory] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    const userId = getOrCreateUserId()
    try {
      // 1. Ambil data mood history
      const resMood = await fetch(`/api/mood?userId=${userId}`)
      if (resMood.ok) {
        const data = await resMood.json()
        setHistory(data.history || [])
      }

      // 2. Ambil data profile memory card
      const resProfile = await fetch(`/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "PING", // PING query untuk load profile saja (tapi ini panggil API chat, kita buat loader tersendiri atau query dari endpoint jika ada)
          sessionId: "load-only",
          userId: userId,
          ageGroup: "15-25"
        })
      })
      // Untuk amannya, kita fetch profile langsung via client query Supabase?
      // Supabase credentials ada di client, tapi untuk modularitas kita gunakan fetch api chat dengan ping-like trigger,
      // atau kita buat endpoint mini /api/profile?userId=...
      // Mari kita query langsung lewat endpoint API /api/chat tapi intercept "PING" payload untuk mengembalikan data profil
      // itu sangat cerdik! Mari kita buat router chat mengembalikan data profil jika di-PING.
      if (resProfile.ok) {
        // Kami biarkan load profile berjalan
      }
    } catch (err) {
      console.error("Error fetching timeline data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Ambil data profil terpisah jika diakses dari Supabase client directly
  useEffect(() => {
    fetchData()

    // Query profil langsung dari Supabase di client side demi kestabilan data
    const userId = getOrCreateUserId()
    const loadProfileDirect = async () => {
      try {
        const { supabase } = await import("@/lib/db")
        const { data } = await supabase
          .from("tt_user_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()
        if (data) setProfile(data)
      } catch (err) {
        console.error("Direct profile fetch error:", err)
      }
    }
    loadProfileDirect()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Render Grafik SVG Kustom
  const renderTrendChart = () => {
    if (history.length < 2) return null

    // Urutkan data secara kronologis (dari terlama ke terbaru) untuk grafik
    const chartData = [...history].reverse()
    const width = 500
    const height = 150
    const paddingLeft = 30
    const paddingRight = 15
    const paddingTop = 20
    const paddingBottom = 20

    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    // Ambil Y koordinat (nilai mood 1 - 5)
    const points = chartData.map((item, idx) => {
      const moodInfo = MOOD_META[item.mood] || { val: 3 }
      const x = paddingLeft + (idx * (chartWidth / (chartData.length - 1)))
      // Nilai 5 di atas (height padding), nilai 1 di bawah
      const y = paddingTop + chartHeight - ((moodInfo.val - 1) * (chartHeight / 4))
      return { x, y, item, emoji: moodInfo.emoji }
    })

    // Buat SVG path string
    let pathD = ""
    points.forEach((p, idx) => {
      if (idx === 0) pathD += `M ${p.x} ${p.y}`
      else pathD += ` L ${p.x} ${p.y}`
    })

    // Buat Fill Area di bawah path
    const fillD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`

    return (
      <div className="w-full overflow-x-auto rounded-2xl bg-white dark:bg-[#111A24] border border-slate-100 dark:border-slate-800/80 p-4 shadow-sm">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#0FA57C]" />
          Visualisasi Tren Emosi
        </h3>
        <div className="min-w-[450px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0FA57C" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0FA57C" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#0FA57C" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Grid Lines horizontal */}
            {[1, 2, 3, 4, 5].map((val) => {
              const y = paddingTop + chartHeight - ((val - 1) * (chartHeight / 4))
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[9px] font-semibold fill-slate-400 dark:fill-slate-600"
                  >
                    {val === 5 ? "😊" : val === 3 ? "😐" : val === 1 ? "🥺" : ""}
                  </text>
                </g>
              )
            })}

            {/* Path Fill Area */}
            <path d={fillD} fill="url(#chartGradient)" />

            {/* Path Stroke Line */}
            <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* Data Dots */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  className="fill-white dark:fill-[#111A24] stroke-[#0FA57C] dark:stroke-[#34D399]"
                  strokeWidth="2.5"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="8"
                  className="fill-transparent hover:fill-[#0FA57C]/10 transition-colors"
                />
                {/* Tooltip simple di dalam SVG */}
                <title>
                  {`${MOOD_META[p.item.mood]?.label || p.item.mood} (${p.item.intensity})\nCatatan: ${p.item.notes || "-"}\nTanggal: ${new Date(p.item.created_at).toLocaleDateString("id-ID")}`}
                </title>
              </g>
            ))}
          </svg>
        </div>
        <p className="text-[10px] text-center text-slate-400 dark:text-slate-600 mt-2">
          Arah grafik bergerak dari kiri (terlama) ke kanan (terbaru)
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#0A0F14] text-[#1E293B] dark:text-[#F1F5F9] pb-12">
      {/* Background patterns */}
      <div className="pointer-events-none absolute inset-0 bg-dots opacity-25 dark:opacity-15" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,_#E0F5EE_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,_#0F2420_0%,_transparent_60%)]" />

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-[#F8FAFC]/90 dark:bg-[#0A0F14]/90 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#475569] dark:text-[#94A3B8] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
            aria-label="Kembali"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-[#1E293B] dark:text-[#F1F5F9]">Tren Emosiku</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Catatan & Analisis Kondisi Emosionalmu</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#475569] dark:text-[#94A3B8] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60 disabled:opacity-50"
          aria-label="Segarkan data"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <span className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#0FA57C] animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Memuat analisis emosi...</p>
          </div>
        ) : (
          <>
            {/* 1. KARTU TEDUH (Persona Memory Card) */}
            <div className="w-full rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0B1E1A] dark:to-[#091D1A] border border-emerald-100 dark:border-emerald-950/40 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-[#0FA57C]/10 text-[#0FA57C]">
                  <Brain className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  Kartu Teduhmu
                </h3>
              </div>
              
              <div className="text-xs text-emerald-800 dark:text-emerald-400/90 leading-relaxed flex flex-col gap-3">
                <div>
                  <span className="font-semibold text-emerald-950 dark:text-emerald-200">Nama Panggilan:</span>{" "}
                  {profile?.nickname || "Belum terekam (Mulailah chat agar AI dapat mengenalmu)"}
                </div>
                
                {profile?.stressors && (
                  <div>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200">Pemicu Stres (Stressors):</span>{" "}
                    {profile.stressors}
                  </div>
                )}

                {profile?.coping_mechanisms && (
                  <div>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200">Coping Mechanism:</span>{" "}
                    {profile.coping_mechanisms}
                  </div>
                )}

                {profile?.important_relationships && (
                  <div>
                    <span className="font-semibold text-emerald-950 dark:text-emerald-200">Relasi Penting:</span>{" "}
                    {profile.important_relationships}
                  </div>
                )}
                
                {!profile && (
                  <p className="italic text-emerald-700/60 dark:text-emerald-600">
                    * AI akan mengekstrak ingatan jangka panjang dari curhatanmu secara otomatis untuk mengisi kartu ini.
                  </p>
                )}
              </div>
            </div>

            {/* 2. GRAFIK TREN */}
            {history.length >= 2 ? (
              renderTrendChart()
            ) : (
              history.length === 1 && (
                <div className="rounded-2xl bg-white dark:bg-[#111A24] border border-slate-100 dark:border-slate-800/80 p-5 text-center text-xs text-slate-500 dark:text-slate-400">
                  Grafik tren emosi membutuhkan minimal 2 rekaman emosi. Obrolanmu yang pertama baru terekam!
                </div>
              )
            )}

            {/* 3. LOG LIST TIMELINE */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0FA57C]" />
                Riwayat Catatan Emosi
              </h3>

              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-[#111A24]/30 px-6 py-12 text-center">
                  <Frown className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-2.5" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Belum ada catatan emosi</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                    Setiap kali kamu mengobrol dengan TemanTeduh, emosimu akan dianalisis dan dicatat di sini secara otomatis.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {history.map((log) => {
                    const meta = MOOD_META[log.mood] || { label: log.mood, emoji: "💬", color: "text-slate-500 bg-slate-50 border-slate-200" }
                    return (
                      <div
                        key={log.id}
                        className="flex gap-3 items-start bg-white dark:bg-[#111A24] border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm"
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg ${meta.color}`}>
                          {meta.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start flex-wrap gap-1">
                            <div>
                              <p className="text-sm font-bold">{meta.label}</p>
                              <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                                Intensitas: {log.intensity}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {new Date(log.created_at).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-450 mt-2 leading-relaxed bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-50 dark:border-slate-900/50">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
