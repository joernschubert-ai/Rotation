export async function apiFetch(url: string, options: any = {}) {

let token = localStorage.getItem("token");

const headers: any = {
...(options.headers || {}),
};

if (token) {
headers["Authorization"] = `Bearer ${token}`;
}

let res = await fetch(url, {
...options,
headers
});

// 🔴 TOKEN ABGELAUFEN
if (res.status === 401) {

const refreshed = await refreshToken();

if (!refreshed) {
// Logout
localStorage.removeItem("token");
localStorage.removeItem("refreshToken");
window.location.href = "/login";
return null;
}

// 🔥 RETRY mit neuem Token
token = localStorage.getItem("token");

headers["Authorization"] = `Bearer ${token}`;

res = await fetch(url, {
...options,
headers
});
}

return res;
}

async function refreshToken() {

const refreshToken = localStorage.getItem("refreshToken");

if (!refreshToken) return false;

try {

const res = await fetch("/api/refresh", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({ refreshToken })
});

if (!res.ok) return false;

const data = await res.json();

localStorage.setItem("token", data.accessToken);

return true;

} catch (e) {
return false;
}
}
