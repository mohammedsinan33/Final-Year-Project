import React from 'react';
import Navbar from '../Components/Home/Navbar';
import HeroSection from '../Components/Home/HeroSection';
import FeaturesSection from '../Components/Home/FeaturesSection';
import HowItWorks from '../Components/Home/HowItWorks';
import StatsSection from '../Components/Home/StatsSection';
import CTASection from '../Components/Home/CTASection';
import Footer from '../Components/Home/Footer';

export default function HomePage() {
  return (
    <div className="bg-gradient-to-br from-white via-green-50 to-emerald-50 min-h-screen overflow-hidden">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <StatsSection />
      <CTASection />
      <Footer />
    </div>
  );
}