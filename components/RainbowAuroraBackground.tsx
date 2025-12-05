import React from 'react';

interface RainbowAuroraBackgroundProps {
  isDarkMode: boolean;
}

export const RainbowAuroraBackground: React.FC<RainbowAuroraBackgroundProps> = ({ isDarkMode }) => {
  return (
    <div className="fixed inset-0 -z-50 w-full h-full overflow-hidden transition-colors duration-500 bg-ivory dark:bg-stone-950">
      <div className="relative w-full h-full opacity-80 dark:opacity-70">
        {/* Light Mode Aurora */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-0' : 'opacity-100'}`}>
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-red-300/30 blur-[100px] animate-aurora-1" />
          <div className="absolute top-[10%] right-[-15%] w-[50%] h-[50%] rounded-full bg-amber-300/30 blur-[90px] animate-aurora-2" />
          <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-green-300/30 blur-[80px] animate-aurora-3" />
          <div className="absolute bottom-[20%] right-[5%] w-[45%] h-[45%] rounded-full bg-blue-300/30 blur-[90px] animate-aurora-4" />
          <div className="absolute top-[50%] left-[10%] w-[40%] h-[40%] rounded-full bg-purple-300/30 blur-[100px] animate-aurora-5" />
        </div>
        
        {/* Dark Mode Aurora */}
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isDarkMode ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-[-30%] left-[-25%] w-[70%] h-[70%] rounded-full bg-red-900/40 blur-[120px] animate-aurora-1 mix-blend-screen" />
          <div className="absolute top-[0%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-800/40 blur-[110px] animate-aurora-2 mix-blend-screen" />
          <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-green-900/40 blur-[100px] animate-aurora-3 mix-blend-screen" />
          <div className="absolute bottom-[10%] right-[-10%] w-[55%] h-[55%] rounded-full bg-blue-900/40 blur-[110px] animate-aurora-4 mix-blend-screen" />
          <div className="absolute top-[40%] left-[5%] w-[50%] h-[50%] rounded-full bg-purple-900/40 blur-[120px] animate-aurora-5 mix-blend-screen" />
        </div>
      </div>
      <style>{`
        @keyframes aurora-1 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(40px, 60px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes aurora-2 {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-50px, -30px) scale(1.1); }
          100% { transform: translate(0, 0) scale(1); }
        }
        @keyframes aurora-3 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(60px, -40px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes aurora-4 {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes aurora-5 {
          0% { transform: translate(0, 0); }
          50% { transform: translate(-30px, 50px); }
          100% { transform: translate(0, 0); }
        }
        
        .animate-aurora-1 { animation: aurora-1 20s infinite ease-in-out; }
        .animate-aurora-2 { animation: aurora-2 22s infinite ease-in-out; animation-delay: -2s; }
        .animate-aurora-3 { animation: aurora-3 18s infinite ease-in-out; animation-delay: -4s; }
        .animate-aurora-4 { animation: aurora-4 24s infinite ease-in-out; animation-delay: -6s; }
        .animate-aurora-5 { animation: aurora-5 21s infinite ease-in-out; animation-delay: -8s; }
      `}</style>
    </div>
  );
};
