import { useState, useEffect } from "react"
import { getLogger } from "@/utils/logger"

const MOBILE_BREAKPOINT = 768

const log = getLogger("useMobile")

export function useMobile() {
  const [isMobile, setIsMobile] = useState(undefined)

  useEffect(() => {
    log.info("[useMobile] > [Init]: registering resize listener")
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      log.info(`[useMobile] > [Computed]: isMobile=${window.innerWidth < MOBILE_BREAKPOINT}`)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    log.info(`[useMobile] > [Computed]: initial isMobile=${window.innerWidth < MOBILE_BREAKPOINT}`)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  return !!isMobile
}

export default useMobile;
