export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
        <div>
          <h4 className="text-white font-bold text-lg mb-3">AI Recruiter Pro</h4>
          <p>Intelligent technical interviews for modern teams.</p>
        </div>
        <div>
          <h4 className="text-white font-bold text-lg mb-3">Product</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-emerald-500 transition">Features</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition">Pricing</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition">Security</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold text-lg mb-3">Company</h4>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-emerald-500 transition">About</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition">Blog</a></li>
            <li><a href="#" className="hover:text-emerald-500 transition">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-700 pt-8 text-center text-gray-500">
        <p>&copy; 2024 AI Recruiter Pro. All rights reserved.</p>
      </div>
    </footer>
  );
}