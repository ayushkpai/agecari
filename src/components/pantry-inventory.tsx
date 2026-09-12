"use client";

import { useSyncExternalStore, useState } from "react";

type PantryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

const STORAGE_KEY = "agecari-pantry";
const CHANGE_EVENT = "agecari-pantry-change";

const EMPTY: PantryItem[] = [];

let snapshot: PantryItem[] | null = null;

function getSnapshot(): PantryItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (snapshot !== null) return snapshot;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    snapshot = raw ? (JSON.parse(raw) as PantryItem[]) : EMPTY;
  } catch {
    snapshot = EMPTY;
  }
  return snapshot;
}

function subscribe(onStoreChange: () => void): () => void {
  function handleChange() {
    snapshot = null;
    onStoreChange();
  }
  window.addEventListener(CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function writeItems(next: PantryItem[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  snapshot = next;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const UNIT_OPTIONS = ["item", "g", "kg", "ml", "l", "cup", "tbsp", "tsp"];

export default function PantryInventory() {
  const items: PantryItem[] = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY,
  );
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("item");

  function addItem(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const qty = quantity.trim() === "" ? 1 : Number(quantity);
    const item: PantryItem = {
      id: crypto.randomUUID(),
      name: trimmed,
      quantity: Number.isFinite(qty) ? qty : 1,
      unit,
    };
    writeItems([...items, item]);
    setName("");
    setQuantity("");
    setUnit("item");
  }

  function removeItem(id: string) {
    writeItems(items.filter((item) => item.id !== id));
  }

  function changeQuantity(id: string, delta: number) {
    writeItems(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item,
      ),
    );
  }

  const totalItems = items.length;
  const lowStock = items.filter((item) => item.quantity < 2);

  return (
    <div className="flex flex-1 w-full max-w-3xl flex-col items-start gap-8 px-6 py-16 sm:px-16">
      <header className="flex w-full flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Pantry</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {totalItems === 0
            ? "Your pantry is empty. Add something below."
            : `${totalItems} item${totalItems === 1 ? "" : "s"} tracked${
                lowStock.length > 0 ? `, ${lowStock.length} running low` : ""
              }.`}
        </p>
      </header>

      <form
        onSubmit={addItem}
        className="flex w-full flex-col gap-3 rounded-2xl border border-black/[.08] bg-zinc-50 p-4 dark:border-white/[.12] dark:bg-white/[.04] sm:flex-row"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name (e.g. Olive oil)"
          className="flex-1 rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/[.12] dark:bg-zinc-900"
        />
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Qty"
            className="w-24 rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/[.12] dark:bg-zinc-900"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-lg border border-black/[.08] bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-white/[.12] dark:bg-zinc-900"
          >
            {UNIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="w-full rounded-2xl border border-dashed border-black/[.12] p-8 text-center text-sm text-zinc-500 dark:border-white/[.15]">
          Nothing here yet.
        </p>
      ) : (
        <ul className="flex w-full flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <span
                  className={`text-sm ${
                    item.quantity === 0
                      ? "text-red-600 dark:text-red-400"
                      : item.quantity < 2
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {item.quantity} {item.unit}
                  {item.quantity === 0
                    ? " · empty"
                    : item.quantity < 2
                      ? " · running low"
                      : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeQuantity(item.id, 1)}
                  aria-label={`Increase ${item.name}`}
                  className="h-8 w-8 rounded-lg border border-black/[.08] text-sm hover:bg-zinc-100 dark:border-white/[.12] dark:hover:bg-white/[.06]"
                >
                  +
                </button>
                <button
                  onClick={() => changeQuantity(item.id, -1)}
                  aria-label={`Decrease ${item.name}`}
                  className="h-8 w-8 rounded-lg border border-black/[.08] text-sm hover:bg-zinc-100 dark:border-white/[.12] dark:hover:bg-white/[.06]"
                >
                  −
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="h-8 rounded-lg px-3 text-sm text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}