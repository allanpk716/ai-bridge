import Skeleton from 'react-loading-skeleton';

export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={24} />
        <Skeleton width={80} height={32} />
      </div>
      <Skeleton width="100%" height={16} count={2} />
      <Skeleton width="60%" height={16} />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-4 p-3 border-b">
        <Skeleton width="20%" height={20} count={4} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          <Skeleton width="20%" height={16} />
          <Skeleton width="30%" height={16} />
          <Skeleton width="25%" height={16} />
          <Skeleton width="15%" height={16} />
          <Skeleton width={50} height={32} />
        </div>
      ))}
    </div>
  );
}
