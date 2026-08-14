const Skeleton = ({ className = "", variant = "block" }) => (
  <div
    className={`skeleton ${
      variant === "circle" ? "rounded-full" : ""
    } ${className}`}
  />
);

export const SkeletonCard = ({ className = "" }) => (
  <div className={`card-surface p-5 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton variant="circle" className="h-9 w-9" />
    </div>
    <Skeleton className="h-7 w-16 mb-2" />
    <Skeleton className="h-3 w-28" />
  </div>
);

export const SkeletonList = ({ rows = 3, className = "" }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="card-surface p-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-10 w-10" />
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
