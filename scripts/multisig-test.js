const hre = require("hardhat");

async function main() {
    const [gov1, gov2] = await hre.ethers.getSigners(); // You MUST have 2 keys in .env

    const contractAddress = "0xd71F6434E338E64957E7E8776A9970d7C079b942"; // your deployed address
    const GNGN = await hre.ethers.getContractFactory("GNGN");
    const gngn = await GNGN.attach(contractAddress);

    const amount = hre.ethers.parseUnits("1000", 18);

    console.log("👤 Gov1 (proposer):", gov1.address);
    console.log("👤 Gov2 (approver):", gov2.address);

    // Gov1 proposes mint
    const tx1 = await gngn.connect(gov1).proposeMint(gov1.address, amount);
    await tx1.wait();

    // use the current proposal count - 1
    const proposalId = (await gngn.mintProposalCount()) - 1n;
    console.log("📨 Mint proposal submitted with ID:", proposalId.toString());



    // Gov2 approves mint
    const tx2 = await gngn.connect(gov2).approveMint(proposalId);
    await tx2.wait();
    console.log("✅ Proposal approved and executed by Gov2");

    // Check final balance
    const balance = await gngn.balanceOf(gov1.address);
    console.log("🧾 Final Gov1 Balance:", hre.ethers.formatUnits(balance, 18));
}

main().catch((error) => {
    console.error("❌ Multisig test failed:", error);
    process.exitCode = 1;
});
