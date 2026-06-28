export default function Loading() {
  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-8">
      <div className="h-8 w-48 animate-pulse rounded-md bg-white/10" />
      <div className="h-64 animate-pulse rounded-lg border border-line bg-panel" />
    </main>
  );
}
