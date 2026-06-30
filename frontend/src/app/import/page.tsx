'use client'

import { useEffect } from 'react'
import { useModal } from '@/context/ModalContext'
import { useRouter } from 'next/navigation'

export default function ImportRedirect() {
  const { openImport } = useModal()
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
    openImport()
  }, [])

  return null
}
