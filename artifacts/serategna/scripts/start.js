const net = require("net");
const { spawn } = require("child_process");

const DEFAULT_PORT = Number(process.env.EXPO_DEV_PORT || "8082");
const MAX_PORT = 65535;
const hostMode = process.argv[2] || "lan";

function canConnectToPort(port, host) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });

    const finish = (result) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(250);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function isPortFree(port) {
  const [ipv4Taken, ipv6Taken] = await Promise.all([
    canConnectToPort(port, "127.0.0.1"),
    canConnectToPort(port, "::1"),
  ]);

  if (ipv4Taken || ipv6Taken) {
    return false;
  }

  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen({ port, host: "0.0.0.0", exclusive: true });
  });
}

async function findOpenPort(startPort) {
  let port = startPort;

  while (port <= MAX_PORT) {
    // eslint-disable-next-line no-await-in-loop
    if (await isPortFree(port)) {
      return port;
    }
    port += 1;
  }

  throw new Error(`No open port found starting at ${startPort}`);
}

async function main() {
  const port = await findOpenPort(DEFAULT_PORT);

  console.log(
    port === DEFAULT_PORT
      ? `Starting Expo on preferred port ${port}.`
      : `Port ${DEFAULT_PORT} is busy, starting Expo on ${port} instead.`,
  );

  const expoCliPath = require.resolve("expo/bin/cli");
  const child = spawn(
    process.execPath,
    [expoCliPath, "start", "--host", hostMode, "--port", String(port)],
    {
      stdio: ["inherit", "pipe", "pipe"],
      cwd: process.cwd(),
      env: {
        ...process.env,
        EXPO_DEV_PORT: String(port),
      },
    },
  );

  child.stdout?.on("data", (chunk) => {
    process.stdout.write(chunk);
  });

  child.stderr?.on("data", (chunk) => {
    process.stderr.write(chunk);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
