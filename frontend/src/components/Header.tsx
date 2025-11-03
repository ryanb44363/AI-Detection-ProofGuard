export default function Header() {
  return (
    <header className="h-18 flex items-center justify-between gap-5 px-10 border-b border-gray-200 backdrop-blur-sm bg-white/90 sticky top-0 z-20">
      <div className="flex items-center gap-7">
        <div className="flex items-center gap-2.5" aria-label="ProofGuard">
          <img
            src="/favicon.svg?v=2"
            alt="ProofGuard logo"
            className="w-9 h-9 rounded-xl shadow-lg shadow-blue-900/15"
            width={36}
            height={36}
          />
          <div className="text-xl font-extrabold tracking-wide">
            Proof<span className="text-gray-500 font-bold">Guard</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-5 text-gray-700" aria-label="Primary">
          <a href="/uploads.html" className="relative py-1.5 font-semibold hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:transition-all after:duration-300">
            Uploads
          </a>
          <a href="/api.html" className="relative py-1.5 font-semibold hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:transition-all after:duration-300">
            API
          </a>
          <a href="/plugins.html" className="relative py-1.5 font-semibold hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:transition-all after:duration-300">
            Plugins
          </a>
          <a href="/pricing.html" className="relative py-1.5 font-semibold hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:transition-all after:duration-300">
            Pricing
          </a>
          <a href="/docs.html" className="relative py-1.5 font-semibold hover:after:w-full after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-blue-500 after:to-purple-600 after:transition-all after:duration-300">
            Docs
          </a>
        </nav>
      </div>
      <div className="flex gap-3 items-center">
        <a href="/signup.html" className="bg-transparent border border-transparent px-3 py-2 text-gray-700 font-semibold rounded-full hover:bg-gray-50">
          Log in
        </a>
        <a href="/signup.html" className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-full px-4 py-2.5 font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200">
          Get Started
        </a>
      </div>
    </header>
  );
}