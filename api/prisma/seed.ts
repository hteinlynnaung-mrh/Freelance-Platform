import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword } from "../src/lib/password.js";

const databaseUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: databaseUrl }) });

const categories = ["Web Development", "Mobile Development", "Design", "Writing", "Marketing", "Data & Analytics", "Video & Animation", "Business Support"];
const skills = ["React", "TypeScript", "Node.js", "Express", "React Native", "Expo", "UI Design", "UX Research", "Figma", "SEO", "Copywriting", "Content Strategy", "Python", "Data Visualization", "Video Editing", "Project Management", "Branding", "Illustration", "Social Media", "Translation"];
const firstNames = ["Ari", "Mina", "Narin", "Leo", "Pim", "Kai", "Nora", "Tao", "Maya", "Finn", "Lina", "Owen", "Iris", "Noah", "Suri", "Milo", "June", "Theo", "Anya", "Ben"];
const lastNames = ["Bennett", "Chai", "Davis", "Ellis", "Foster", "Grant", "Hart", "Ingram", "Jensen", "Kerr", "Lowe", "Mason", "Nguyen", "Owens", "Patel", "Reed", "Stone", "Tan", "Vale", "Wong"];
const cities = ["Bangkok", "Chiang Mai", "Phuket", "New York", "London", "Singapore", "Toronto", "Berlin", "Sydney", "Remote"];
const password = await hashPassword("ArcherDemo123!");

const nameFor = (index: number) => `${firstNames[index % firstNames.length]} ${lastNames[Math.floor(index / firstNames.length) % lastNames.length]}`;
const slugFor = (value: string, index: number) => `${value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${index}`;

async function main() {
  await prisma.$transaction(async (tx) => {
    for (const name of categories) await tx.category.upsert({ where: { name }, update: {}, create: { name, slug: slugFor(name, 1), description: `${name} projects and services` } });
    for (const name of skills) await tx.skill.upsert({ where: { name }, update: {}, create: { name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") } });

    await tx.user.upsert({ where: { email: "admin@archer.local" }, update: { username: "admin" }, create: { email: "admin@archer.local", username: "admin", passwordHash: password, role: "ADMIN", clientProfile: { create: { displayName: "Archer Admin", company: "Archer" } } } });

    for (let i = 0; i < 50; i++) {
      const displayName = nameFor(i);
      const user = await tx.user.upsert({ where: { email: `client${i + 1}@archer.local` }, update: { username: `client${i + 1}` }, create: { email: `client${i + 1}@archer.local`, username: `client${i + 1}`, passwordHash: password, role: "CLIENT", clientProfile: { create: { displayName, company: `${displayName} Studio`, location: cities[i % cities.length], timezone: "Asia/Bangkok" } } } });
      await tx.clientProfile.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, displayName } });
    }

    const skillRows = await tx.skill.findMany();
    const categoryRows = await tx.category.findMany();
    for (let i = 0; i < 100; i++) {
      const displayName = nameFor(i + 50);
      const user = await tx.user.upsert({ where: { email: `freelancer${i + 1}@archer.local` }, update: { username: `freelancer${i + 1}` }, create: { email: `freelancer${i + 1}@archer.local`, username: `freelancer${i + 1}`, passwordHash: password, role: "FREELANCER", freelancerProfile: { create: { displayName, headline: `${skills[i % skills.length]} specialist`, bio: `Independent freelancer helping teams ship high-quality ${skills[i % skills.length]} work.`, location: cities[i % cities.length], timezone: "Asia/Bangkok", hourlyRateMinor: 2500 + (i % 8) * 1000, currency: i % 2 ? "JPY" : "USD", availability: "AVAILABLE", experienceLevel: i % 3 === 0 ? "SENIOR" : "MID" } } } });
      const profile = await tx.freelancerProfile.findUnique({ where: { userId: user.id } });
      if (profile) {
        await tx.freelancerProfile.update({ where: { id: profile.id }, data: { currency: i % 2 ? "JPY" : "USD" } });
        for (let j = 0; j < 3; j++) {
          const skill = skillRows[(i + j) % skillRows.length];
          await tx.profileSkill.upsert({ where: { profileId_skillId: { profileId: profile.id, skillId: skill.id } }, update: {}, create: { profileId: profile.id, skillId: skill.id, proficiency: j === 0 ? "EXPERT" : "PROFICIENT" } });
        }
      }
    }

    const clientRows = await tx.user.findMany({ where: { role: "CLIENT" }, select: { id: true } });
    for (let i = 0; i < 250; i++) {
      const category = categoryRows[i % categoryRows.length];
      const currency = i % 2 === 0 ? "USD" : "JPY";
      const status = i % 11 === 0 ? "DRAFT" : i % 13 === 0 ? "PAUSED" : i % 17 === 0 ? "COMPLETED" : "PUBLISHED";
      const budgetMinor = currency === "USD" ? 50000 + (i % 10) * 25000 : 1500000 + (i % 10) * 500000;
      const project = await tx.project.upsert({ where: { slug: slugFor(`${category.name} project ${i + 1}`, i) }, update: { currency, budgetMinor }, create: { ownerId: clientRows[i % clientRows.length].id, categoryId: category.id, title: `${category.name} project ${i + 1}`, slug: slugFor(`${category.name} project ${i + 1}`, i), description: `Archer sample project ${i + 1}: looking for a thoughtful specialist to deliver dependable ${category.name.toLowerCase()} work for a growing team.`, budgetMinor, currency, budgetType: i % 3 === 0 ? "HOURLY" : "FIXED", status, publishedAt: status === "PUBLISHED" ? new Date(Date.now() - i * 86400000) : null, deadline: new Date(Date.now() + (15 + (i % 60)) * 86400000) } });
      for (let j = 0; j < 3; j++) await tx.projectSkill.upsert({ where: { projectId_skillId: { projectId: project.id, skillId: skillRows[(i + j) % skillRows.length].id } }, update: {}, create: { projectId: project.id, skillId: skillRows[(i + j) % skillRows.length].id } });
    }
  });

  console.log("Seed complete. Demo password: ArcherDemo123!");
  console.log("Admin: admin@archer.local (admin) | Client: client1@archer.local (client1) | Freelancer: freelancer1@archer.local (freelancer1)");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
