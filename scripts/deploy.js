const hre = require("hardhat");

async function main() {
  const [gov1, gov2] = await hre.ethers.getSigners(); // ✅ define both governors

  const GNGN = await hre.ethers.getContractFactory("GNGN");
  const gngn = await GNGN.deploy(gov1.address);
  await gngn.waitForDeployment();

  const contractAddress = await gngn.getAddress();
  console.log("✅ GNGN deployed to:", contractAddress);

  // ✅ Grant GOVERNOR_ROLE to gov2
  const GOVERNOR_ROLE = hre.ethers.id("GOVERNOR_ROLE");
  const tx = await gngn.connect(gov1).grantRole(GOVERNOR_ROLE, gov2.address);
  await tx.wait();

  console.log("✅ GOVERNOR_ROLE granted to:", gov2.address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
