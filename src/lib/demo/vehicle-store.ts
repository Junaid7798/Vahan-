import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { VehicleRecord } from "@/lib/demo/portal-types";

const storePath = path.join(process.cwd(), "data", "demo-vehicles.json");

async function ensureStore() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

export async function readVehicleStore(): Promise<VehicleRecord[]> {
  await ensureStore();

  try {
    const raw = await readFile(storePath, "utf8");
    return JSON.parse(raw) as VehicleRecord[];
  } catch {
    return [];
  }
}

export async function writeVehicleStore(records: VehicleRecord[]) {
  await ensureStore();
  await writeFile(storePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}
