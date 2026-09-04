import { spawn } from "node:child_process";

const incoming = process.argv.slice(2);
let hostname = "0.0.0.0";
let port = "3000";

for (let index = 0; index < incoming.length; index += 1) {
  const argument = incoming[index];
  if (argument === "--host" || argument === "--hostname" || argument === "-H") {
    hostname = incoming[index + 1] || hostname;
    index += 1;
  } else if (argument === "--port" || argument === "-p") {
    port = incoming[index + 1] || port;
    index += 1;
  }
}

const child = spawn("next", ["dev", "--hostname", hostname, "--port", port], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 0));
