import MapView from "@/components/MapView";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="z-[1200] flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 shadow-sm">
        <h1 className="text-base font-semibold tracking-tight text-slate-900">
          Zahle Building Registry
        </h1>
      </header>
      <main className="flex flex-1 flex-col overflow-hidden">
        <MapView />
      </main>
    </div>
  );
}
