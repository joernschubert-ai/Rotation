export function validateEngineData(data: any) {

if (!data) return false;

if (!data.rotation) return false;
if (typeof data.rotation.rsSmall !== "number") return false;
if (typeof data.rotation.rsGrowth !== "number") return false;
if (typeof data.rotation.rsEqual !== "number") return false;

if (!data.marketData) return false;

return true;
}