import { useState, useEffect } from "react";
import { Crown, Rocket, Hourglass, HelpCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface PatentCardProps {
  loyalty: {
    thisWeekVolume: number;
    lastWeekVolume: number;
    currentRank: string;
    currentBonus: number;
    nextRank: string;
    nextGoal: number;
    resetDate: number;
  };
}

export default function PatentCard({ loyalty }: PatentCardProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = loyalty.resetDate - now;

      if (distance < 0) {
        setTimeLeft("00d 00h 00m");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeLeft(`${days.toString().padStart(2, '0')}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, [loyalty.resetDate]);

  const maxVol = Math.max(loyalty.thisWeekVolume, loyalty.lastWeekVolume);
  const progress = Math.min(100, (maxVol / 25000) * 100);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case "BRONZE": return "text-orange-500";
      case "PRATA": return "text-blue-400";
      case "OURO": return "text-amber-500";
      default: return "text-slate-400";
    }
  };

  const getRankBadge = (rank: string) => {
    switch (rank) {
      case "BRONZE": return "bg-orange-500";
      case "PRATA": return "bg-blue-500";
      case "OURO": return "bg-amber-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Header Info */}
      <div className="flex items-start justify-between mb-10">
        <div className="flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 ${getRankColor(loyalty.currentRank)}`}>
            <Crown size={32} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black tracking-tight dark:text-white uppercase m-0">{loyalty.currentRank}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white uppercase tracking-wider ${getRankBadge(loyalty.currentRank)}`}>
                {loyalty.currentBonus}% BÔNUS
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Hourglass size={10} className="text-gray-400" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest m-0">
                ESTE STATUS EXPIRA EM: <span className="text-blue-600 dark:text-blue-400 font-black">{timeLeft}</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 mt-2 cursor-pointer group">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest m-0 group-hover:text-blue-500 transition-colors">Sua Patente Atual</p>
               <HelpCircle size={12} className="text-blue-500" />
               <span className="text-[10px] font-bold text-blue-500 underline uppercase">Saiba Mais</span>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status para semana que vem</p>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50">
              <CheckCircle2 size={12} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">GARANTIDO</span>
            </div>
        </div>
      </div>

      {/* Progress Roadmap */}
      <div className="relative pt-6 pb-2">
        {/* Markers Labels */}
        <div className="absolute top-0 left-0 w-full flex justify-between px-2">
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-gray-400 uppercase">INÍCIO</span>
           </div>
           <div className="flex flex-col items-center translate-x-[15%]">
             <span className="text-[10px] font-black text-gray-400 uppercase">BRONZE</span>
             <span className="text-[9px] font-bold text-gray-300">25%</span>
           </div>
           <div className="flex flex-col items-center translate-x-[25%]">
             <span className="text-[10px] font-black text-gray-400 uppercase">PRATA</span>
             <span className="text-[9px] font-bold text-gray-300">30%</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[10px] font-black text-gray-400 uppercase">OURO</span>
             <span className="text-[9px] font-bold text-gray-300">40%</span>
           </div>
        </div>

        {/* Progress Bar Container */}
        <div className="h-4 w-full bg-gray-100 dark:bg-white/5 rounded-full mt-6 relative overflow-hidden shadow-inner">
          {/* Static Background Indicators */}
          <div className="absolute top-0 left-[40%] h-full w-[1px] bg-gray-200 dark:bg-white/10 z-10" />
          <div className="absolute top-0 left-[72%] h-full w-[1px] bg-gray-200 dark:bg-white/10 z-10" />
          
          {/* Active Progress */}
          <div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 transition-all duration-1000 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between mt-4">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            INVESTIDO: <span className="text-blue-600 dark:text-blue-400">R$ {(maxVol / 100).toFixed(2).replace('.', ',')}</span>
          </p>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            OBJETIVO: <span className="text-gray-900 dark:text-white">R$ 250,00</span>
          </p>
        </div>
      </div>

      {/* Next Step Box */}
      {loyalty.nextGoal > 0 && (
        <div className="mt-10 p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center gap-6 group hover:border-blue-200 dark:hover:border-blue-900/30 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0 border-2 border-blue-100 dark:border-blue-900/30 group-hover:scale-110 transition-transform">
            <Rocket size={28} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">
              Próximo Nível: <span className={getRankColor(loyalty.nextRank)}>{loyalty.nextRank}</span>
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Faltam <span className="font-bold text-gray-800 dark:text-gray-200">R$ {((loyalty.nextGoal - maxVol) / 100).toFixed(2).replace('.', ',')}</span> para você subir sua lucratividade.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 shrink-0">
             <div className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 text-[10px] font-black uppercase tracking-widest">
               RESETA EM: {timeLeft}
             </div>
             <p className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
               <CheckCircle2 size={10} /> STATUS PARA SEMANA QUE VEM: GARANTIDO
             </p>
          </div>
        </div>
      )}
    </div>
  );
}
