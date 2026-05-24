const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const OWNER_EMAIL = "officialkatumb@yahoo.com";
const OWNER_PASSWORD = "Katumba@2026";

async function seedSystemOwner() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingUser = await User.findOne({ email: OWNER_EMAIL });

  if (existingUser) {
    existingUser.name = existingUser.name || "Katumba System Owner";
    existingUser.role = "system_owner";
    existingUser.isSystemOwner = true;
    existingUser.isActive = true;
    existingUser.isVerified = true;
    existingUser.mustChangePassword = false;
    existingUser.companyId = null;
    existingUser.companyName = null;
    existingUser.subscription = existingUser.subscription || {};
    await existingUser.setPassword(OWNER_PASSWORD);
    await existingUser.save();

    console.log(`Updated system owner account: ${OWNER_EMAIL}`);
    return;
  }

  const owner = new User({
    email: OWNER_EMAIL,
    name: "Katumba System Owner",
    role: "system_owner",
    isSystemOwner: true,
    isActive: true,
    isVerified: true,
    mustChangePassword: false,
    hadLoggedIn: false,
  });

  await User.register(owner, OWNER_PASSWORD);
  console.log(`Created system owner account: ${OWNER_EMAIL}`);
}

seedSystemOwner()
  .catch((error) => {
    console.error("System owner seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
