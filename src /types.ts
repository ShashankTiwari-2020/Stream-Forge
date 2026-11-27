export interface KafkaPartition {
  id: number;
  leaderBroker: number;
  currentOffset: number;
  highWaterMark: number;
  consumerLag: number;
  assignedWorkerId: number | null;
  msgRatePerSec: number;
  totalEventsProcessed: number;
}

export type WorkerStatus = 'ONLINE' | 'CRASHED' | 'REBALANCING' | 'RECOVERING_STATE' | 'DRAINING';

export interface RocksDBState {
  totalKeys: number;
  memtableSizeMb: number;
  sstableCount: number;
  lsmCompactionLevel: number;
  changelogOffset: number;
  bloomFilterHitRate: number;
  walSizeBytes: number;
  lastCheckpointTime: string;
}

export interface PythonWorker {
  id: number;
  name: string;
  pid: number;
  status: WorkerStatus;
  assignedPartitions: number[];
  cpuPercent: number;
  memoryMb: number;
  eventLoopLatencyMs: number;
  processedPerSec: number;
  totalProcessed: number;
  rocksdb: RocksDBState;
  asyncioTasksActive: number;
  rebalanceCount: number;
  crashedAt?: string;
  recoveredAt?: string;
}

export interface TruckTelemetry {
  truckId: string;
  partition: number;
  cargoType: 'Frozen Seafood' | 'Vaccines & Pharma' | 'Dairy & Fresh Milk' | 'Organic Berries' | 'Poultry';
  targetTempC: number;
  currentTempC: number;
  rollingAvg5mC: number;
  minTemp5mC: number;
  maxTemp5mC: number;
  samplesInWindow: number;
  lastUpdated: string;
  route: string;
  status: 'NORMAL' | 'WARNING' | 'CRITICAL_EXCURSION';
}

export interface SystemMetrics {
  totalTrucks: number;
  targetEventRate: number; // e.g. 5000/s
  currentEventRate: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  totalProcessedCount: number;
  droppedCount: number; // strictly 0 for exactly-once!
  duplicatedCount: number; // strictly 0 for exactly-once!
  rebalancesTotal: number;
  activeWorkersCount: number;
  activePartitionsCount: number;
  totalLag: number;
  kafkaClusterState: 'HEALTHY' | 'DEGRADED' | 'REBALANCING';
}

export interface RebalanceEvent {
  id: string;
  timestamp: string;
  type: 'WORKER_CRASH' | 'REBALANCE_TRIGGER' | 'PARTITION_REVOKED' | 'PARTITION_ASSIGNED' | 'ROCKSDB_RESTORE' | 'EOS_CHECKPOINT';
  sourceWorker: string;
  targetWorker?: string;
  partitionId?: number;
  details: string;
  durationMs?: number;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiEndpoint {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  category: 'Telemetry Ingestion' | 'Interactive Queries' | 'Cluster Health' | 'RocksDB State';
  description: string;
  pythonDocstring: string;
  queryParams?: { key: string; defaultValue: string; description: string }[];
  pathParams?: { key: string; defaultValue: string; description: string; options?: string[] }[];
  defaultBody?: string;
  tags: string[];
}

export interface ApiExecutionResult {
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  data: any;
  requestUrl: string;
  method: HttpMethod;
  requestBody?: any;
  timestamp: string;
  routingHop?: {
    gatewayNode: string;
    resolvedPartition: number;
    targetWorkerNode: string;
    rocksDbAccess: string;
  };
}

