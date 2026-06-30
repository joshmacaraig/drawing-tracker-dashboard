'use client'

import { ReactNode } from 'react'
import { ModalProvider } from '@/context/ModalContext'
import ImportModal from './ImportModal'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ModalProvider>
      {children}
      <ImportModal />
    </ModalProvider>
  )
}
