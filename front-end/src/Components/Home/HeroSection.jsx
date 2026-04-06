import { ArrowRight } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="mt-20 min-h-[90vh] flex items-center justify-between px-6 py-12 max-w-6xl mx-auto gap-12">
      <div className="flex-1 z-10">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight mb-6">
          AI-Powered Technical
          <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {' '}Interviews
          </span>
          <br />
          Made Intelligent
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
          Conduct automated technical interviews with real-time proctoring, AI analysis, and instant evaluations.
        </p>
        <div className="flex gap-4 flex-wrap">
          <button className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 flex items-center gap-2">
            Get Started Free <ArrowRight size={20} />
          </button>
          <button className="bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-full font-bold text-lg transition">
            Watch Demo
          </button>
        </div>
      </div>

      {/* Hero Graphic */}
      <div className="flex-1 relative h-96 md:h-[500px] hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/30 to-teal-200/20 rounded-full blur-3xl"></div>

        <div
          className="absolute top-12 right-12 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 animate-bounce"
          style={{ animationDelay: '0s' }}
        >
          <div className="text-4xl mb-2">📝</div>
          <p className="font-bold text-emerald-600">AI Analysis</p>
        </div>

        <div
          className="absolute top-1/3 right-1/4 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 animate-bounce"
          style={{ animationDelay: '0.2s' }}
        >
          <div className="text-4xl mb-2">🎤</div>
          <p className="font-bold text-emerald-600">Voice Interview</p>
        </div>

        <div
          className="absolute bottom-1/4 right-8 bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 animate-bounce"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="text-4xl mb-2">👁️</div>
          <p className="font-bold text-emerald-600">Live Proctoring</p>
        </div>
      </div>
    </section>
  );
}