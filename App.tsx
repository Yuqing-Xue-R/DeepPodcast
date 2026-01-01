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
  Users, 
  MessageSquare, 
  Settings2,
  Target,
  Maximize2,
  Activity,
  Trophy,
  Filter,
  Sparkles
} from 'lucide-react';
import { 
  PODCAST_DATA, 
  CATEGORY_COLORS, 
  METRIC_LABELS 
} from './constants';
import { 
  PodcastEpisode, 
  MetricKey, 
  CategoryKey, 
  HistogramDataPoint 
} from './types';

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

// --- Custom Components ---

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
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-2xl text-sm min-w-[200px]">
        <p className="font-bold text-slate-800 mb-2 border-b pb-1">Range: {label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            if (category === 'none') {
              return (
                <div key={index} className="flex items-center justify-between gap-4">
                  <span className="text-slate-500">Episodes:</span>
                  <span className="text-slate-900 font-bold">{entry.value}</span>
                </div>
              );
            }
            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
            return (
              <div key={index} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-600 font-medium">{entry.name}:</span>
                </div>
                <span className="text-slate-900 font-bold">{entry.value} ({percentage}%)</span>
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
      <div className="bg-white p-4 border border-slate-200 shadow-xl rounded-2xl text-sm min-w-[240px]">
        <div className="flex items-center gap-2 mb-2 border-b pb-2">
          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black">{data.id}</span>
          <p className="font-bold text-slate-900 truncate italic">{data.title}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Reach (Plays):</span>
            <span className="text-slate-900 font-black">{data.playCount}w</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Efficiency (Rate):</span>
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

  // -- Chart #1 State --
  const [c1Metric, setC1Metric] = useState<MetricKey>('playCount');
  const [c1BucketSize, setC1BucketSize] = useState<number>(10);
  const [c1Category, setC1Category] = useState<CategoryKey>('none');

  // -- Chart #2 State --
  const [bubbleX, setBubbleX] = useState<string>('playCount');
  const [bubbleY, setBubbleY] = useState<string>('engagementRate');
  const [bubbleFilter, setBubbleFilter] = useState<string | null>(null);
  const [isLogScale, setIsLogScale] = useState<boolean>(false);

  // -- Chart #3 State --
  const [c3BucketSize, setC3BucketSize] = useState<number>(5);

  const c1Data = useMemo(() => {
    return generateHistogramData(fullData, c1Metric, c1Category, c1BucketSize);
  }, [fullData, c1Metric, c1Category, c1BucketSize]);

  const c3Data = useMemo(() => {
    return generateHistogramData(fullData, 'engagementRate', c1Category, c3BucketSize, true);
  }, [fullData, c1Category, c3BucketSize]);

  const filteredBubbleData = useMemo(() => {
    if (!bubbleFilter) return fullData;
    return fullData.filter(d => 
      d.talkType === bubbleFilter || d.episodeType === bubbleFilter
    );
  }, [fullData, bubbleFilter]);

  const top3Engaging = useMemo(() => {
    return [...fullData].sort((a, b) => b.engagementRate - a.engagementRate).slice(0, 3);
  }, [fullData]);

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
          <p className="text-slate-500 text-lg font-medium">
            Analytical curator for the "Nobody Knows" Podcast by Meng Yan.
          </p>
        </div>
      </header>

      {/* Chart #1: Play Count Distribution (Reach) */}
      <Card>
        <div className="p-8 md:p-10">
          <SectionHeading 
            icon={BarChart3} 
            title="Reach Distribution" 
            description="Analyzing the density and clustering of episode play counts."
          />
          
          <div className="flex flex-col gap-6 mb-10 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
            {/* Control Group Row */}
            <div className="flex flex-wrap items-start gap-12">
              {/* 1. Base Metric */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Base Metric</label>
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

              {/* 2. Mengyan Solo (Talk Style) */}
              <div className="space-y-3 border-l border-slate-200 pl-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Mengyan Solo</label>
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
                    activeColor="bg-indigo-600"
                  />
                </div>
              </div>

              {/* 3. Episode Type (Category) */}
              <div className="space-y-3 border-l border-slate-200 pl-10">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Episode Type</label>
                <div className="flex gap-2">
                  <PillButton 
                    label="Invest/General" 
                    isActive={c1Category === 'episodeType'} 
                    onClick={() => setC1Category('episodeType')} 
                    activeColor="bg-sky-600"
                  />
                </div>
              </div>
            </div>

            {/* Resolution Slider */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bin Resolution (Step Size)</label>
                <span className="text-slate-900 font-black text-xs px-3 py-1 bg-white rounded-lg shadow-sm border border-slate-100">
                  {c1BucketSize} {c1Metric === 'playCount' ? '10k' : 'Comments'}
                </span>
              </div>
              <input 
                type="range" 
                min={c1Metric === 'playCount' ? 2 : 50} 
                max={c1Metric === 'playCount' ? 50 : 2000} 
                step={c1Metric === 'playCount' ? 2 : 50} 
                value={c1BucketSize} 
                onChange={(e) => setC1BucketSize(Number(e.target.value))} 
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900" 
              />
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={c1Data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="binLabel" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                <Tooltip content={<CustomTooltip category={c1Category} />} cursor={{fill: '#f8fafc'}} />
                {Array.from(new Set(fullData.map(d => c1Category === 'none' ? 'totalCount' : d[c1Category as 'talkType' | 'episodeType']))).map((lvl) => (
                  <Bar 
                    key={lvl} 
                    dataKey={lvl} 
                    stackId="a" 
                    fill={c1Category === 'none' ? CATEGORY_COLORS.none : CATEGORY_COLORS[lvl]} 
                    radius={[4,4,0,0]} 
                    barSize={60} 
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Chart #2: Adaptive Discovery Bubble Chart */}
      <Card>
        <div className="p-8 md:p-10">
          <SectionHeading 
            icon={Target} 
            title="Discovery Matrix" 
            description="Uncovering correlations between reach and listener depth with adaptive zooming."
            colorClass="bg-rose-500"
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-10">
            <div className="lg:col-span-3 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Category Filter (Auto-Zoom)
                </label>
                <div className="flex flex-wrap gap-2">
                  <PillButton 
                    label="All Episodes" 
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

              <div className="flex flex-wrap items-center gap-8 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">X - Dimension</label>
                  <select 
                    value={bubbleX} 
                    onChange={(e) => setBubbleX(e.target.value)}
                    className="block w-48 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="playCount">Play Count</option>
                    <option value="commentCount">Comment Count</option>
                    <option value="engagementRate">Engagement Rate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Y - Dimension</label>
                  <select 
                    value={bubbleY} 
                    onChange={(e) => setBubbleY(e.target.value)}
                    className="block w-48 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none"
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
              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                   <Activity className="w-3 h-3" /> Note
                </span>
                <p className="text-[10px] font-medium text-rose-500 italic mt-1">
                  Bubble size represents total Play Count.
                </p>
              </div>
            </div>
          </div>

          <div className="h-[500px] border border-slate-50 rounded-3xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="5 5" stroke="#f1f5f9" />
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
                <ZAxis type="number" dataKey="playCount" range={[100, 1000]} />
                <Tooltip content={<BubbleTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                
                {Array.from(new Set(fullData.map(d => d.talkType))).map(lvl => (
                  <Scatter 
                    key={lvl}
                    name={lvl} 
                    data={filteredBubbleData.filter(d => d.talkType === lvl)} 
                    fill={CATEGORY_COLORS[lvl] || "#94a3b8"} 
                    fillOpacity={0.7} 
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
          <span>Open Intelligence v4.2</span>
        </div>
      </footer>
    </div>
  );
}