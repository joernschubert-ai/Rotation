import { NextResponse } from "next/server";

export async function POST(req: Request) {
try {
const { password } = await req.json();

const appPassword = process.env.APP_PASSWORD;

if (!appPassword) {
return NextResponse.json(
{ error: "APP_PASSWORD missing" },
{ status: 500 }
);
}

if (password?.trim() === appPassword.trim()) {
return NextResponse.json({
success: true
});
}

return NextResponse.json(
{ success: false },
{ status: 401 }
);
} catch (error) {
return NextResponse.json(
{ success: false },
{ status: 500 }
);
}
}
