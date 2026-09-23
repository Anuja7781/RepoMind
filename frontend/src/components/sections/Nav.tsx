import { useState, useEffect, useRef } from "react"
import { GitBranch, Menu, X, ChevronRight } from "lucide-react"

function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="8" cy="8" r="3" fill="#7c3aed" opacity="0.9" />
      <circle cx="8" cy="24" r="3" fill="#7c3aed" opacity="0.9" />
      <circle cx="24" cy="16" r="3" fill="#06b6d4" opacity="0.9" />
      <line x1="8" y1="11" x2="8" y2="21" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5" />
      <line x1="11" y1="8" x2="21" y2="14" stroke="#7c3aed" strokeWidth="1.5" opacity="0.5" />
      <line x1="11" y1="24" x2="21" y2="18" stroke="#06b6d4" strokeWidth="1.5" opacity="0.5" />
      <circle cx="16" cy="16" r="2.5" fill="#8b5cf6" />
      <circle cx="16" cy="16" r="14" stroke="rgba(124,58,237,0.25)" strokeWidth="1" fill="none" />
      <circle cx="24" cy="7" r="1.5" fill="#06b6d4" opacity="0.6" />
      <circle cx="24" cy="25" r="1.5" fill="#06b6d4" opacity="0.6" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: "Features",     href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Architecture", href: "#architecture" },
  { label: "Use Cases",    href: "#use-cases" },
]

export default function Nav({ onAnalyze }: { onAnalyze?: (url?: string) => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scanHover, setScanHover] = useState(false)
  const [progress, setProgress] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleScanEnter = () => {
    setScanHover(true); setProgress(0)
    timerRef.current = setInterval(() => {
      setProgress(p => { if (p >= 100) { clearInterval(timerRef.current!); return 100 } return p + 2 })
    }, 30)
  }
  const handleScanLeave = () => {
    setScanHover(false); setProgress(0)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "nav-blur" : ""}`}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2.5">
          <Logo />
          <span className="font-bold text-white tracking-tight" style={{ fontSize: 15 }}>
            RepoMind <span className="text-violet-400">AI</span>
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-7">
          {NAV_LINKS.map(item => (
            <a key={item.label} href={item.href}
              className="text-sm text-gray-400 hover:text-white transition-colors">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button
            className="btn-primary text-sm text-white px-4 py-1.5 rounded-lg font-medium relative overflow-hidden min-w-[160px]"
            onMouseEnter={handleScanEnter}
            onMouseLeave={handleScanLeave}
            onClick={() => onAnalyze?.()}
          >
            {scanHover && progress < 100
              ? <span className="font-mono text-xs flex items-center gap-2"><span className="text-violet-200">Scanning</span><span className="text-violet-300">{progress}%</span></span>
              : scanHover
                ? <span className="text-green-300 font-mono text-xs">Analysis Complete ✓</span>
                : <span className="flex items-center gap-1.5">Analyze Repository <ChevronRight size={13} /></span>
            }
            {scanHover && progress < 100 && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-violet-400 transition-all duration-75" style={{ width: `${progress}%` }} />
            )}
          </button>
        </div>

        <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden nav-blur border-t border-violet-900/20 px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map(item => (
            <a key={item.label} href={item.href}
              className="text-sm text-gray-400 hover:text-white py-1" onClick={() => setMobileOpen(false)}>
              {item.label}
            </a>
          ))}
          <button className="btn-primary text-sm text-white px-4 py-2 rounded-lg font-medium mt-2" onClick={() => onAnalyze?.()}>
            Analyze Repository →
          </button>
        </div>
      )}
    </nav>
  )
}
