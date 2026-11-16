import RegistryApp from "@/components/RegistryApp";

/** The map. Only approved, signed-in engineers reach it (src/proxy.ts). */
export default function Home() {
  return <RegistryApp />;
}
