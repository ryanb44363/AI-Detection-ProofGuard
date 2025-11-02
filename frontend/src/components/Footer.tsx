export default function Footer() {
  return (
    <footer className="bg-white/10 backdrop-blur-md border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-white/80 text-sm">
            © 2025 ProofGuard. Detect AI-generated content with confidence.
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-white/70 hover:text-white transition">
              Privacy Policy
            </a>
            <a href="#" className="text-white/70 hover:text-white transition">
              Terms of Service
            </a>
            <a href="#" className="text-white/70 hover:text-white transition">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
