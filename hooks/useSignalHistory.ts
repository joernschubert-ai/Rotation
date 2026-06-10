"use client";

import { useEffect, useState } from "react";

export function useSignalHistory() {
const [history, setHistory] = useState<any[]>([]);

async function load() {
try {
const res = await fetch("/api/signal");
const json = await res.json();
setHistory(json);
} catch (e) {
console.error("Load history error:", e);
}
}

useEffect(() => {
load();
}, []);

return history;
}