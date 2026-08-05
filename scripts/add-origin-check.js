const fs = require("fs");
const path = require("path");

const API_DIR = path.join(process.cwd(), "app", "api");

const IMPORT =
  'import { verifyRequestOrigin } from "@/app/libs/security/verifyRequestOrigin";';

const SNIPPET = `const originError = verifyRequestOrigin(request);

    if (originError) {
      return originError;
    }`;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full);
      continue;
    }

    if (!entry.name.endsWith(".ts")) continue;

    let code = fs.readFileSync(full, "utf8");

    if (
      !code.includes("export async function POST") &&
      !code.includes("export async function PATCH") &&
      !code.includes("export async function DELETE")
    ) {
      continue;
    }

    let changed = false;

    if (!code.includes("verifyRequestOrigin")) {
      const imports = code.match(/^import .*;$/gm);

      if (imports && imports.length) {
        const lastImport = imports[imports.length - 1];
        code = code.replace(lastImport, `${lastImport}\n${IMPORT}`);
      } else {
        code = `${IMPORT}\n${code}`;
      }

      changed = true;
    }

    if (!code.includes("const originError = verifyRequestOrigin(request);")) {
      code = code.replace(
        /try\s*\{/g,
        `try {
    ${SNIPPET}`
      );

      changed = true;
    }

    if (changed) {
      fs.writeFileSync(full, code);
      console.log("✔", path.relative(process.cwd(), full));
    }
  }
}

walk(API_DIR);

console.log("\nDone.");