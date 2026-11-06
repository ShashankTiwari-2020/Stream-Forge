import React, { useState } from 'react';
import { 
  Database, 
  Layers, 
  HardDrive, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Search,
  BookOpen
} from 'lucide-react';
import { PythonWorker, TruckTelemetry } from '../types';

interface StateStoreInspectorProps {
  selectedWorker?: PythonWorker;
  trucks: TruckTelemetry[];
}

export const StateStoreInspector: React.FC<StateStoreInspectorProps> = ({
  selectedWorker,
  trucks,
}) => {
  const [activeTab, setActiveTab] = useState<'LSM_TREE' | 'KV_EXPLORER' | 'CHANGELOG_SYNC' | 'EOS_SPEC'>('LSM_TREE');
  const [searchKey, setSearchKey] = useState('');

  const worker = selectedWorker || {
    id: 4,
    name: 'faust-worker-04',
    pid: 24804,
    status: 'ONLINE',
    assignedPartitions: [3],
    cpuPercent: 32,
    memoryMb: 438,
    eventLoopLatencyMs: 1.4,
    processedPerSec: 255,
    totalProcessed: 1420500,
    asyncioTasksActive: 18,
    rebalanceCount: 1,
    rocksdb: {
      totalKeys: 2500,
      memtableSizeMb: 9.8,
      sstableCount: 15,
      lsmCompactionLevel: 3,
      changelogOffset: 891420,
      bloomFilterHitRate: 98.9,
      walSizeBytes: 2097152,
      lastCheckpointTime: '11:43:50',
    }
  };

  const filteredTrucks = trucks.filter(t => {
    if (!searchKey) return true;
    return t.truckId.toLowerCase().includes(searchKey.toLowerCase());
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-2">
              Embedded RocksDB State Store Inspector
              <span className="text-xs font-mono font-normal text-purple-400">
                [Worker #{worker.id} &bull; {worker.name}]
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Low-latency Log-Structured Merge Tree (LSM) embedded inside Python worker process
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('LSM_TREE')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'LSM_TREE' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LSM Architecture
          </button>
          <button
            onClick={() => setActiveTab('KV_EXPLORER')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'KV_EXPLORER' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            KV Key Explorer
          </button>
          <button
            onClick={() => setActiveTab('CHANGELOG_SYNC')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'CHANGELOG_SYNC' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Changelog & Recovery
          </button>
          <button
            onClick={() => setActiveTab('EOS_SPEC')}
            className={`px-3 py-1 rounded-md transition-all ${
              activeTab === 'EOS_SPEC' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Exactly-Once (2PC)
          </button>
        </div>
      </div>

      {/* TAB 1: LSM Architecture Visualizer */}
      {activeTab === 'LSM_TREE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* MemTable (In-Memory Buffer) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">MemTable (RAM)</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Active SkipList
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Buffers incoming truck sensor updates in memory before sequential disk flush.
              </p>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Size in RAM:</span>
                  <span className="text-slate-200 font-bold">{worker.rocksdb.memtableSizeMb} MB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Write Speed:</span>
                  <span className="text-emerald-400">&gt; 120,000 ops/s</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Max Write Buffer:</span>
                  <span className="text-slate-300">64 MB</span>
                </div>
              </div>
            </div>

            {/* Write-Ahead Log (WAL) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">Write-Ahead Log</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
                  Crash Durability
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Append-only log on disk ensuring zero uncommitted state loss if worker crashes.
              </p>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>WAL Size:</span>
                  <span className="text-slate-200 font-bold">{(worker.rocksdb.walSizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sync Policy:</span>
                  <span className="text-slate-300">Async Flush on 2PC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Last Sync:</span>
                  <span className="text-slate-400">{worker.rocksdb.lastCheckpointTime}</span>
                </div>
              </div>
            </div>

            {/* SSTables (Disk Layers) */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">SSTables (Disk)</span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                  Compaction L0-L3
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Sorted String Tables on NVMe disk holding historical 5-minute rolling buckets.
              </p>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Active SSTables:</span>
                  <span className="text-purple-300 font-bold">{worker.rocksdb.sstableCount} files</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Level:</span>
                  <span className="text-slate-300">Level {worker.rocksdb.lsmCompactionLevel}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Partition Keys:</span>
                  <span className="text-white font-bold">{worker.rocksdb.totalKeys.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Bloom Filter & Block Cache */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-200">Bloom Filters</span>
                <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/40">
                  Cache 99.4%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Probabilistic bit arrays eliminating 99% of negative disk reads during window lookups.
              </p>
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>Hit Rate:</span>
                  <span className="text-emerald-400 font-bold">{worker.rocksdb.bloomFilterHitRate}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bits per Key:</span>
                  <span className="text-slate-300">10 bits (0.01% FPR)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Block Cache:</span>
                  <span className="text-slate-200">128 MB LRU</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-300">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Storage Directory: <code className="text-purple-300 font-mono">/var/lib/faust/v1/tables/truck_temp_5min_window/p{worker.assignedPartitions[0] ?? 0}</code></span>
            </div>
            <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              LSM Auto-Compaction Ready
            </span>
          </div>
        </div>
      )}

      {/* TAB 2: KV Key Explorer */}
      {activeTab === 'KV_EXPLORER' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Truck Key (e.g. TRK-10000)..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-purple-500 w-full"
              />
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing window entries in Worker #{worker.id}'s local RocksDB
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {filteredTrucks.slice(0, 6).map((truck) => (
              <div
                key={truck.truckId}
                className="p-2.5 bg-slate-950 border border-slate-800/90 rounded-lg font-mono text-xs hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-1 text-slate-200">
                  <span className="text-purple-400 font-bold">Key: "{truck.truckId}"</span>
                  <span className="text-[10px] text-slate-500">Partition {truck.partition}</span>
                </div>
                <div className="bg-slate-900/90 p-2 rounded text-[11px] text-slate-300 space-y-0.5 border border-slate-800/60">
                  <div className="text-slate-400">// RocksDB Faust Table Value Record:</div>
                  <div>sum: <span className="text-emerald-400">{(truck.rollingAvg5mC * truck.samplesInWindow).toFixed(1)}</span></div>
                  <div>count: <span className="text-sky-400">{truck.samplesInWindow}</span></div>
                  <div>rolling_avg: <span className="text-amber-400 font-bold">{truck.rollingAvg5mC}&deg;C</span></div>
                  <div>target_temp: <span className="text-slate-300">{truck.targetTempC}&deg;C</span></div>
                  <div>window_span: <span className="text-purple-300">300s (Hopping step: 10s)</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Changelog Sync & Recovery */}
      {activeTab === 'CHANGELOG_SYNC' && (
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Kafka Compacted State Changelog Topic
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              Every mutation to the local RocksDB table emits a changelog message to Kafka topic{' '}
              <code className="text-amber-300 font-mono">__streamforge-fleet-processor-truck_temp_5min_window-changelog</code>.
              Because this topic is compacted by <code className="text-sky-300 font-mono">truck_id</code>, only the latest window state per truck is retained long-term.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Current Changelog Offset:</span>
                <span className="text-amber-300 font-bold text-sm">{worker.rocksdb.changelogOffset.toLocaleString()}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Replay Rebalance Latency:</span>
                <span className="text-emerald-400 font-bold text-sm">&lt; 190 milliseconds</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block">Compaction Policy:</span>
                <span className="text-purple-300 font-bold text-sm">Log Compacted</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg">
            <h4 className="font-semibold text-indigo-200 mb-1">
              Failover Protocol Workflow (Worker #4 &rarr; Worker #5):
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
              <li>Faust Worker #4 experiences failure (e.g. OOM, SIGKILL, host crash).</li>
              <li>Kafka broker coordinator detects missed heartbeat within session timeout (3,000ms).</li>
              <li>Cooperative Sticky Assignor triggers cluster rebalance without stopping healthy partitions.</li>
              <li>Worker #5 claims Partition 3/4 and initiates fast parallel changelog consumer replay.</li>
              <li>2,500 truck keys restored into Worker #5's local RocksDB instance within ~180ms. Processing resumes smoothly!</li>
            </ol>
          </div>
        </div>
      )}

      {/* TAB 4: Exactly-Once (EOS) Spec */}
      {activeTab === 'EOS_SPEC' && (
        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Two-Phase Commit (2PC) & Transactional Producer ID
            </h3>
            <p className="text-slate-400 text-[11px] leading-relaxed mb-3">
              StreamForge guarantees that no sensor reading is ever dropped and no window aggregation is ever double-counted.
              This is achieved by synchronizing Kafka Producer Transactions with RocksDB atomic batch writes.
            </p>

            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-300 text-[10px] font-bold">1</span>
                <div>
                  <strong className="text-white font-sans">Atomic RocksDB WriteBatch:</strong>
                  <div className="text-slate-400 text-[10px]">Updates to truck rolling sum/count are prepared in memory before committing.</div>
                </div>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-indigo-900 text-indigo-300 text-[10px] font-bold">2</span>
                <div>
                  <strong className="text-white font-sans">Kafka Transactional Coordinator:</strong>
                  <div className="text-slate-400 text-[10px]">The aggregated output message and consumer offset are written in the same Kafka transaction.</div>
                </div>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300 text-[10px] font-bold">3</span>
                <div>
                  <strong className="text-white font-sans">Simultaneous Checkpoint Commit:</strong>
                  <div className="text-slate-400 text-[10px]">Both Kafka transaction commit marker and RocksDB WAL checkpoint succeed together. If failure strikes mid-flight, uncommitted state is discarded automatically.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
