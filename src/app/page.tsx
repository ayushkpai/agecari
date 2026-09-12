import PantryInventory from "@/components/pantry-inventory";

export default function Home() {
  return (
    <div className="flex flex-1 bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full justify-center">
        <PantryInventory />
      </main>
    </div>
  );
}