"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "340%", label: "Avg. ROI Increase" },
  { value: "2.8M+", label: "Leads Generated" },
  { value: "98%", label: "Client Retention" },
  { value: "12yrs", label: "Industry Experience" },
];

const floatingBadges = [
  { icon: "📈", text: "+127% Traffic", delay: 0, x: "-left-4", y: "top-20" },
  { icon: "💰", text: "3× Revenue", delay: 0.4, x: "right-0", y: "top-32" },
  { icon: "⭐", text: "4.9 Rating", delay: 0.8, x: "left-8", y: "bottom-24" },
];

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-indigo-300/20 blur-[80px]" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[500px] h-[500px] rounded-full bg-purple-300/20 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pink-200/15 blur-[60px]" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 flex flex-col lg:flex-row items-center gap-16"
      >
        {/* Left content */}
        <div className="flex-1 text-center lg:text-left">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Trusted by 500+ Growing Brands
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight text-gray-900 mb-6"
          >
            Marketing That{" "}
            <span className="gradient-text">Grows</span>{" "}
            Your Business
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg text-gray-500 leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10"
          >
            We combine data science, creative strategy, and cutting-edge tech
            to deliver digital marketing campaigns that turn clicks into
            customers — and customers into brand advocates.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <motion.a
              href="#contact"
              whileHover={{ scale: 1.04, boxShadow: "0 20px 40px rgba(99,102,241,0.35)" }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-full bg-indigo-600 text-white font-semibold text-base shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors"
            >
              Start Growing Today
            </motion.a>
            <motion.a
              href="#results"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 rounded-full border-2 border-gray-200 text-gray-700 font-semibold text-base hover:border-indigo-300 hover:text-indigo-600 transition-colors flex items-center gap-2 justify-center"
            >
              <span>View Case Studies</span>
              <span>→</span>
            </motion.a>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((s, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                <div className="text-xs text-gray-400 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right visual */}
        <div className="flex-1 relative w-full max-w-md lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative mx-auto w-full max-w-[420px] aspect-square"
          >
            {/* Main dashboard card */}
            <div className="w-full h-full rounded-3xl glass shadow-2xl shadow-indigo-200/50 p-6 flex flex-col gap-4 border border-indigo-100/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Campaign Performance</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-medium">Live</span>
              </div>

              {/* Chart bars */}
              <div className="flex-1 flex items-end gap-2 px-2">
                {[40, 65, 55, 80, 70, 90, 85, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 + i * 0.07 }}
                    style={{ transformOrigin: "bottom", height: `${h}%` }}
                    className={`flex-1 rounded-t-lg ${i === 7 ? "bg-indigo-600" : "bg-indigo-100"}`}
                  />
                ))}
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "CTR", value: "6.2%", up: true },
                  { label: "Conversions", value: "1,847", up: true },
                  { label: "CPA", value: "$14.3", up: false },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-1">{m.label}</div>
                    <div className="font-bold text-gray-900 text-sm">{m.value}</div>
                    <div className={`text-xs font-medium ${m.up ? "text-green-500" : "text-red-400"}`}>
                      {m.up ? "↑" : "↓"} {m.up ? "vs last mo." : "vs last mo."}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            {floatingBadges.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + b.delay }}
                className={`absolute ${b.x} ${b.y} float-animation`}
                style={{ animationDelay: `${b.delay}s` }}
              >
                <div className="glass rounded-2xl px-3 py-2 shadow-lg flex items-center gap-2 text-sm font-semibold text-gray-700 whitespace-nowrap">
                  <span>{b.icon}</span>
                  <span>{b.text}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-gray-400 font-medium">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-5 h-8 rounded-full border-2 border-gray-300 flex items-start justify-center pt-1.5"
        >
          <div className="w-1 h-2 rounded-full bg-gray-400" />
        </motion.div>
      </motion.div>
    </section>
  );
}
