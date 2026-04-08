import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getInitialPortalState, normalizePortalState } from "@/lib/demo/portal-state";
import { DemoPortalState } from "@/lib/demo/portal-types";

const storePath = path.join(process.cwd(), "data", "demo-portal-state.json");

async function ensureStoreDirectory() {
  await mkdir(path.dirname(storePath), { recursive: true });
}

export async function readPortalStore(): Promise<DemoPortalState> {
  await ensureStoreDirectory();

  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as DemoPortalState;
    const normalized = normalizePortalState(parsed);

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      await writePortalStore(normalized);
    }

    return normalized;
  } catch {
    const initialState = getInitialPortalState();
    await writePortalStore(initialState);
    return initialState;
  }
}

export async function writePortalStore(state: DemoPortalState) {
  await ensureStoreDirectory();
  await writeFile(storePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function updatePortalStore(
  updater: (state: DemoPortalState) => DemoPortalState | Promise<DemoPortalState>
) {
  const currentState = await readPortalStore();
  const nextState = await updater(currentState);
  await writePortalStore(nextState);
  return nextState;
}
