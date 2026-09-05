import { getPrisma } from "../src/prisma.js";

// Lab 2 Idempotent Database Seed Script
// Fulfills Section 5.3 of Lab_02_labsheet.pdf:
// - 4 Ticket Categories
// - At least 6 Related Systems (we provide 7)
// - At least 4 Active Development Requesters
// - At least 1 Inactive Development Requester
async function main() {
  const prisma = getPrisma();

  // 1. Seed Categories (Section 5.3)
  const categories = [
    "Account and Access",
    "Hardware",
    "Software",
    "Network",
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✓ Seeded 4 Categories.");

  // 2. Seed Related Systems (Section 5.3)
  const relatedSystems = [
    "Email",
    "Campus Wi-Fi",
    "VPN",
    "LEB2 App",
    "Grade Submission App",
    "Printer",
    "Corporate Laptop",
  ];

  for (const name of relatedSystems) {
    await prisma.relatedSystem.upsert({
      where: { name },
      update: { isActive: true },
      create: { name, isActive: true },
    });
  }
  console.log("✓ Seeded 7 Related Systems.");

  // 3. Seed Development Requesters (Section 5.3: at least 4 active, at least 1 inactive)
  const requesters = [
    { name: "Jennifer Anderson", email: "jennifer.anderson@example.edu", isActive: true },
    { name: "David Lee", email: "david.lee@example.edu", isActive: true },
    { name: "Sarah Johnson", email: "sarah.johnson@example.edu", isActive: true },
    { name: "Michael Brown", email: "michael.brown@example.edu", isActive: true },
    { name: "Alex Turner (Inactive)", email: "alex.turner@example.edu", isActive: false },
  ];

  for (const req of requesters) {
    await prisma.requesterUser.upsert({
      where: { email: req.email },
      update: { name: req.name, isActive: req.isActive },
      create: req,
    });
  }
  console.log("✓ Seeded 5 Development Requesters (4 active, 1 inactive).");

  // 4. Seed initial sample tickets for testing ownership and listing
  const jennifer = await prisma.requesterUser.findUnique({ where: { email: "jennifer.anderson@example.edu" } });
  const david = await prisma.requesterUser.findUnique({ where: { email: "david.lee@example.edu" } });
  const hardwareCat = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const networkCat = await prisma.category.findUnique({ where: { name: "Network" } });
  const laptopSys = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });
  const vpnSys = await prisma.relatedSystem.findUnique({ where: { name: "VPN" } });

  if (jennifer && hardwareCat && laptopSys) {
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000001" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000001",
        summary: "Laptop battery drains quickly",
        description: "My laptop battery is draining much faster than usual even when the system is idle. Started after last week's update.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
        requesterId: jennifer.id,
        categoryId: hardwareCat.id,
        relatedSystemId: laptopSys.id,
      },
    });
  }

  if (david && networkCat && vpnSys) {
    await prisma.ticket.upsert({
      where: { ticketNumber: "TKT-2026-000002" },
      update: {},
      create: {
        ticketNumber: "TKT-2026-000002",
        summary: "Cannot connect to campus VPN",
        description: "Encountering error 809 when attempting to connect to the campus VPN from home network.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
        requesterId: david.id,
        categoryId: networkCat.id,
        relatedSystemId: vpnSys.id,
      },
    });
  }
  console.log("✓ Seeded sample tickets for ownership isolation tests.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
