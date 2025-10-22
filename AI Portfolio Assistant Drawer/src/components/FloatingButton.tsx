import { Sparkles } from "lucide-react";

interface FloatingButtonProps {
  onClick: () => void;
}

export function FloatingButton({ onClick }: FloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed right-8 bottom-8 w-16 h-16 rounded-full bg-white hover:scale-110 transition-all duration-300 shadow-2xl z-50 flex items-center justify-center group"
      style={{
        boxShadow: '0 8px 32px rgba(255, 255, 255, 0.3)'
      }}
    >
      <Sparkles className="w-7 h-7 text-black group-hover:rotate-12 transition-transform" />
      
      {/* Pulse animation */}
      <div 
        className="absolute inset-0 rounded-full bg-white animate-ping opacity-20"
      />
    </button>
  );
}