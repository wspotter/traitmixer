import { createAllConnectors } from "traitmixer-connectors";

async function run() {
  const connectors = createAllConnectors();
  const configured = connectors.filter((c) => c.isConfigured());

  if (configured.length === 0) {
    console.log("No configured targets found. Nothing to uninstall.");
    return;
  }

  console.log(`Found ${configured.length} configured targets. Starting uninstall process...`);

  let hasErrors = false;

  for (const connector of configured) {
    console.log(`\nUninstalling traits from ${connector.label}...`);
    try {
      const res = await connector.uninstall();
      if (res.success) {
        console.log(`✓ Success: ${res.message}`);
      } else {
        console.error(`✗ Failed: ${res.message}`);
        hasErrors = true;
      }
    } catch (err) {
      console.error(`✗ Unexpected error: ${(err as Error).message}`);
      hasErrors = true;
    }
  }

  console.log("\nFinished uninstall process.");
  process.exit(hasErrors ? 1 : 0);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
