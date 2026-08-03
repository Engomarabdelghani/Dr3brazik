export function ProductCardSkeleton() {
  return (
    <div className="card-luxe overflow-hidden">
      <div className="skeleton aspect-[4/5] w-full" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-1/2" />
      </div>
    </div>
  );
}

export function TextSkeleton({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
  return <div className="skeleton" style={{ width, height }} />;
}
