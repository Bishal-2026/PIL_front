import React from "react";
import { motion } from "framer-motion";
import cyberBg from "../../Images/cyber_bg.png";

const CyberBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-white">
      {/* Primary Image with Subtle Pan Animation */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          x: [0, -20, 0],
          y: [0, 10, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundImage: `url(${cyberBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="absolute inset-0 opacity-70"
      />

      {/* Subtle Digital Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.08]" />

      {/* Floating Sparkles / Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%", 
            opacity: 0,
            scale: 0 
          }}
          animate={{
            y: [null, "-30%"],
            opacity: [0, 0.6, 0],
            scale: [0, 1.2, 0.6],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
          className="absolute w-1.5 h-1.5 bg-blue-500 rounded-full blur-[1px]"
          style={{
            boxShadow: "0 0 12px 3px rgba(59, 130, 246, 0.4)",
          }}
        />
      ))}

      {/* Subtle Data Flow Lines (Simulated with thin animated divs) */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          animate={{
            x: ["-100%", "200%"],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            delay: i * 5,
            ease: "linear",
          }}
          className="absolute h-[1px] w-[300px] bg-gradient-to-r from-transparent via-blue-400/20 to-transparent top-1/2 left-0 transform -rotate-12"
          style={{ top: `${20 + i * 25}%` }}
        />
      ))}
    </div>
  );
};

export default CyberBackground;
