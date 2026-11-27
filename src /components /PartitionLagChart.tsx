import React from 'react';
import { Layers, Activity, Server, ArrowUpRight } from 'lucide-react';
import { KafkaPartition } from '../types';

interface PartitionLagChartProps {
  partitions: KafkaPartition[];
  onSelectPartition: (id: number) => void;
  selectedPartitionId: number | null;
  isWorker4Crashed: boolean;
}

export const PartitionLagChart: React.FC<PartitionLagChartProps> = ({
  partitions,
  onSelectPartition,
  selectedPartitionId,
  isWorker4Crashed,
}) => {
  const maxLag = Math.max(...partitions.map(p => p.consumerLag), 25);
  const totalLag = partitions.reduce((acc, p) => acc + p.consumerLag, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-4 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-100 text-sm tracking-tight flex items-center gap-2">
              Kafka Partitions Consumer Lag & Offset Stream
              <span className="text-xs font-mono font-normal text-slate-400">
                (20 Partitions &bull; Total Lag: {totalLag} msgs)
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Real-time delta between broker high water mark and Faust worker committed offsets
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Lag &lt; 20 (Healthy)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Rebalance Lag
          </span>
        </div>
      </div>

      {/* Lag Bar Graph for all 20 Partitions */}
      <div className="space-y-2">
        <div className="grid grid-cols-20 gap-1 items-end h-28 pt-4 pb-1 px-1 bg-slate-950 rounded-lg border border-slate-800/80 relative">
          {/* Background grid line */}
          <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-800 pointer-events-none" />

          {partitions.map((partition) => {
            const isSelected = selectedPartitionId === partition.id;
            const isAffected = isWorker4Crashed && partition.id === 3;
            const heightPercent = Math.min(100, Math.max(12, (partition.consumerLag / maxLag) * 100));

            return (
              <div
                key={partition.id}
                onClick={() => onSelectPartition(partition.id)}
                className="group relative flex flex-col items-center justify-end h-full cursor-pointer"
              >
                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isSelected
                      ? 'bg-indigo-400 ring-2 ring-indigo-300'
                      : isAffected
                      ? 'bg-gradient-to-t from-rose-600 to-amber-500 animate-pulse'
                      : partition.consumerLag > 15
                      ? 'bg-amber-500'
                      : 'bg-emerald-500/80 hover:bg-emerald-400'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 bg-slate-800 text-white text-[10px] font-mono px-2 py-1 rounded shadow-lg pointer-events-none z-20 whitespace-nowrap border border-slate-700">
                  <div>Partition {partition.id}</div>
                  <div>Lag: {partition.consumerLag} msgs</div>
                  <div>Worker: #{partition.assignedWorkerId ?? 'None'}</div>
                  <div>Offset: {partition.currentOffset.toLocaleString()}</div>
                </div>

                {/* Partition Label */}
                <span className={`text-[9px] font-mono mt-1 ${
                  isSelected ? 'text-indigo-300 font-bold' : isAffected ? 'text-rose-400 font-bold' : 'text-slate-500'
                }`}>
                  {partition.id}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected or Summary Partition Stats */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
        <div className="p-2 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-500 block text-[10px]">Active Topic:</span>
          <span className="text-slate-200 font-semibold truncate block">fleet-telemetry-raw</span>
        </div>
        <div className="p-2 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-500 block text-[10px]">Avg Ingest / Partition:</span>
          <span className="text-emerald-400 font-semibold">~250 msgs/s</span>
        </div>
        <div className="p-2 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-500 block text-[10px]">Replication Factor:</span>
          <span className="text-slate-200 font-semibold">3 (Rack-Aware)</span>
        </div>
        <div className="p-2 bg-slate-950 rounded border border-slate-800">
          <span className="text-slate-500 block text-[10px]">Kafka Consumer Protocol:</span>
          <span className="text-indigo-300 font-semibold">Cooperative Sticky</span>
        </div>
      </div>
    </div>
  );
};
