export default function HowItWorks() {
  const steps = [
    {
      num: "1",
      title: "Create Jobs",
      desc: "Post job descriptions and let our AI generate technical questions automatically."
    },
    {
      num: "2",
      title: "Invite Candidates",
      desc: "Send interview invitations. Candidates join via secure link."
    },
    {
      num: "3",
      title: "AI Interview",
      desc: "Real-time voice conversation with live proctoring monitoring."
    },
    {
      num: "4",
      title: "Get Results",
      desc: "Instant evaluation reports with AI scores and insights."
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-black text-center text-gray-900 mb-16">How It Works</h2>

        <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-8 md:gap-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex-1 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.desc}</p>
              {idx < 3 && (
                <div className="hidden md:block absolute w-12 h-1 bg-gradient-to-r from-emerald-600 to-teal-600 ml-8 mt-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}