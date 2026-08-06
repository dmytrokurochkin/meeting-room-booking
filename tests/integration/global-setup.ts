import { execSync, spawn, type ChildProcess } from "node:child_process";
import { TEST_APP_PORT, TEST_APP_URL, TEST_DATABASE_URL } from "./env";

async function waitForServer(logs: string[]): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      await fetch(TEST_APP_URL);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }
  throw new Error(`Test app did not start in time. Server output:\n${logs.join("")}`);
}

export default async function setup() {
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });

  const logs: string[] = [];
  const server: ChildProcess = spawn(`npx next dev -p ${TEST_APP_PORT}`, {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    shell: true,
  });
  server.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  server.stderr?.on("data", (chunk) => logs.push(String(chunk)));

  await waitForServer(logs);

  return async () => {
    // `shell: true` wraps the process in cmd.exe on Windows, so a plain kill() only
    // kills the shell and leaves the actual `next dev` process (and the port) behind.
    // taskkill /T kills the whole tree instead.
    if (process.platform === "win32" && server.pid) {
      try {
        execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: "ignore" });
      } catch {
        // already exited
      }
    } else {
      server.kill();
    }
  };
}
