"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
const [password, setPassword] = useState("");
const router = useRouter();

const handleLogin = async () => {
const res = await fetch("/api/login", {
method: "POST",
body: JSON.stringify({ password }),
});

const data = await res.json();

if (res.ok) {
localStorage.setItem("auth", "true");
localStorage.setItem("token", "x9KfP2LmQa83zZ_2519.BJ"); // 👈 NEU
router.push("/");
} else {
alert("Falsches Passwort");
}
};

return (
<div className="h-screen flex items-center justify-center bg-black text-white">
<div className="p-6 border border-zinc-700">
<h1 className="mb-4">Login</h1>

<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="bg-zinc-800 p-2 mb-3 w-full"
/>

<button
onClick={handleLogin}
className="bg-blue-600 px-4 py-2"
>
Login
</button>
</div>
</div>
);
}
