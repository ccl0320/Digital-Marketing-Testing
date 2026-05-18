"use client";

import { motion } from "framer-motion";

const links = {
  Services: ["SEO & Content", "Paid Advertising", "Social Media", "Email Marketing", "Analytics & CRO"],
  Company: ["About Us", "Case Studies", "Blog", "Careers", "Press"],
  Resources: ["Marketing Guides", "ROI Calculator", "Webinars", "Templates", "Help Center"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"],
};

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="font-bold text-xl text-white">
                Growth<span className="text-indigo-400">Lab</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Data-driven marketing strategies for ambitious brands. We turn your growth goals into reality.
            </p>
            <div className="flex gap-3">
              {["𝕏", "in", "yt", "ig"].map((icon) => (
                <motion.a
                  key={icon}
                  href="#"
                  whileHover={{ scale: 1.15, color: "#6366f1" }}
                  className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold hover:bg-gray-700 transition-colors"
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm hover:text-white transition-colors duration-200"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">© {new Date().getFullYear()} GrowthLab. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
