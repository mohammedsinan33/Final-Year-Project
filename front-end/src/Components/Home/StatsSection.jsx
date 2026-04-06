export default function StatsSection() {
  const stats = [
    { value: "500+", label: "Companies Trust Us" },
    { value: "100K+", label: "Interviews Conducted" },
    { value: "95%", label: "Satisfaction Rate" },
    { value: "60%", label: "Time Saved" }
  ];

  return (
    <section className="py-16 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
      <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center text-white">
            <div className="text-5xl font-black mb-2">{stat.value}</div>
            <p className="text-lg opacity-90">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}