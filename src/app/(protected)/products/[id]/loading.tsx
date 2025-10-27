export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 h-[400px] bg-muted rounded-md" />
        <div className="lg:col-span-7 space-y-4">
          <div className="h-8 bg-muted rounded w-3/4" />
          <div className="h-5 bg-muted rounded w-1/3" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-10 bg-muted rounded w-40" />
        </div>
      </div>
    </div>
  );
}
