import { NextResponse } from "next/server";

export async function POST(req: Request) {
const { password } = await req.json();

if (password === process.env.APP_PASSWORD) {
return NextResponse.json({
success: true,
token: "my-secret-token-123" // 👈 einfach, reicht hier
});
}

return NextResponse.json({ success: false }, { status: 401 });
}