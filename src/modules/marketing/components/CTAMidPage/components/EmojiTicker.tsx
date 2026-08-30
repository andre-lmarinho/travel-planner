"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import { GridMask } from "./GridMask";

type Item = { id: number; emoji: string };

const POOL = [
  "✈️",
  "🗺️",
  "🏨",
  "🚌",
  "🌅",
  "⛵",
  "🏝️",
  "🎒",
  "🚆",
  "🧳",
  "🛂",
  "🎫",
  "🌋",
  "🏔️",
  "🚗",
  "⛽",
  "🚲",
  "🕌",
  "🛥️",
  "🗽",
  "🏖️",
  "🏕️",
  "🌇",
  "📸",
  "🛃",
  "🗼",
  "🏟️",
  "⛩️",
  "🏛️",
  "🌉",
  "🛫",
  "🧭",
  "🗿",
  "🛳️",
  "🚠",
  "🚁",
  "🏄‍♂️",
] as const;

export function EmojiTicker() {
  const [items, setItems] = useState<Item[]>(() => POOL.slice(0, 8).map((emoji, i) => ({ id: i, emoji })));

  const nextId = useRef(items.length);
  const nextIndex = useRef(8);

  useEffect(() => {
    const t = setInterval(() => {
      const emoji = POOL[nextIndex.current % POOL.length];
      nextIndex.current += 1;

      setItems((prev) => [{ id: nextId.current++, emoji }, ...prev].slice(0, 8));
    }, 2400);

    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative self-center overflow-hidden rounded-xl">
      <GridMask />
      <div className="grid grid-cols-4 grid-rows-[max-content_max-content] content-center justify-items-center gap-4 text-5xl">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((it) => (
            <motion.span
              key={it.id}
              layout="position"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              aria-hidden="true"
              className="p-2 leading-none">
              {it.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
