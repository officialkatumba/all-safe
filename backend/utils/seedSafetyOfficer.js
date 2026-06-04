const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const seedEmail =
  process.env.SEED_OFFICER_EMAIL ||
  process.env.SYSTEM_OWNER_EMAILS?.split(",")[0]?.trim() ||
  "safety.officer@truesafe365.local";
const seedPassword = process.env.SEED_OFFICER_PASSWORD || "AllSafe@2026!";
const seedName = process.env.SEED_OFFICER_NAME || "TrueSafe365 Safety Officer";

async function seedSafetyOfficer() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const existingUser = await User.findOne({ email: seedEmail.toLowerCase() });

  if (existingUser) {
    existingUser.name = existingUser.name || seedName;
    existingUser.isActive = true;
    existingUser.hadLoggedIn = false;
    await existingUser.setPassword(seedPassword);
    await existingUser.save();
    console.log(`Updated safety officer account: ${seedEmail}`);
    return;
  }

  await User.register(
    new User({
      email: seedEmail,
      name: seedName,
      isActive: true,
      hadLoggedIn: false,
    }),
    seedPassword,
  );

  console.log(`Created safety officer account: ${seedEmail}`);
}

seedSafetyOfficer()
  .catch((error) => {
    console.error("Safety officer seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

