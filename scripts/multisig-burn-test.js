const hre = require("hardhat");

async function main() {
  const [gov1, gov2] = await hre.ethers.getSigners();
  const contractAddress = "0xd71F6434E338E64957E7E8776A9970d7C079b942";

  const GNGN = await hre.ethers.getContractFactory("GNGN");
  const gngn = await GNGN.attach(contractAddress);

  const burnAmount = hre.ethers.parseUnits("500", 18);
  console.log("👤 Gov1 (proposer):", gov1.address);
  console.log("👤 Gov2 (approver):", gov2.address);

  // Check pre-burn balance
  const before = await gngn.balanceOf(gov1.address);
  console.log("Before burn:", hre.ethers.formatUnits(before, 18));

  // Step 1: Gov1 proposes burn
  const tx1 = await gngn.connect(gov1).proposeBurn(gov1.address, burnAmount);
  await tx1.wait();
  const proposalId = (await gngn.burnProposalCount()) - 1n;

  console.log("🔥 Burn proposal ID:", proposalId.toString());

  // Step 2: Gov2 approves
  const tx2 = await gngn.connect(gov2).approveBurn(proposalId);
  await tx2.wait();
  console.log("✅ Burn approved and executed");

  // Check post-burn balance
  const after = await gngn.balanceOf(gov1.address);
  console.log("After burn:", hre.ethers.formatUnits(after, 18));
}

main().catch((error) => {
  console.error("❌ Multisig burn test failed:", error);
  process.exitCode = 1;
});
