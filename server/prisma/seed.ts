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

  // 4. Seed sample tickets with varied statuses for realistic demo & filter testing
  const jennifer = await prisma.requesterUser.findUnique({ where: { email: "jennifer.anderson@example.edu" } });
  const david    = await prisma.requesterUser.findUnique({ where: { email: "david.lee@example.edu" } });
  const sarah    = await prisma.requesterUser.findUnique({ where: { email: "sarah.johnson@example.edu" } });

  const hardwareCat = await prisma.category.findUnique({ where: { name: "Hardware" } });
  const softwareCat = await prisma.category.findUnique({ where: { name: "Software" } });
  const networkCat  = await prisma.category.findUnique({ where: { name: "Network" } });
  const accountCat  = await prisma.category.findUnique({ where: { name: "Account and Access" } });

  const laptopSys = await prisma.relatedSystem.findUnique({ where: { name: "Corporate Laptop" } });
  const vpnSys    = await prisma.relatedSystem.findUnique({ where: { name: "VPN" } });
  const emailSys  = await prisma.relatedSystem.findUnique({ where: { name: "Email" } });
  const leb2Sys   = await prisma.relatedSystem.findUnique({ where: { name: "LEB2 App" } });
  const gradeSys  = await prisma.relatedSystem.findUnique({ where: { name: "Grade Submission App" } });
  const wifiSys   = await prisma.relatedSystem.findUnique({ where: { name: "Campus Wi-Fi" } });

  const sampleTickets = [
    // Jennifer — 7 tickets matching the labsheet example
    {
      ticketNumber: "TKT-2026-000001",
      summary: "Laptop battery drains quickly",
      description: "My laptop battery is draining much faster than usual even when the system is idle. Started after last week's update.",
      requestedPriority: "MEDIUM" as const,
      currentStatus: "NEW" as const,
      requesterId: jennifer!.id,
      categoryId: hardwareCat!.id,
      relatedSystemId: laptopSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000002",
      summary: "Cannot access grading portal",
      description: "When I try to log in to the grading portal I get a 403 Forbidden error. My account was working last week.",
      requestedPriority: "HIGH" as const,
      currentStatus: "NEW" as const,
      requesterId: jennifer!.id,
      categoryId: accountCat!.id,
      relatedSystemId: gradeSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000003",
      summary: "Cannot connect to campus VPN",
      description: "Encountering error 809 when attempting to connect to the campus VPN from home network.",
      requestedPriority: "HIGH" as const,
      currentStatus: "IN_PROGRESS" as const,
      requesterId: jennifer!.id,
      categoryId: networkCat!.id,
      relatedSystemId: vpnSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000004",
      summary: "Email signature missing after update",
      description: "After the Outlook update last Monday, my email signature no longer appears when composing new messages.",
      requestedPriority: "LOW" as const,
      currentStatus: "PENDING" as const,
      requesterId: jennifer!.id,
      categoryId: accountCat!.id,
      relatedSystemId: emailSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000005",
      summary: "Laptop keyboard keys sticking",
      description: "Several keys on my keyboard are sticking and require extra force to press. This is significantly slowing down my work.",
      requestedPriority: "MEDIUM" as const,
      currentStatus: "RESOLVED" as const,
      requesterId: jennifer!.id,
      categoryId: hardwareCat!.id,
      relatedSystemId: laptopSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000006",
      summary: "LEB2 app crashes on startup",
      description: "The LEB2 application crashes immediately after the splash screen. I reinstalled it but the problem persists.",
      requestedPriority: "HIGH" as const,
      currentStatus: "IN_PROGRESS" as const,
      requesterId: jennifer!.id,
      categoryId: softwareCat!.id,
      relatedSystemId: leb2Sys!.id,
    },
    {
      ticketNumber: "TKT-2026-000007",
      summary: "Wi-Fi drops every 30 minutes",
      description: "My connection to campus Wi-Fi drops approximately every 30 minutes and requires manual reconnection each time.",
      requestedPriority: "MEDIUM" as const,
      currentStatus: "CLOSED" as const,
      requesterId: jennifer!.id,
      categoryId: networkCat!.id,
      relatedSystemId: wifiSys!.id,
    },
    // David — 3 tickets with mixed statuses
    {
      ticketNumber: "TKT-2026-000008",
      summary: "Cannot connect to campus VPN",
      description: "Encountering error 809 when attempting to connect to the campus VPN from home network.",
      requestedPriority: "HIGH" as const,
      currentStatus: "IN_PROGRESS" as const,
      requesterId: david!.id,
      categoryId: networkCat!.id,
      relatedSystemId: vpnSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000009",
      summary: "Email signature missing after update",
      description: "After the Outlook update last Monday, my email signature no longer appears when composing new messages.",
      requestedPriority: "LOW" as const,
      currentStatus: "NEW" as const,
      requesterId: david!.id,
      categoryId: accountCat!.id,
      relatedSystemId: emailSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000010",
      summary: "Laptop keyboard keys sticking",
      description: "Several keys on my keyboard are sticking and require extra force to press. This is significantly slowing down my work.",
      requestedPriority: "MEDIUM" as const,
      currentStatus: "RESOLVED" as const,
      requesterId: david!.id,
      categoryId: hardwareCat!.id,
      relatedSystemId: laptopSys!.id,
    },
    // Sarah — 2 tickets with mixed statuses
    {
      ticketNumber: "TKT-2026-000011",
      summary: "Grade submission fails on save",
      description: "When submitting final grades the system shows a spinner for 2 minutes then throws a 504 gateway timeout error.",
      requestedPriority: "URGENT" as const,
      currentStatus: "IN_PROGRESS" as const,
      requesterId: sarah!.id,
      categoryId: softwareCat!.id,
      relatedSystemId: gradeSys!.id,
    },
    {
      ticketNumber: "TKT-2026-000012",
      summary: "No Wi-Fi access in Building C",
      description: "There is no Wi-Fi signal in Building C Room 301. Other rooms on the same floor have normal connectivity.",
      requestedPriority: "HIGH" as const,
      currentStatus: "NEW" as const,
      requesterId: sarah!.id,
      categoryId: networkCat!.id,
      relatedSystemId: wifiSys!.id,
    },
  ];

  let seeded = 0;
  for (const ticket of sampleTickets) {
    await prisma.ticket.upsert({
      where: { ticketNumber: ticket.ticketNumber },
      update: ticket,
      create: ticket,
    });
    seeded++;
  }
  console.log(`✓ Seeded ${seeded} sample tickets with varied statuses (NEW, IN_PROGRESS, RESOLVED, CLOSED).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await getPrisma().$disconnect();
  });
