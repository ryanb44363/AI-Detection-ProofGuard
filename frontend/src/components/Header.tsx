export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/favicon.svg?v=2"
              alt="ProofGuard"
              className="w-8 h-8 rounded-md"
              width={32}
              height={32}
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ProofGuard</h1>
              <p className="text-xs text-gray-600">AI Content Detection</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/uploads.html" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              Uploads
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              API
            </a>
            <a href="#" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
              Pricing
            </a>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded">
              Sign up
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
