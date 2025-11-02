import { Shield } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" strokeWidth={2.5} />
            <div>
              <h1 className="text-2xl font-bold text-white">ProofGuard</h1>
              <p className="text-sm text-white/80">AI Content Detection</p>
            </div>
          </div>
          <nav className="hidden md:flex space-x-6">
            <a href="#" className="text-white/90 hover:text-white transition font-medium">
              Home
            </a>
            <a href="#" className="text-white/90 hover:text-white transition font-medium">
              About
            </a>
            <a href="#" className="text-white/90 hover:text-white transition font-medium">
              API
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
