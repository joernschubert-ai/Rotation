import { NextResponse } from "next/server";

export async function POST(req: Request) {
const { password } = await req.json();

console.log("INPUT:", password);
console.log("ENV:", process.env.APP_PASSWORD);

if (password?.trim() === process.env.APP_PASSWORD?.trim()) {
return NextResponse.json({
success: true,
token: "my-secret-token-123"
});
}

return NextResponse.json({ success: false }, { status: 401 });
}