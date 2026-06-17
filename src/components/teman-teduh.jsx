"use client"

import { useState } from "react"
import { useDarkMode } from "@/hooks/use-dark-mode"
import { LandingScreen } from "./landing-screen"
import { MoodScreen } from "./mood-screen"
import { ChatScreen } from "./chat-screen"
import { MoodTimeline } from "./mood-timeline"

export function TemanTeduh() {
  const [page, setPage] = useState("landing")
  const [mood, setMood] = useState(null)
  const { isDark, toggle: toggleDark, mounted } = useDarkMode()

  const handleEndChat = () => {
    setMood(null)
    setPage("landing")
  }

  const darkProps = { isDark, toggleDark, mounted }

  if (page === "mood") {
    return (
      <MoodScreen
        selectedMood={mood}
        onSelectMood={setMood}
        onContinue={() => setPage("chat")}
        onBack={() => setPage("landing")}
        {...darkProps}
      />
    )
  }

  if (page === "chat") {
    return (
      <ChatScreen 
        mood={mood} 
        onEnd={handleEndChat} 
        onViewTimeline={() => setPage("timeline")} 
        {...darkProps} 
      />
    )
  }

  if (page === "timeline") {
    return (
      <MoodTimeline 
        onBack={() => setPage("landing")} 
        {...darkProps} 
      />
    )
  }

  return (
    <LandingScreen 
      onStart={() => setPage("mood")} 
      onViewTimeline={() => setPage("timeline")}
      {...darkProps} 
    />
  )
}
