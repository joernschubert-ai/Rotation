"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);

const router = useRouter();

const handleLogin = async () => {
try {
setLoading(true);

const res = await fetch("/api/login", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
password
})
});

if (!res.ok) {
alert("Falsches Passwort");
return;
}

localStorage.setItem("auth", "true");

router.push("/");
} catch (err) {
alert("Login Fehler");
} finally {
setLoading(false);
}
};

return (
<div className="h-screen flex items-center justify-center bg-black text-white">
<div className="p-6 border border-zinc-700 w-[320px]">
<h1 className="mb-4 text-xl">
Login
</h1>

<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="bg-zinc-800 p-2 mb-3 w-full"
placeholder="Passwort"
/>

<button
onClick={handleLogin}
disabled={loading}
className="bg-blue-600 px-4 py-2 w-full"
>
{loading ? "Prüfe..." : "Login"}
</button>
</div>
</div>
);
}
