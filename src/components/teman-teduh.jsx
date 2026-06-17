"use client"

import { useState, useEffect } from "react"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { LandingScreen } from "./landing-screen"
import { MoodScreen } from "./mood-screen"
import { ChatScreen } from "./chat-screen"
import { MoodTimeline } from "./mood-timeline"

export function TemanTeduh() {
  const [page, setPage] = useState("landing")
  const [mood, setMood] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState("")
  const { isDark, toggle: toggleDark, mounted } = useDarkMode()

  // Hydrate state from localStorage on client mount (avoids Next.js SSR hydration mismatch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPage = localStorage.getItem("tt_page_state")
      const savedMood = localStorage.getItem("tt_selected_mood")
      const savedSessionId = localStorage.getItem("tt_active_session_id")

      if (savedPage) setPage(savedPage)
      if (savedMood) setMood(JSON.parse(savedMood))
      if (savedSessionId) setActiveSessionId(savedSessionId)
    }
  }, [])

  const handleSetPage = (newPage) => {
    setPage(newPage)
    if (typeof window !== "undefined") {
      localStorage.setItem("tt_page_state", newPage)
    }
  }

  const handleSetMood = (newMood) => {
    setMood(newMood)
    if (typeof window !== "undefined") {
      if (newMood) {
        localStorage.setItem("tt_selected_mood", JSON.stringify(newMood))
      } else {
        localStorage.removeItem("tt_selected_mood")
      }
    }
  }

  const handleSetActiveSessionId = (newSessionId) => {
    setActiveSessionId(newSessionId)
    if (typeof window !== "undefined") {
      if (newSessionId) {
        localStorage.setItem("tt_active_session_id", newSessionId)
      } else {
        localStorage.removeItem("tt_active_session_id")
      }
    }
  }

  const handleEndChat = async () => {
    const sessionIdToDelete = activeSessionId
    // Clear state immediately for best UX responsiveness
    handleSetMood(null)
    handleSetActiveSessionId("")
    handleSetPage("landing")

    if (sessionIdToDelete) {
      try {
        const { supabase } = await import("@/lib/db")
        await supabase.from("tt_chat_messages").delete().eq("session_id", sessionIdToDelete)
      } catch (err) {
        console.error("Failed to delete chat session:", err)
      }
    }
  }

  const darkProps = { isDark, toggleDark, mounted }

  if (page === "mood") {
    return (
      <MoodScreen
        selectedMood={mood}
        onSelectMood={handleSetMood}
        onContinue={() => {
          const newSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
          handleSetActiveSessionId(newSessionId)
          handleSetPage("chat")
        }}
        onBack={() => handleSetPage("landing")}
        {...darkProps}
      />
    )
  }

  if (page === "chat") {
    return (
      <ChatScreen 
        mood={mood} 
        sessionId={activeSessionId}
        onEnd={handleEndChat} 
        onViewTimeline={() => handleSetPage("timeline")} 
        {...darkProps} 
      />
    )
  }

  if (page === "timeline") {
    return (
      <MoodTimeline 
        onBack={() => handleSetPage("landing")} 
        {...darkProps} 
      />
    )
  }

  return (
    <LandingScreen 
      onStart={() => handleSetPage("mood")} 
      onViewTimeline={() => handleSetPage("timeline")}
      {...darkProps} 
    />
  )
}
