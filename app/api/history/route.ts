import { NextResponse } from "next/server";

import {
saveMarketSnapshot,
loadMarketHistory
} from "@/lib/history/marketHistory";

export async function POST(req: Request) {
try {

const body = await req.json();

if (!body?.snapshot) {
return NextResponse.json({
ok: false,
error: "No snapshot"
});
}

await saveMarketSnapshot(
body.snapshot
);

return NextResponse.json({
ok: true
});

} catch (e) {

console.error(
"History POST error:",
e
);

return NextResponse.json({
ok: false
});
}
}

export async function GET() {

const history =
await loadMarketHistory();

return NextResponse.json(
history
);
}
