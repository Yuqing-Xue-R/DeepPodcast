import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  Podcast, 
  BarChart3, 
  Target,
  Maximize2,
  Activity,
  Filter
} from 'lucide-react';
import { 
  PODCAST_DATA, 
  METRIC_LABELS 
} from './constants';
import { 
  MetricKey, 
  CategoryKey, 
  HistogramDataPoint 
} from './types';

// 覆盖默认颜色，采用更具质感的高级色盘
const MODERN_PALETTE: Record<string, string> = {
  none: '#cbd5e1',      // Slate 300
  'Solo': '#1e293b',    // Slate 800
  'Guest': '#818cf8',   // Indigo 400
  'Invest': '#059669',  // Emerald 600
  'General': '#fbbf24', // Amber 400
};

/**
 * Helper to generate histogram bins from raw data.
 */
const generateHistogramData = (
  data: any[], 
  metric: string, 
  category: CategoryKey, 
  bucketSize: number,
  startAtZero: boolean = true
): HistogramDataPoint[] => {
  if (data.length === 0) return [];

  const values = data.map(d => d[metric]);
  const minVal = startAtZero ? 0 : Math.min(...values); 
  const maxVal = Math.max(...values);
  
  const numBuckets = Math.ceil((maxVal - minVal) / bucketSize) || 1;
  const bins: HistogramDataPoint[] = [];

  for (let i = 0; i < numBuckets; i++) {
    const binMin = minVal + i * bucketSize;
    const binMax = binMin + bucketSize;
    
    const bin: any = {
      binLabel: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
      min: binMin,
      max: binMax,
      totalCount: 0,
    };

    if (category !== 'none') {
      const categoryLevels = Array.from(new Set(PODCAST_DATA.map(d => d[category as 'talkType' | 'episodeType'])));
      categoryLevels.forEach(lvl => {
        bin[lvl] = 0;
      });
    }

    bins.push(bin);
  }

  data.forEach(episode => {
    const val = episode[metric];
    const binIndex = Math.min(
      Math.floor((val - minVal) / bucketSize),
      bins.length - 1
    );

    if (binIndex >= 0 && binIndex < bins.length) {
      bins[binIndex].totalCount += 1;
      
      if (category !== 'none') {
        const cat = episode[category as 'talkType' | 'episodeType'];
        bins[binIndex][cat] = (bins[binIndex][cat] as number) + 1;
      }
    }
  });

  return bins.filter(bin => bin.totalCount > 0); 
};

// --- Custom UI Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeading = ({ icon: Icon, title, description, colorClass = "bg-slate-900" }: { icon: any, title: string, description: string, colorClass?: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className={`p-3 rounded-2xl text-white shadow-lg ${colorClass}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{title}</h2>
      <p className="text-slate-500 text-sm font-medium">{description}</p>
    </div>
  </div>
);

const PillButton = ({ 
  label, 
  isActive, 
  onClick, 
  activeColor = "bg-slate-900" 
}: { 
  label: string, 
  isActive: boolean, 
  onClick: () => void,
  activeColor?: string
}) => (
  <button
    onClick={onClick}
    className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
      isActive 
      ? `${activeColor} text-white border-transparent shadow-md scale-105` 
      : "bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600"
    }`}
  >
    {label}
  </button>
);

const CustomTooltip = ({ active, payload, label, category }: any) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 border border-slate-200 shadow-2xl rounded-2xl text-sm min-w-[200px]">
        <p className="font-bold text-slate-400 text-[10px] uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">Range: {label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-700 font-bold">{entry.name}:</span>
                </div>
                <span className="text-slate-900 font-black">{entry.value} <span className="text-[10px] text-slate-400 font-medium">({percentage}%)</span></span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const BubbleTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/90 backdrop-blur-md p-4 border border-slate-200 shadow-2xl rounded-2xl text-sm min-w-[240px]">
        <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
          <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[10px] font-black">{data.id}</span>
          <p className="font-bold text-slate-900 truncate italic">{data.title}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs">Reach:</span>
            <span className="text-slate-900 font-black">{data.playCount}w</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 text-xs">Efficiency:</span>
            <span className="text-indigo-600 font-black">{data.engagementRate.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const fullData = useMemo(() => {
    return PODCAST_DATA.map(ep => ({
      ...ep,
      engagementRate: ep.commentCount / ep.playCount
    }));
  }, []);

  // -- Chart #1 States --
  const [c1Metric, setC1Metric] = useState<MetricKey>('playCount');
  const [c1BucketSize, setC1BucketSize] = useState<number>(10);
  const [c1Category, setC1Category] = useState<CategoryKey>('none');

  // -- Chart #2 States --
  const [bubbleX, setBubbleX] = useState<string>('playCount');
  const [bubbleY, setBubbleY] = useState<string>('engagementRate');
  const [bubbleFilter, setBubbleFilter] = useState<string | null>(null);
  const [isLogScale, setIsLogScale] = useState<boolean>(false);

  const c1Data = useMemo(() => {
    return generateHistogramData(fullData, c1Metric, c1Category, c1BucketSize);
  }, [fullData, c1Metric, c1Category, c1BucketSize]);

  const filteredBubbleData = useMemo(() => {
    if (!bubbleFilter) return fullData;
    return fullData.filter(d => 
      d.talkType === bubbleFilter || d.episodeType === bubbleFilter
    );
  }, [fullData, bubbleFilter]);

  const availableCategories = useMemo(() => {
    const talkTypes = Array.from(new Set(fullData.map(d => d.talkType)));
    const episodeTypes = Array.from(new Set(fullData.map(d => d.episodeType)));
    return [...talkTypes, ...episodeTypes];
  }, [fullData]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl">
              <Podcast className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-950">
              无人知晓 <span className="text-slate-300 font-light italic text-2xl">Intelligence</span>
            </h1>
          </div>
          <p className="text-slate-500 text-lg font-medium italic">
            "Nobody Knows" Podcast Analytics — Curated for Meng Yan.
          </p>
        </div>
      </header>

      {/* Chart #1: Reach Distribution */}
      <Card>
        <div className="p-8 md:p-10">
          <SectionHeading 
            icon={BarChart3} 
            title="Reach Distribution" 
            description="Analyzing density and clustering of play counts with category segmentation."
          />
          
          <div className="flex flex-col gap-8 mb-10 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
            <div className="flex flex-wrap items-start gap-12">
              {/* Metric Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">01. Base Metric</label>
                <div className="flex gap-2">
                  {(['playCount', 'commentCount'] as MetricKey[]).map(m => (
                    <PillButton 
                      key={m}
                      label={METRIC_LABELS[m]}
                      isActive={c1Metric === m}
                      onClick={() => { setC1Metric(m); setC1BucketSize(m === 'playCount' ? 10 : 500); }}
                    />
                  ))}
                </div>
              </div>

              {/* Talk Style Selector */}
              <div className="space-y-3 border-l border-slate-200 pl-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">02. Talk Style</label>
                <div className="flex gap-2">
                  <PillButton 
                    label="None" 
                    isActive={c1Category === 'none'} 
                    onClick={() => setC1Category('none')} 
                  />
                  <PillButton 
                    label="Solo/Guest" 
                    isActive={c1Category === 'talkType'} 
                    onClick={() => setC1Category('talkType')} 
                    activeColor="bg-slate-800"
                  />
                </div>
              </div>

              {/* Content Category Selector */}
              <div className="space-y-3 border-l border-slate-200 pl-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-mono">03. Episode Type</label>
                <div className="flex gap-2">
                  <PillButton 
                    label="Invest/General" 
                    isActive={c1Category === 'episodeType'} 
                    onClick={() => setC1Category('episodeType')} 
                    activeColor="bg-emerald-600"
                  />
                </div>
              </div>
            </div>

            {/* Slider Controls */}
            <div className="space-y-4 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono italic underline decoration-slate-200 underline-offset-4">Resolution Adjuster</label>
                <span className="text-slate-900 font-mono font-black text-xs px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-100">
                   Step: {c1BucketSize} {c1Metric === 'playCount' ? '10k' : 'Comments'}
                </span>
              </div>
              <input 
                type="range" 
                min={c1Metric === 'playCount' ? 2 : 50} 
                max={c1Metric === 'playCount' ? 50 : 2000} 
                step={c1Metric === 'playCount' ? 2 : 50} 
                value={c1BucketSize} 
                onChange={(e) => setC1BucketSize(Number(e.target.value))} 
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900 hover:accent-indigo-500 transition-colors" 
              />
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={c1Data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                   dataKey="binLabel" 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800, fontFamily: 'monospace'}} 
                />
                <YAxis 
                   axisLine={false} 
                   tickLine={false} 
                   tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800, fontFamily: 'monospace'}} 
                />
                <Tooltip 
                   content={<CustomTooltip category={c1Category} />} 
                   cursor={{fill: '#f8fafc', fillOpacity: 0.5}} 
                />
                {Array.from(new Set(fullData.map(d => c1Category === 'none' ? 'totalCount' : d[c1Category as 'talkType' | 'episodeType']))).map((lvl, index) => (
                  <Bar 
                    key={lvl} 
                    dataKey={lvl} 
                    stackId="a" 
                    fill={c1Category === 'none' ? MODERN_PALETTE.none : MODERN_PALETTE[lvl]} 
                    radius={[6, 6, 6, 6]} // 每一个分段都是独立的圆角
                    barSize={42} 
                    stroke="#ffffff" // 制造缝隙感的关键
                    strokeWidth={2}
                    isAnimationActive={true}
                    animationBegin={index * 150}
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Chart #2: Discovery Matrix */}
      <Card>
        <div className="p-8 md:p-10">
          <SectionHeading 
            icon={Target} 
            title="Discovery Matrix" 
            description="Correlation between reach (X) and listener engagement (Y)."
            colorClass="bg-rose-500"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 font-mono">
                  <Filter className="w-3.5 h-3.5" /> Spotlight Filter
                </label>
                <div className="flex flex-wrap gap-2">
                  <PillButton 
                    label="All Data" 
                    isActive={bubbleFilter === null} 
                    onClick={() => setBubbleFilter(null)} 
                  />
                  {availableCategories.map(lvl => (
                    <PillButton 
                      key={lvl}
                      label={lvl}
                      isActive={bubbleFilter === lvl}
                      onClick={() => setBubbleFilter(lvl)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-8 bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Horizontal (X)</label>
                  <select 
                    value={bubbleX} 
                    onChange={(e) => setBubbleX(e.target.value)}
                    className="block w-48 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500/20"
                  >
                    <option value="playCount text-slate-400">Play Count</option>
                    <option value="commentCount">Comment Count</option>
                    <option value="engagementRate">Engagement Rate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">Vertical (Y)</label>
                  <select 
                    value={bubbleY} 
                    onChange={(e) => setBubbleY(e.target.value)}
                    className="block w-48 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 ring-indigo-500/20"
                  >
                    <option value="playCount">Play Count</option>
                    <option value="commentCount">Comment Count</option>
                    <option value="engagementRate">Engagement Rate</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end gap-4">
              <button 
                onClick={() => setIsLogScale(!isLogScale)}
                className={`flex items-center justify-center gap-3 px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                  isLogScale ? "bg-slate-900 border-slate-900 text-white shadow-lg" : "bg-white border-slate-200 text-slate-400"
                }`}
              >
                <Maximize2 className="w-4 h-4" />
                Log Scale {isLogScale ? "ON" : "OFF"}
              </button>
              <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2 font-mono">
                   <Activity className="w-3 h-3" /> System Note
                </span>
                <p className="text-[10px] font-medium text-rose-500 italic mt-1 leading-relaxed">
                  Bubble size is proportional to Play Count.
                </p>
              </div>
            </div>
          </div>

          <div className="h-[500px] border border-slate-50 rounded-[2.5rem] p-6 bg-slate-50/30">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  dataKey={bubbleX} 
                  scale={isLogScale ? "log" : "linear"} 
                  domain={bubbleFilter ? ['auto', 'auto'] : [0, 'auto']}
                  axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                />
                <YAxis 
                  type="number" 
                  dataKey={bubbleY} 
                  scale={isLogScale ? "log" : "linear"} 
                  domain={bubbleFilter ? ['auto', 'auto'] : [0, 'auto']}
                  axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} 
                />
                <ZAxis type="number" dataKey="playCount" range={[100, 1200]} />
                <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#cbd5e1' }} />
                
                {Array.from(new Set(fullData.map(d => d.talkType))).map(lvl => (
                  <Scatter 
                    key={lvl}
                    name={lvl} 
                    data={filteredBubbleData.filter(d => d.talkType === lvl)} 
                    fill={MODERN_PALETTE[lvl] || "#94a3b8"} 
                    fillOpacity={0.6} 
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <footer className="text-center py-20 border-t border-slate-200">
        <div className="inline-flex items-center gap-4 px-8 py-3 bg-white rounded-full text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] shadow-sm border border-slate-100">
          <span>{new Date().getFullYear()} NoBody Knows Curator</span>
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
          <span>Data Intelligence Lab</span>
        </div>
      </footer>
    </div>
  );
}