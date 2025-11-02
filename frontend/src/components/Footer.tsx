export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-5">
        <p className="text-xs text-gray-500 mb-3">
          Terms of Service. To learn more
          <br className="sm:hidden" />
          about how ProofGuard handles your data, check our Privacy Policy.
        </p>
        <div className="flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="text-sm text-gray-600">
            © 2025 ProofGuard • Detect AI-generated content with confidence
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Terms of Service
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-900">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
