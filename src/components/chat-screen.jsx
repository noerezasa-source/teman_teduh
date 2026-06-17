"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Trash2, Heart, AlertTriangle, Moon, Sun, X, AlertCircle, Activity } from "lucide-react"
import { CrisisModal } from "./landing-screen"

// ─── Welcome messages ────────────────────────────────────────────────────────

function getWelcomeMessage(mood) {
  const map = {
    sad: "Duh, gw paham bgt kok rasanya sedih kayak gini... 🥺 Gpp, luapin aja semua hari ini. Sini, cerita ke gw apa sih yg lagi bikin hati lu berat bgt?",
    anxious: "Rasa cemas tuh emang capek bgt ya... 😔 Tarik napas pelan-pelan dulu yuk, rileks. Gw di sini nemenin lu kok. Apa yg lagi lu khawatirin nih?",
    overthinking: "Isi kepala lu lagi rame bgt ya? Pikiran berputar terus emang bikin capek bgt. Yuk kita urai pelan-pelan bareng. Cerita aja apa yg paling sering lewat di pikiran lu akhir-akhir ini?",
    angry: "Gpp kok kalo lu kesel atau marah hari ini. Semua emosi lu tuh valid bgt. Keluarin aja semuanya di sini, gw dengerin beneran. Ada apa sih?",
    tired: "Lu udah keren bgt lho bisa bertahan sampe detik ini. Istirahat bentar di sini yaa, kita chill dulu. Cerita dong, apa sih yg bikin lu ngerasa se-lelah ini?",
  }
  return map[mood?.id] || "Halo! Gw TemanTeduh, temen curhat lu. Sini cerita apa aja yg lagi mengganjal di hati lu, gw siap dengerin kok 💬❤️"
}

const QUICK_REPLIES = {
  sad: ["Lagi ngerasa sepi bgt nih", "Kek ga ada yg ngertiin gw", "Pengen numpahin unek-unek..."],
  anxious: ["Lagi kepikiran terus", "Tiba-tiba takut tapi gatau kenapa", "Bantu gw biar tenang dong"],
  overthinking: ["Kepala gw lagi berisik bgt", "Gimana ya cara stop overthinking?", "Butuh temen ngobrol"],
  angry: ["Kesel bgt sama seseorang", "Mau numpahin emosi di sini", "Boleh cerita ga sih?"],
  tired: ["Aslinya capek bgt...", "Pengen nyerah aja rasanya", "Butuh penyemangat nih"],
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

// ─── Markdown renderer ───────────────────────────────────────────────────────

function parseInline(text) {
  const parts = []
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g
  let lastIndex = 0
  let match
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      parts.push(<strong key={match.index} className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      parts.push(<em key={match.index}>{match[2]}</em>)
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function renderMarkdown(text) {
  if (!text) return null
  const lines = text.split("\n")
  const blocks = []
  let listItems = []
  let listType = null
  let key = 0

  const flushList = () => {
    if (listItems.length === 0) return
    if (listType === "number") {
      blocks.push(
        <ol key={`ol-${key++}`} className="my-2 space-y-1.5 pl-1 list-none">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0FA57C]/10 dark:bg-[#0FA57C]/20 text-[10px] font-bold text-[#0FA57C] dark:text-[#34D399]">
                {i + 1}
              </span>
              <span className="leading-relaxed">{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      )
    } else {
      blocks.push(
        <ul key={`ul-${key++}`} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0FA57C] dark:bg-[#34D399]" />
              <span className="leading-relaxed">{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      )
    }
    listItems = []
    listType = null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "") { flushList(); continue }
    const bulletMatch = trimmed.match(/^[*\-]\s+(.+)/)
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)/)
    if (bulletMatch) {
      if (listType === "number") flushList()
      listType = "bullet"
      listItems.push(bulletMatch[1])
    } else if (numberMatch) {
      if (listType === "bullet") flushList()
      listType = "number"
      listItems.push(numberMatch[2])
    } else {
      flushList()
      blocks.push(<p key={`p-${key++}`} className="leading-relaxed">{parseInline(trimmed)}</p>)
    }
  }
  flushList()
  return blocks
}

// ─── Confirm-end modal ───────────────────────────────────────────────────────

function ConfirmEndModal({ onConfirm, onCancel }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white dark:bg-[#111A24] p-6 shadow-2xl shadow-black/10"
        style={{ width: "calc(100% - 2rem)", maxWidth: "22rem" }}
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF1F2] dark:bg-[#3A1818]">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <h3 className="text-base font-bold text-[#1E293B] dark:text-[#F1F5F9]">Mau hapus chat ini?</h3>
          <p className="text-sm text-[#475569] dark:text-[#94A3B8] leading-relaxed">
            Semua chat bakal terhapus permanen. Obrolan kita 100% anonim dan ga pernah disimpan kok.
          </p>
          <div className="flex w-full gap-3 mt-1">
            <button type="button" onClick={onCancel}
              className="flex-1 rounded-full border border-slate-100 dark:border-slate-800/80 py-2.5 text-sm font-medium text-[#475569] dark:text-[#94A3B8] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60">
              Nggak deh
            </button>
            <button type="button" onClick={onConfirm}
              className="flex-1 rounded-full bg-[#E8A0A0] dark:bg-[#6B3030] py-2.5 text-sm font-medium text-[#5A2A2A] dark:text-[#F2C4C4] transition-colors hover:bg-[#E08E8E] dark:hover:bg-[#7A3838]">
              Iya, hapus
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Crisis alert banner ─────────────────────────────────────────────────────

function CrisisAlertBanner({ onOpenModal, onDismiss }) {
  return (
    <div className="border-b border-[#F5C4C4] dark:border-[#5A2A2A] bg-[#FFF0F0] dark:bg-[#1E0F0F] px-4 py-3 msg-enter">
      <div className="mx-auto flex max-w-2xl items-start gap-3">
        <Heart className="mt-0.5 h-5 w-5 shrink-0 text-[#C05050] dark:text-[#E88080]" fill="currentColor" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#8A3030] dark:text-[#F0B0B0]">
            Aku di sini bersamamu, apapun yang kamu rasakan.
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#A05050] dark:text-[#C08080]">
            Ada bantuan profesional yang siap mendengarkanmu 24 jam. Kamu tidak perlu menghadapinya sendirian.
          </p>
          <button
            type="button"
            onClick={onOpenModal}
            className="mt-1.5 text-xs font-semibold text-[#C05050] dark:text-[#E88080] underline underline-offset-2 hover:no-underline"
          >
            Lihat Kontak Bantuan Darurat →
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup banner"
          className="shrink-0 rounded-full p-1 text-[#A05050] dark:text-[#C08080] transition-colors hover:bg-[#FADADD] dark:hover:bg-[#3A1515]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── ChatScreen ──────────────────────────────────────────────────────────────

export function ChatScreen({ mood, onEnd, onViewTimeline, isDark, toggleDark, mounted }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: getWelcomeMessage(mood) },
  ])
  const [input, setInput] = useState("")
  const [selectedAge, setSelectedAge] = useState("15-25")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmEnd, setShowConfirmEnd] = useState(false)
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  const [showCrisisModal, setShowCrisisModal] = useState(false)
  const [sessionId] = useState(() => {
    if (typeof window === "undefined") return ""
    return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
  })
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
    el.style.overflowY = el.scrollHeight > 120 ? "auto" : "hidden"
  }, [])

  useEffect(() => { adjustHeight() }, [input, adjustHeight])

  const handleSend = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || isLoading) return

    const riwayat = messages
    const userMessage = { id: Date.now(), sender: "user", text }
    const aiPlaceholderId = Date.now() + 1

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
    setIsLoading(true)

    let placeholderAdded = false

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          userId: getOrCreateUserId(),
          ageGroup: selectedAge
        }),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      // Check content-type to see if it is a JSON response (like crisis block)
      const contentType = response.headers.get("Content-Type")
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json()
        if (json.isCrisis) {
          setShowCrisisAlert(true)
          setMessages((prev) => [...prev, { id: Date.now(), sender: "ai", text: json.responseText }])
          setIsLoading(false)
          return
        }
      }

      // Cek crisis flag dari response header
      const isCrisis = response.headers.get("X-Crisis-Detected") === "true"
      if (isCrisis) setShowCrisisAlert(true)

      // Tambah placeholder AI message kosong — loading dots tampil di dalamnya
      setMessages((prev) => [...prev, { id: aiPlaceholderId, sender: "ai", text: "" }])
      placeholderAdded = true

      // Baca stream chunk-by-chunk
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiPlaceholderId ? { ...msg, text: fullText } : msg
          )
        )
      }

      // Fallback jika stream kosong
      if (!fullText) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiPlaceholderId
              ? { ...msg, text: "Maaf, ada gangguan kecil. Boleh cerita lagi?" }
              : msg
          )
        )
      }

    } catch (error) {
      console.error(error)
      const errMsg = { id: Date.now() + 2, sender: "ai", text: "Maaf, koneksi saya terputus sejenak. Bisa tolong ulangi lagi? Saya tetap di sini mendengarkan. 🍃" }
      if (placeholderAdded) {
        setMessages((prev) => prev.map((msg) => msg.id === aiPlaceholderId ? errMsg : msg))
      } else {
        setMessages((prev) => [...prev, errMsg])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    handleSend()
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickReplies = QUICK_REPLIES[mood?.id] || []
  const showQuickReplies = messages.length === 1 && !isLoading
  // Loading dots muncul hanya sebelum placeholder AI ditambahkan
  const showLoadingDots = isLoading && messages[messages.length - 1]?.sender === "user"

  return (
    <>
      <div className="relative flex min-h-screen flex-col bg-[#F8FAFC] dark:bg-[#0A0F14] text-[#1E293B] dark:text-[#F1F5F9]">
        {/* Dot pattern + radial gradient */}
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-25 dark:opacity-15" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,_#E0F5EE_0%,_transparent_60%)] dark:bg-[radial-gradient(ellipse_100%_50%_at_50%_0%,_#0F2420_0%,_transparent_60%)]" />

        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 bg-[#F8FAFC]/90 dark:bg-[#0A0F14]/90 px-4 py-3 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden animate-floating shadow-sm shadow-emerald-500/10">
              <img src="/logo.png" alt="TemanTeduh Logo" className="h-full w-full object-cover scale-[1.4]" />
              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-[#0A0F14] bg-[#5CB85C] z-10" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold">TemanTeduh</p>
                {mood && (
                  <span className="rounded-full bg-[#E0F5EE] dark:bg-[#0F2D24] px-2 py-0.5 text-[10px] font-semibold text-[#0D9488] dark:text-[#34D399]">
                    {mood.emoji} {mood.label}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {isLoading ? "Lagi ngetik..." : "Temen Curhat · Aktif"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Crisis button */}
            <button
              type="button"
              onClick={() => setShowCrisisModal(true)}
              aria-label="Bantuan darurat"
              className="flex h-9 w-9 items-center justify-center rounded-full text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <AlertCircle className="h-4 w-4" />
            </button>
            {/* Tren Emosiku button */}
            <button
              type="button"
              onClick={onViewTimeline}
              title="Lihat Tren Emosiku"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#0FA57C] dark:text-[#34D399] transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
            >
              <Activity className="h-4.5 w-4.5" />
            </button>
            {/* Dark mode toggle */}
            {mounted && (
              <button
                type="button"
                onClick={toggleDark}
                aria-label={isDark ? "Mode terang" : "Mode gelap"}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#475569] dark:text-[#94A3B8] transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            )}
            {/* End chat button */}
            <button
              type="button"
              onClick={() => setShowConfirmEnd(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Selesai &amp; Hapus Chat</span>
            </button>
          </div>
        </header>

        {/* Crisis alert banner */}
        {showCrisisAlert && (
          <CrisisAlertBanner
            onOpenModal={() => setShowCrisisModal(true)}
            onDismiss={() => setShowCrisisAlert(false)}
          />
        )}

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <div className="mx-auto flex max-w-2xl flex-col space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex msg-enter ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "user" ? (
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#0FA57C] dark:bg-[#0D8F6B] px-4.5 py-3 text-sm text-white shadow-sm shadow-[#0FA57C]/10">
                    <span className="whitespace-pre-line leading-relaxed break-words">{msg.text}</span>
                  </div>
                ) : (
                  /* AI bubble dengan avatar */
                  <div className="flex items-start gap-2.5 w-full max-w-[92%] sm:max-w-[82%]">
                    {/* Avatar TemanTeduh */}
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm">
                      <img src="/logo.png" alt="TemanTeduh" className="h-full w-full object-cover scale-[1.4]" />
                    </div>
                    {/* Bubble konten */}
                    <div className="flex-1 rounded-2xl rounded-tl-md bg-white dark:bg-[#111A24] px-5 py-3 text-sm text-[#1E293B] dark:text-[#E2E8F0] shadow-sm dark:shadow-black/20">
                      {/* Loading dots tampil di dalam bubble saat teks masih kosong */}
                      {msg.text === "" && isLoading ? (
                        <div className="flex items-center gap-1.5 py-0.5">
                          <span className="h-2 w-2 rounded-full bg-[#0FA57C] dark:bg-[#34D399] opacity-60 animate-bounce [animation-delay:0ms]" />
                          <span className="h-2 w-2 rounded-full bg-[#0FA57C] dark:bg-[#34D399] opacity-60 animate-bounce [animation-delay:150ms]" />
                          <span className="h-2 w-2 rounded-full bg-[#0FA57C] dark:bg-[#34D399] opacity-60 animate-bounce [animation-delay:300ms]" />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5" style={{ hyphens: "none", overflowWrap: "break-word", wordBreak: "break-word" }}>
                          {renderMarkdown(msg.text)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Quick reply chips */}
            {showQuickReplies && quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-2 msg-enter justify-start pl-10">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleSend(reply)}
                    className="rounded-full border border-transparent bg-white/80 dark:bg-[#111A24]/60 px-4 py-2 text-xs font-semibold text-[#0FA57C] dark:text-[#34D399] shadow-sm transition-all duration-200 hover:bg-[#E0F5EE] dark:hover:bg-[#0F2D24] hover:shadow-md"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Loading dots (dengan avatar) sebelum placeholder AI ditambahkan */}
            {showLoadingDots && (
              <div className="flex justify-start msg-enter">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden shadow-sm">
                    <img src="/logo.png" alt="TemanTeduh" className="h-full w-full object-cover scale-[1.4]" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-3xl rounded-tl-md bg-white dark:bg-[#111A24] px-5 py-4 shadow-sm dark:shadow-black/10">
                    <span className="h-2 w-2 rounded-full bg-[#0FA57C] dark:bg-[#34D399] opacity-60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-[#0FA57C] dark:bg-[#34D399] opacity-60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-[#0FA57C] dark:bg-[#34D399] opacity-60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input area */}
        <div className="sticky bottom-0">
          <div className="h-6 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0A0F14] to-transparent" />
          <div className="bg-[#F8FAFC] dark:bg-[#0A0F14] px-4 pb-5 pt-0 md:px-6">
            <form
              onSubmit={handleFormSubmit}
              className="mx-auto flex flex-col max-w-2xl rounded-3xl bg-white dark:bg-[#111A24] p-3 pb-2 shadow-lg shadow-[#0FA57C]/5 dark:shadow-black/40 border border-slate-100 dark:border-slate-800/80"
            >
              {/* Text Area on its own row for full width */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={isLoading ? "Lagi mikir bentar ya..." : "Tumpahin curhatan atau perasaanmu di sini..."}
                className="w-full resize-none bg-transparent px-2 py-1 text-sm text-[#1E293B] dark:text-[#E2E8F0] outline-none placeholder:text-[#94A3B8] dark:placeholder:text-[#475569] disabled:opacity-50 overflow-hidden"
                style={{ maxHeight: "120px", lineHeight: "1.5" }}
              />

              {/* Action Toolbar Row at the bottom */}
              <div className="flex items-center justify-between px-2 mt-1.5 pt-1.5 border-t border-slate-100/50 dark:border-slate-800/40">
                {/* Left side: Age selector */}
                <div className="flex items-center">
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    aria-label="Pilih kelompok usia"
                    className="bg-transparent border-none outline-none text-xs font-semibold text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer focus:ring-0 focus:outline-none p-0 pr-5"
                    style={{
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2.5' d='M19 9l-7 7-7-7'/></svg>")`,
                      backgroundPosition: "right 2px center",
                      backgroundSize: "10px",
                      backgroundRepeat: "no-repeat"
                    }}
                  >
                    <option value="10-14" className="bg-white dark:bg-[#111A24] text-neutral-800 dark:text-neutral-200">Usia 10-14</option>
                    <option value="15-25" className="bg-white dark:bg-[#111A24] text-neutral-800 dark:text-neutral-200">Usia 15-25</option>
                    <option value="26-35" className="bg-white dark:bg-[#111A24] text-neutral-800 dark:text-neutral-200">Usia 26-35</option>
                  </select>
                </div>

                {/* Right side: Send button */}
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  aria-label="Kirim pesan"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0FA57C] dark:bg-[#0D8F6B] text-white transition-colors hover:bg-[#0D8F6B] dark:hover:bg-[#0B7D5D] disabled:bg-gray-100 dark:disabled:bg-slate-850"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
            <p className="mt-2 text-center text-[10px] text-[#94A3B8] dark:text-[#475569]">
              Enter buat kirim &nbsp;·&nbsp; Shift+Enter buat baris baru
            </p>
          </div>
        </div>
      </div>

      {showConfirmEnd && (
        <ConfirmEndModal onConfirm={onEnd} onCancel={() => setShowConfirmEnd(false)} />
      )}
      {showCrisisModal && (
        <CrisisModal onClose={() => setShowCrisisModal(false)} />
      )}
    </>
  )
}