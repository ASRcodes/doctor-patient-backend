const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  const hashedPassword = await bcrypt.hash("Password123!", 12);

  // Create doctors
  const doctors = [
    {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      specialization: "Cardiology",
      yearsOfExperience: 12,
    },
    {
      name: "Dr. Michael Chen",
      email: "michael.chen@hospital.com",
      specialization: "Dermatology",
      yearsOfExperience: 8,
    },
    {
      name: "Dr. Emily Williams",
      email: "emily.williams@hospital.com",
      specialization: "Pediatrics",
      yearsOfExperience: 15,
    },
    {
      name: "Dr. James Brown",
      email: "james.brown@hospital.com",
      specialization: "Orthopedics",
      yearsOfExperience: 10,
    },
  ];

  for (const doc of doctors) {
    await prisma.user.upsert({
      where: { email: doc.email },
      update: {},
      create: {
        name: doc.name,
        email: doc.email,
        password: hashedPassword,
        role: "DOCTOR",
        doctorProfile: {
          create: {
            specialization: doc.specialization,
            yearsOfExperience: doc.yearsOfExperience,
          },
        },
      },
    });
    console.log(`  ✅ Doctor: ${doc.name} (${doc.specialization})`);
  }

  // Create patients
  const patients = [
    { name: "Alice Smith", email: "alice@example.com" },
    { name: "Bob Martinez", email: "bob@example.com" },
  ];

  for (const patient of patients) {
    await prisma.user.upsert({
      where: { email: patient.email },
      update: {},
      create: {
        name: patient.name,
        email: patient.email,
        password: hashedPassword,
        role: "PATIENT",
      },
    });
    console.log(`  ✅ Patient: ${patient.name}`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Test credentials (all accounts):");
  console.log("   Password: Password123!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
