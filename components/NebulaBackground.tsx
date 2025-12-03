import React from 'react';

export const NebulaBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-stone-50 dark:bg-stone-950 transition-colors duration-700">
      
      {/* Light Mode Orbs */}
      <div className="dark:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-300/30 blur-[100px] animate-drift-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-300/30 blur-[90px] animate-drift-medium animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-saffron-300/30 blur-[90px] animate-drift-fast animation-delay-4000" />
      </div>

      {/* Dark Mode Orbs */}
      <div className="hidden dark:block">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-900/20 blur-[120px] mix-blend-screen animate-drift-slow" />
        <div className="absolute top-[20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-teal-900/20 blur-[100px] mix-blend-screen animate-drift-medium animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[100px] mix-blend-screen animate-drift-fast animation-delay-4000" />
        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-saffron-600/10 blur-[80px] mix-blend-screen animate-pulse-slow" />
      </div>

      {/* Noise Overlay */}
      <div className="absolute inset-0 opacity-[0.04] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 pointer-events-none" />

      <style>{`
        @keyframes drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -50px) rotate(2deg); }
          66% { transform: translate(-20px, 20px) rotate(-1deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-drift-slow { animation: drift 20s infinite ease-in-out; }
        .animate-drift-medium { animation: drift 15s infinite ease-in-out reverse; }
        .animate-drift-fast { animation: drift 12s infinite ease-in-out; }
        .animate-pulse-slow { animation: pulse 8s infinite ease-in-out; }
        .animation-delay-2000 { animation-delay: -2s; }
        .animation-delay-4000 { animation-delay: -4s; }
      `}</style>
    </div>
  );
};