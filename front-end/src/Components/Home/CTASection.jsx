import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 px-6 bg-white text-center">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-gray-900 mb-4">Ready to Transform Your Hiring?</h2>
        <p className="text-xl text-gray-600 mb-8">Join hundreds of companies using AI for smarter recruitment.</p>
        <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-10 py-5 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 inline-flex items-center gap-2">
          Start Your Free Trial <ArrowRight size={22} />
        </button>
      </div>
    </section>
  );
}