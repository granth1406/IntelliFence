require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./models/User');

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: node makeAuthority.js <email>');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(process.env.DATABASE_URL);

    const user = await User.findOneAndUpdate(
      { email },
      { $set: { role: 'authority' } },
      { new: true }
    );

    if (!user) {
      console.error(`User not found: ${email}`);
      process.exitCode = 2;
      return;
    }

    console.log(`Updated ${user.email} to role=${user.role}`);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();