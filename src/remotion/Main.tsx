import React from 'react';
import { 
  AbsoluteFill, 
  interpolate, 
  useCurrentFrame, 
  useVideoConfig, 
  Easing,
  Sequence,
  spring
} from 'remotion';
import { FileText, Database, Sparkles, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

const Glow: React.FC<{ color: string; delay: number; scale: number; x: string; y: string }> = ({ color, delay, scale, x, y }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const opacity = interpolate(
    frame,
    [delay * fps, (delay + 1) * fps, (delay + 3) * fps],
    [0, 0.4, 0.2],
    { extrapolateRight: 'clamp' }
  );

  const pulse = Math.sin(frame / 60) * 0.1 + 1;

  return (
    <div 
      className={`absolute w-[800px] h-[800px] rounded-full blur-[150px] ${color}`}
      style={{
        opacity,
        transform: `translate(${x}, ${y}) scale(${scale * pulse})`,
        left: '50%',
        top: '50%',
        marginLeft: '-400px',
        marginTop: '-400px',
      }}
    />
  );
};

const Title: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const spr = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const opacity = interpolate(frame, [0, 15], [0, 1]);
  const scale = interpolate(spr, [0, 1], [0.8, 1]);
  const blur = interpolate(frame, [0, 20], [20, 0]);

  return (
    <div style={{ opacity, transform: `scale(${scale})`, filter: `blur(${blur}px)` }} className="text-center z-10">
      <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xl font-bold mb-8 tracking-widest uppercase">
        Next-Gen Analytics
      </div>
      <h1 className="text-[180px] leading-tight font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-4 tracking-tighter">
        {title.split('').map((char, i) => (
          <span key={i} style={{ 
            display: 'inline-block',
            transform: `translateY(${Math.sin((frame + i * 5) / 15) * 5}px)`
          }}>
            {char}
          </span>
        ))}
      </h1>
      <p className="text-5xl text-indigo-200/60 font-medium tracking-tight max-w-4xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};

const Card: React.FC<{ icon: React.ReactNode; title: string; desc: string; delay: number }> = ({ icon, title, desc, delay }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    
    const entry = spring({
        frame: frame - delay * fps,
        fps,
        config: { damping: 12, stiffness: 100 }
    });

    const opacity = interpolate(entry, [0, 1], [0, 1]);
    const y = interpolate(entry, [0, 1], [100, 0]);
    const rotate = interpolate(entry, [0, 1], [5, 0]);

    return (
        <div 
            style={{ opacity, transform: `translateY(${y}px) rotate(${rotate}deg)` }}
            className="w-[450px] p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-3xl relative group overflow-hidden"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-500/20">
                {React.cloneElement(icon as React.ReactElement<{ size: number | string; strokeWidth: number }>, { size: 40, strokeWidth: 1.5 })}
            </div>
            <h3 className="text-4xl font-bold text-white mb-4 tracking-tight">{title}</h3>
            <p className="text-xl text-zinc-400 leading-relaxed">{desc}</p>
        </div>
    );
};

const ExtractionUI: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const data = [
        { name: "DOLIPRANE 1000MG", ean: "3400930000001", exp: "12/2026", qty: 45, status: "Extraits" },
        { name: "ASPIRINE PROTECT", ean: "3400930000002", exp: "06/2025", qty: 12, status: "Vérifiés" },
        { name: "SERETIDE DISKUS", ean: "3400930000003", exp: "03/2027", qty: 8, status: "Scanner" }
    ];

    return (
        <div className="w-full max-w-6xl z-10">
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-4 text-zinc-500 font-mono text-lg lowercase">workspace / live_extraction.log</span>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-sm">
                        AI ENGINE: ACTIVE
                    </div>
                </div>
            </div>
            
            <div className="rounded-[32px] overflow-hidden border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-zinc-500 text-lg uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-12 py-8 border-b border-white/5">Produit</th>
                            <th className="px-12 py-8 border-b border-white/5">Code EAN</th>
                            <th className="px-12 py-8 border-b border-white/5">Expiration</th>
                            <th className="px-12 py-8 border-b border-white/5 text-right">Statut</th>
                        </tr>
                    </thead>
                    <tbody className="text-white text-2xl font-medium">
                        {data.map((item, i) => {
                            const delay = i * 0.2;
                            const spr = spring({ frame: frame - delay * fps, fps, config: { damping: 15 } });
                            return (
                                <tr key={i} style={{ opacity: spr, transform: `translateX(${(1 - spr) * 20}px)` }} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-12 py-8 border-b border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-10 bg-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {item.name}
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 border-b border-white/5 font-mono text-zinc-400">{item.ean}</td>
                                    <td className="px-12 py-8 border-b border-white/5">
                                        <span className={`px-4 py-1 rounded-full text-lg ${i === 1 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'}`}>
                                            {item.exp}
                                        </span>
                                    </td>
                                    <td className="px-12 py-8 border-b border-white/5 text-right">
                                        <span className="flex items-center justify-end gap-2 text-green-400">
                                            <Zap size={20} /> {item.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Main: React.FC<{ title: string; subtitle: string }> = ({ title, subtitle }) => {
  const { fps, durationInFrames } = useVideoConfig();

  return (
    <AbsoluteFill style={{ fontFamily }} className="bg-zinc-950 items-center justify-center overflow-hidden">
      {/* Dynamic Cinematic Background */}
      <AbsoluteFill className="z-0">
          <Glow color="bg-indigo-600" delay={0} scale={1.2} x="-30%" y="-30%" />
          <Glow color="bg-purple-600" delay={1} scale={1} x="30%" y="30%" />
          <Glow color="bg-blue-600" delay={2} scale={1.5} x="-40%" y="20%" />
      </AbsoluteFill>

      {/* Intro Scene */}
      <Sequence durationInFrames={180}>
        <Title title={title} subtitle={subtitle} />
      </Sequence>

      {/* Features Scene */}
      <Sequence from={180} durationInFrames={200}>
        <div className="flex flex-col items-center gap-16 z-10 w-full">
            <h2 className="text-7xl font-black text-white tracking-tight text-center">
                Une technologie <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">sans compromis.</span>
            </h2>
            <div className="flex gap-10">
                <Card 
                    icon={<FileText />} 
                    title="Scanning Multi-Saisie" 
                    desc="Importez PDF, scans et photos en un clin d'œil." 
                    delay={0}
                />
                <Card 
                    icon={<Sparkles />} 
                    title="IA de Précision" 
                    desc="Identification automatique des lots et dates d'expiration." 
                    delay={0.3}
                />
                <Card 
                    icon={<ShieldCheck />} 
                    title="Vérification Totale" 
                    desc="Zéro erreur de saisie pour une gestion de stock parfaite." 
                    delay={0.6}
                />
            </div>
        </div>
      </Sequence>

      {/* Live Extraction Demo */}
      <Sequence from={380} durationInFrames={150}>
        <div className="flex flex-col items-center gap-16 w-full px-20">
            <div className="text-center space-y-4">
                <h2 className="text-8xl font-black text-white tracking-tighter">Extraction en Temps Réel.</h2>
                <p className="text-3xl text-zinc-500 font-medium">L'algorithme analyse, identifie et enregistre automatiquement.</p>
            </div>
            <ExtractionUI />
        </div>
      </Sequence>

      {/* Outro Cinematic */}
      <Sequence from={530} durationInFrames={70}>
        <AbsoluteFill className="items-center justify-center bg-indigo-600 z-50">
            <div className="flex flex-col items-center gap-12 text-white">
                <div className="w-48 h-48 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                    <CheckCircle size={120} strokeWidth={2.5} />
                </div>
                <h2 className="text-[120px] font-black leading-none tracking-tighter">Prêt pour vous.</h2>
                <p className="text-4xl font-bold opacity-60">peremptionextract.fr</p>
            </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
