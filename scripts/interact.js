const hre = require("hardhat");

async function main() {
    const [governor] = await hre.ethers.getSigners();
    const contractAddress = "0x2FF4CB80D714c9Cfa22CD0E5c9454C45b94BAD2E";

    // Get contract instance
    const GNGN = await hre.ethers.getContractFactory("GNGN");
    const gngn = await GNGN.attach(contractAddress);

    console.log("🔐 Connected as GOVERNOR:", governor.address);

    const GOVERNOR_ROLE = hre.ethers.id("GOVERNOR_ROLE");
    const hasRole = await gngn.hasRole(GOVERNOR_ROLE, governor.address);
    console.log("🛡️ Is caller a GOVERNOR?", hasRole);


    // ✅ 1. Mint tokens
    console.log("🪙 Minting 1000 gNGN to self...");
    await gngn.mint(governor.address, hre.ethers.parseUnits("3000", 18));
    console.log("✅ Minted!");

    // // 🔥 2. Burn tokens
    // const balance = await gngn.balanceOf(governor.address);
    // console.log("🧾 Current gNGN balance:", hre.ethers.formatUnits(balance, 18));

    // console.log("🔥 Burning 300 gNGN from self...");
    // await gngn.governorBurn(governor.address, hre.ethers.parseUnits("300", 18));
    // console.log("✅ Burned!");


    // 🚫 3. Blacklist a bad guy
    const badGuy = "0x000000000000000000000000000000000000dEaD";
    console.log("🚫 Blacklisting address:", badGuy);

    // ❗ wait for tx to complete
    const tx = await gngn.blacklistAddress(badGuy);
    await tx.wait(); // <-- this ensures it's mined

    const blacklisted = await gngn.isBlacklisted(badGuy);
    console.log(`🚨 Is ${badGuy} blacklisted?`, blacklisted);

}

main().catch((error) => {
    console.error("❌ Error during interaction:", error);
    process.exitCode = 1;
});
