import React from 'react';
import { WorkerNode, PartitionInfo, ChaosEventLog } from '../types/stream';
import { streamEngine } from '../services/streamEngine';
import { AlertOctagon, RotateCcw, Clock, ShieldCheck, Terminal } from 'lucide-react';

interface ChaosLabViewProps {
  workers: WorkerNode[];
  partitions: PartitionInfo[];
  chaosLogs: ChaosEventLog[];
}

export const ChaosLabView: React.FC<ChaosLabViewProps> = ({
  workers,
  partitions,
  chaosLogs
}) => {
  const worker4 = workers.find(w => w.id === 4);
  const worker5 = workers.find(w => w.id === 5);
  const partition4 = partitions.find(p => p.partitionId === 4);

  const handleKillWorker4 = () => {
    streamEngine.killWorker(4);
  };

  const handleReviveWorker4 = () => {
    streamEngine.reviveWorker(4);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner explaining the test scenario from problem statement */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded">
                Week 3 Core Experiment
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-300">Fault Tolerance & RocksDB State Restoration</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Automated Partition Rebalance & Stateful Changelog Replay
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              When Worker #4 terminates mid-calculation, StreamForge detects the heartbeat failure, triggers a Kafka consumer group rebalance, reassigns Partition 4 to Worker #5, and restores state from the RocksDB changelog topic without dropping a single sensor reading or producing duplicate calculations.
            </p>
          </div>

          {/* Action triggers */}
          <div className="flex items-center gap-3 shrink-0">
            {worker4?.status === 'crashed' ? (
              <button
                onClick={handleReviveWorker4}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Revive Worker #4 & Reclaim Partition</span>
              </button>
            ) : (
              <button
                onClick={handleKillWorker4}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Inject Chaos: Kill Worker Node #4</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time State Comparison (Worker #4 vs Worker #5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Worker 4 Card */}
        <div className={`p-4 rounded-xl border ${worker4?.status === 'crashed' ? 'bg-rose-950/20 border-rose-800' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${worker4?.status === 'crashed' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <h3 className="font-mono font-bold text-slate-100">Worker Node #4 (Target)</h3>
            </div>
            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${worker4?.status === 'crashed' ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
              {worker4?.status}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Assigned Partitions:</span>
              <span className="font-mono text-slate-200">
                {worker4?.assignedPartitions.length ? worker4.assignedPartitions.map(p => `P${p}`).join(', ') : 'None (Revoked)'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Throughput:</span>
              <span className="font-mono text-slate-200">{worker4?.throughput} msg/s</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Local RocksDB State:</span>
              <span className="font-mono text-slate-200">{worker4?.status === 'crashed' ? 'Terminated / Offline' : `${worker4?.rocksDbSizeMb} MB Active`}</span>
            </div>
          </div>
        </div>

        {/* Worker 5 Card (Rebalance Target) */}
        <div className={`p-4 rounded-xl border ${worker5?.assignedPartitions.includes(4) ? 'bg-indigo-950/20 border-indigo-700 shadow-lg shadow-indigo-950/30' : 'bg-slate-900 border-slate-800'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${worker5?.status === 'recovering' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <h3 className="font-mono font-bold text-slate-100">Worker Node #5 (Failover Target)</h3>
            </div>
            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${worker5?.status === 'recovering' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'}`}>
              {worker5?.status}
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Assigned Partitions:</span>
              <span className="font-mono text-indigo-300 font-semibold">
                {worker5?.assignedPartitions.map(p => `P${p}`).join(', ')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Partition 4 Status:</span>
              <span className="font-mono text-slate-200">
                {partition4?.currentWorkerId === 5 ? 'Reassigned & Processing' : 'Hosted on Worker #4'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">State Integrity:</span>
              <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Data Loss (Changelog Verified)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distributed Systems Lifecycle Sequence */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          Fault Recovery & State Restoration Lifecycle
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono mb-1">PHASE 1</div>
            <h4 className="font-semibold text-slate-200 mb-1">Failure Detection</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Worker #4 heartbeat stops. Kafka Group Coordinator triggers rebalance after session.timeout.ms (1,500ms).
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono mb-1">PHASE 2</div>
            <h4 className="font-semibold text-slate-200 mb-1">Partition Rebalance</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Kafka coordinator executes sticky partition assignment. Partition 4 is migrated to Worker #5.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono mb-1">PHASE 3</div>
            <h4 className="font-semibold text-slate-200 mb-1">RocksDB Changelog Replay</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Worker #5 initializes local RocksDB instance and replays Kafka topic <code className="text-indigo-400">streamforge-truck-avg-changelog</code>.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-mono mb-1">PHASE 4</div>
            <h4 className="font-semibold text-slate-200 mb-1">Steady State Resumed</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              5-minute rolling averages for Trucks 4000-4999 seamlessly continue with zero lost sensor readings.
            </p>
          </div>
        </div>
      </div>

      {/* Live Event Log */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            Distributed Systems Audit Log
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">{chaosLogs.length} events logged</span>
        </div>

        <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono text-xs pr-2">
          {chaosLogs.map(log => {
            const dateStr = new Date(log.timestamp * 1000).toLocaleTimeString();
            let color = 'text-slate-400';
            if (log.type === 'worker_kill') color = 'text-rose-400 font-semibold';
            if (log.type === 'rebalance_start') color = 'text-amber-400';
            if (log.type === 'partition_assigned') color = 'text-cyan-400';
            if (log.type === 'rocksdb_replay') color = 'text-indigo-300';
            if (log.type === 'steady_state') color = 'text-emerald-400';
            if (log.type === 'worker_revived') color = 'text-emerald-300';

            return (
              <div key={log.id} className="p-2 bg-slate-950/70 rounded border border-slate-800/60 flex items-start gap-2">
                <span className="text-slate-500 shrink-0 tabular-nums">[{dateStr}]</span>
                <span className={color}>{log.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
