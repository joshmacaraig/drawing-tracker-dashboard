'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface ModalContextType {
  importOpen: boolean
  openImport: () => void
  closeImport: () => void
}

const ModalContext = createContext<ModalContextType | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [importOpen, setImportOpen] = useState(false)
  const openImport = useCallback(() => setImportOpen(true), [])
  const closeImport = useCallback(() => setImportOpen(false), [])

  return (
    <ModalContext.Provider value={{ importOpen, openImport, closeImport }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const ctx = useContext(ModalContext)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}
