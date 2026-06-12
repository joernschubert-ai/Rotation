export async function apiFetch(
url: string,
options: RequestInit = {}
) {
const token =
localStorage.getItem("token");

const headers = {
...(options.headers || {}),
Authorization: token
? `Bearer ${token}`
: "",
};

return fetch(url, {
...options,
headers,
});
}
