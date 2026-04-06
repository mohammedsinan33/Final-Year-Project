import { Zap, Shield, Users, BarChart3 } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: <Zap size={40} />,
      title: "AI Voice Agent",
      desc: "Natural conversational AI that conducts technical interviews with real candidates in real-time."
    },
    {
      icon: <Shield size={40} />,
      title: "Live Proctoring",
      desc: "Real-time webcam monitoring, suspicious activity detection, and detailed proctor reports."
    },
    {
      icon: <Users size={40} />,
      title: "Candidate Management",
      desc: "Track all candidates in one dashboard. View profiles, interview histories, and evaluations."
    },
    {
      icon: <BarChart3 size={40} />,
      title: "Instant Analytics",
      desc: "Get detailed reports on candidate performance with AI-powered scoring and insights."
    },
    {
      icon: <Zap size={40} />,
      title: "Resume Analysis",
      desc: "Automatically parse and analyze resumes to generate intelligent, contextual interview questions."
    },
    {
      icon: <Shield size={40} />,
      title: "Secure & Compliant",
      desc: "Enterprise-grade security with encrypted video storage and GDPR compliance."
    }
  ];

  return (
    <section id="features" className="py-20 px-6 bg-gradient-to-b from-transparent to-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-black text-center text-gray-900 mb-4">Why Choose Us?</h2>
        <p className="text-xl text-center text-gray-600 mb-16">Advanced features designed for modern recruitment</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="group bg-white p-8 rounded-2xl shadow-md hover:shadow-2xl border-t-4 border-emerald-600 transition transform hover:-translate-y-3 duration-300"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}