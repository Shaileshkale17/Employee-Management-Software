const Skeleton = ({ className = "" }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-9 rounded-xl" />
    </div>
    <Skeleton className="h-7 w-16 mb-2" />
    <Skeleton className="h-3 w-28" />
  </div>
);

export const SkeletonList = ({ rows = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
