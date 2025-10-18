import React from "react";

export default function AboutHero() {
  return (
    <section className="relative overflow-hidden text-white">
      {/* 1) Dark background color or gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0D3B66] to-[#142F43]" />
      
      {/* 2) Blurred spheres - adjusted for mobile */}
      {/* Large gold sphere near top-left */}
      <div className="
        absolute
        -top-20 sm:-top-32
        -left-20 sm:-left-32
        h-[300px] sm:h-[400px] lg:h-[500px]
        w-[300px] sm:w-[400px] lg:w-[500px]
        rounded-full
        bg-[#D4A017]
        opacity-20 sm:opacity-30
        blur-3xl
      " />
      
      {/* Teal sphere near bottom-right */}
      <div className="
        absolute
        -bottom-20 sm:bottom-0
        -right-20 sm:-right-40
        h-[250px] sm:h-[350px] lg:h-[400px]
        w-[250px] sm:w-[350px] lg:w-[400px]
        rounded-full
        bg-teal-400
        opacity-15 sm:opacity-20
        blur-2xl
      " />
      
      {/* 3) Content Container */}
      <div className="relative mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 text-center">
        <p className="mb-2 text-xs sm:text-sm uppercase tracking-wide text-white/70">
          We Are Landivo
        </p>
        
        <h1 className="mb-3 sm:mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-white">
          About Us
        </h1>
        
        <p className="mx-auto max-w-2xl text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed">
          Your Gateway to Off-Market Land
        </p>
      </div>
    </section>
  );
}