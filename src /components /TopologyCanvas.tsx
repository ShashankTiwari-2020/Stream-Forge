import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Truck, 
  ArrowRight, 
  AlertOctagon, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  Activity, 
  Workflow
} from 'lucide-react';
import { KafkaPartition, PythonWorker } from '../types';

interface TopologyCanvasProps {
  partitions: KafkaPartition[];
  workers: PythonWorker[];
  onSelectWorker: (workerId: number) => void;
  onSelectPartition: (partitionId: number) => void;
  selectedWorkerId: number | null;
  selectedPartitionId: number | null;
  isWorker4Crashed: boolean;
}

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  partitions,
  workers,
  onSelectWorker,
  onSelectPartition,
  selectedWorkerId,
  selectedPartitionId,
  isWorker4Crashed,
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Focus on worker #4 and worker #5 for detailed highlight
  const worker4 = workers.find(w => w.id === 4);
  const worker5 = workers.find(w => w.id === 5);
  const partition3 = partitions.find(p => p.id === 3); // Assigned to worker 4 initially
  const partition4 = partitions.find(p => p.id === 4); // Assigned to worker 5

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl overflow-hidden relative">
      {/* Topology Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2">
          <Workflow className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-slate-100 text-sm tracking-tight">
            Real-Time Distributed Topology & Partition Flow
          </h2>
          <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 font-mono border border-indigo-700/50">
            Kafka &bull; Faust Async &bull; RocksDB LSM
          </span>
        </div>

        {/* Live Status Legend */}
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Healthy Stream
          </span>
          {isWorker4Crashed && (
            <span className="flex items-center gap-1.5 text-rose-400 font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Rebalance: P-3 Migrated to Worker #5
            </span>
          )}
          <span className="text-slate-500 hidden sm:inline">
            Click nodes to inspect
          </span>
        </div>
      </div>

      {/* Interactive Topology Pipeline Stage Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch relative">
        
        {/* STAGE 1: IoT Fleet Producers */}
        <div 
          className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative transition-all hover:border-slate-700"
          onMouseEnter={() => setHoveredNode('producers')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-200">
                <Truck className="w-4 h-4 text-sky-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                  IoT Truck Fleet
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-sky-950 text-sky-400 px-1.5 py-0.5 rounded border border-sky-800/60">
                50,000 Units
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Sensors emit cold-chain telemetry every 10s. Keyed by <code className="text-sky-300 font-mono text-[10px]">truck_id</code>.
            </p>

            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Target Emit Rate:</span>
                <span className="text-sky-300 font-bold">5,000 msgs/s</span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Partition Hashing:</span>
                <span className="text-indigo-300">Murmur2 (Consistent)</span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Sensor Payload:</span>
                <span className="text-slate-300">Temp, GPS, Cargo</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Compression: Snappy</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Broadcasting
            </span>
          </div>
        </div>

        {/* STAGE 2: Apache Kafka Message Broker */}
        <div 
          className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative transition-all hover:border-slate-700"
          onMouseEnter={() => setHoveredNode('kafka')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-200">
                <Layers className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                  Apache Kafka
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-amber-950 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/60">
                20 Partitions
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Topic: <code className="text-amber-300 font-mono text-[10px]">fleet-telemetry-raw</code>
            </p>

            {/* Partition Mini Strip */}
            <div className="grid grid-cols-5 gap-1 mb-2">
              {partitions.map((p) => {
                const isSelected = selectedPartitionId === p.id;
                const isP3OrP4 = p.id === 3 || p.id === 4;
                const isAffected = isWorker4Crashed && p.id === 3;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPartition(p.id)}
                    className={`h-6 rounded text-[9px] font-mono flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-indigo-400 bg-indigo-900/80 text-white font-bold'
                        : isAffected
                        ? 'bg-rose-950/90 border border-rose-500/80 text-rose-300 animate-pulse'
                        : isP3OrP4
                        ? 'bg-amber-950/70 border border-amber-600/70 text-amber-300'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    title={`Partition ${p.id} - Lag: ${p.consumerLag} msgs - Assigned to Worker ${p.assignedWorkerId}`}
                  >
                    P{p.id}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 font-mono text-[10px]">
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Total Consumer Lag:</span>
                <span className={`font-bold ${isWorker4Crashed ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {partitions.reduce((acc, p) => acc + p.consumerLag, 0)} msgs
                </span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Rebalance Assignor:</span>
                <span className="text-slate-300">CooperativeSticky</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Brokers: 101, 102, 103</span>
            <span className="text-slate-400 font-mono">MinISR: 2</span>
          </div>
        </div>

        {/* STAGE 3: Faust Python Stream Processors (20 Workers) */}
        <div 
          className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative transition-all hover:border-slate-700"
          onMouseEnter={() => setHoveredNode('workers')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-200">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                  Python Faust Cluster
                </h3>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isWorker4Crashed 
                  ? 'bg-rose-950 text-rose-400 border-rose-800/60'
                  : 'bg-emerald-950 text-emerald-400 border-emerald-800/60'
              }`}>
                {workers.filter(w => w.status === 'ONLINE').length}/20 Online
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
              Asyncio event loop workers performing 5-min tumbling/hopping windows.
            </p>

            {/* Worker Visual Matrix (Showcase worker 4 failover to 5) */}
            <div className="space-y-1.5 mb-2">
              {/* Highlighted Worker 4 */}
              <div 
                onClick={() => onSelectWorker(4)}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  isWorker4Crashed
                    ? 'bg-rose-950/40 border-rose-600/80 text-rose-200'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                } ${selectedWorkerId === 4 ? 'ring-2 ring-rose-400' : ''}`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold flex items-center gap-1.5">
                    {isWorker4Crashed ? (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                    Worker #04
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isWorker4Crashed ? 'bg-rose-900/80 text-rose-200' : 'bg-emerald-900/40 text-emerald-400'
                  }`}>
                    {worker4?.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>Assigned: {worker4?.assignedPartitions.length ? worker4.assignedPartitions.map(p => `P-${p}`).join(', ') : 'None (Revoked)'}</span>
                  <span>CPU: {worker4?.cpuPercent}%</span>
                </div>
              </div>

              {/* Highlighted Worker 5 */}
              <div 
                onClick={() => onSelectWorker(5)}
                className={`p-2 rounded border cursor-pointer transition-all ${
                  isWorker4Crashed
                    ? 'bg-indigo-950/50 border-indigo-500/80 text-indigo-200 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                } ${selectedWorkerId === 5 ? 'ring-2 ring-indigo-400' : ''}`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Worker #05
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    isWorker4Crashed ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-400/40' : 'bg-emerald-900/40 text-emerald-400'
                  }`}>
                    {isWorker4Crashed ? 'CLAIMED P-3 & P-4' : 'ONLINE'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>Partitions: <strong className="text-white">{worker5?.assignedPartitions.map(p => `P-${p}`).join(', ')}</strong></span>
                  <span>Keys: {worker5?.rocksdb.totalKeys.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-mono">
              + 18 additional parallel workers (W-01..W-20)
            </p>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span>Runtime: CPython 3.12</span>
            <span className="text-emerald-400 font-mono">Asyncio loop</span>
          </div>
        </div>

        {/* STAGE 4: Embedded RocksDB State Store */}
        <div 
          className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative transition-all hover:border-slate-700"
          onMouseEnter={() => setHoveredNode('rocksdb')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-200">
                <Database className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                  RocksDB State Store
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800/60">
                LSM-Tree
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Embedded KV store holding rolling sum, count, min/max for all 50,000 trucks.
            </p>

            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Changelog Topic:</span>
                <span className="text-purple-300 truncate max-w-[110px]" title="__streamforge_state_changelog">
                  ..._changelog
                </span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">State Restore Speed:</span>
                <span className="text-emerald-400 font-bold">~45,000 keys/sec</span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Compaction Levels:</span>
                <span className="text-slate-300">L0 (MemTable) &rarr; L3</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Bloom Filter: 99.1%</span>
            <span className="text-purple-400 font-mono">Zero-Copy Replay</span>
          </div>
        </div>

        {/* STAGE 5: Downstream Aggregates & Alerting Sink */}
        <div 
          className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 flex flex-col justify-between relative transition-all hover:border-slate-700"
          onMouseEnter={() => setHoveredNode('sink')}
          onMouseLeave={() => setHoveredNode(null)}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-slate-200">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-300">
                  Aggregates & Alerting
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/60">
                Sink
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Emits calculated 5-minute rolling averages and cold-chain temperature alerts.
            </p>

            <div className="space-y-1.5 font-mono text-[10px]">
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Output Topic:</span>
                <span className="text-emerald-300 truncate max-w-[110px]" title="fleet-temperature-aggregates">
                  fleet-temp-aggregates
                </span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Evaluation Step:</span>
                <span className="text-slate-200">Every 10 seconds</span>
              </div>
              <div className="bg-slate-900/90 rounded p-1.5 border border-slate-800/80 flex justify-between items-center">
                <span className="text-slate-400">Excursion Threshold:</span>
                <span className="text-rose-400 font-bold">&gt; &plusmn;2.5&deg;C from Target</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>FastAPI Consumer</span>
            <span className="text-emerald-400 font-mono">Live WebSocket</span>
          </div>
        </div>

      </div>

      {/* Dynamic Rebalance Callout Banner when Worker #4 fails */}
      {isWorker4Crashed && (
        <div className="mt-3 bg-gradient-to-r from-rose-950/80 via-indigo-950/80 to-slate-950/80 border border-rose-500/40 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertOctagon className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-rose-200 flex items-center gap-2">
                Failover Active: Worker #04 Crashed &bull; Automatic Partition Migration Executed
              </p>
              <p className="text-slate-300 text-[11px] mt-0.5">
                Kafka Coordinator revoked <code className="text-amber-300 font-mono">Partition-03</code> and reassigned to <strong className="text-indigo-300">Worker #05</strong>. RocksDB changelog replay restored all 2,500 truck window states with <strong>0 dropped readings</strong> and <strong>0 duplicates</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[11px] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              State Recovered in 184ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
