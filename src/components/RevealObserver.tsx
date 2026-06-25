'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RevealObserver() {
  const pathname = usePathname()

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('sr-visible')
          } else {
            entry.target.classList.remove('sr-visible')
          }
        })
      },
      { threshold: 0, rootMargin: '-8% 0px -10% 0px' },
    )

    function observeAll() {
      document.querySelectorAll('[data-sr]').forEach((el) => obs.observe(el))
    }

    observeAll()
    const mut = new MutationObserver(observeAll)
    mut.observe(document.body, { childList: true, subtree: true })

    return () => { obs.disconnect(); mut.disconnect() }
  }, [pathname])

  return null
}
