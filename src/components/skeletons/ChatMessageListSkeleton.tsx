import Skeleton from 'react-loading-skeleton';

export function ChatMessageListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}
        >
          <Skeleton
            circle
            width={32}
            height={32}
            className="flex-shrink-0"
          />
          <div className={`max-w-[70%] space-y-2 ${i % 2 === 0 ? 'order-first' : ''}`}>
            <Skeleton width={120} height={14} />
            <Skeleton width="100%" height={16} count={3} />
          </div>
        </div>
      ))}
    </div>
  );
}
