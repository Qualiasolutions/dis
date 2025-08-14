import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Language = 'ar' | 'en'

interface LanguageStore {
  language: Language
  setLanguage: (language: Language) => void
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'ar', // Default to Arabic for Jordan market
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-preference', // localStorage key
    }
  )
)