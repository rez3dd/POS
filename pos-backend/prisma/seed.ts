// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔰 Seeding start...");

  // ----------------------------
  // 1) Users: admin / staff / customer
  // ----------------------------
  const adminPass = await bcrypt.hash("admin123", 10);
  const staffPass = await bcrypt.hash("staff123", 10);
  const custPass  = await bcrypt.hash("cust123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@pos.local" },
    update: {},
    create: {
      email: "admin@pos.local",
      name: "Admin",
      password: adminPass,
      role: "ADMIN",
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@pos.local" },
    update: {},
    create: {
      email: "staff@pos.local",
      name: "Staff",
      password: staffPass,
      role: "STAFF",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@pos.local" },
    update: {},
    create: {
      email: "customer@pos.local",
      name: "Customer",
      password: custPass,
      role: "CUSTOMER",
    },
  });

  console.log("👥 Users:", admin.email, staff.email, customer.email);

  // ----------------------------
  // 2) Menus (ตัวอย่าง)
  // ----------------------------
  const menusData = [
    { name: "ข้าวกะเพราไก่ไข่ดาว", price: 65,  category: "จานเดียว",   status: "AVAILABLE",   imageUrl: null as string | null },
    { name: "ผัดไทยกุ้งสด",        price: 80,  category: "เส้น",        status: "AVAILABLE",   imageUrl: null },
    { name: "ต้มยำกุ้ง",           price: 120, category: "ต้มยำ",      status: "AVAILABLE",   imageUrl: null },
    { name: "ชาเย็น",               price: 35,  category: "เครื่องดื่ม", status: "AVAILABLE",   imageUrl: null },
    { name: "ข้าวไข่เจียวหมูสับ",   price: 55,  category: "จานเดียว",   status: "UNAVAILABLE", imageUrl: null },
  ] as const;

  for (const m of menusData) {
    const exists = await prisma.menu.findFirst({ where: { name: m.name } });
    if (exists) {
      await prisma.menu.update({
        where: { id: exists.id },
        data: {
          price: m.price,
          category: m.category ?? null,
          status: m.status,   // ปัจจุบันใน schema เป็น String
          imageUrl: m.imageUrl,
        },
      });
    } else {
      await prisma.menu.create({
        data: {
          name: m.name,
          price: m.price,
          category: m.category ?? null,
          status: m.status,
          imageUrl: m.imageUrl,
        },
      });
    }
  }

  const menuList = await prisma.menu.findMany({ orderBy: { id: "asc" } });
  console.log(`🍽️ Menus: ${menuList.length} items`);

  // ----------------------------
  // 3) Order ตัวอย่าง (สร้างเฉพาะถ้ายังไม่มี)
  // ----------------------------
  if (menuList.length >= 2) {
    const a = menuList[0];
    const b = menuList[1];
    const seedCode = "ORD-SEED-001";

    const existsOrder = await prisma.order.findUnique({ where: { code: seedCode } });
    if (!existsOrder) {
      const order = await prisma.order.create({
        data: {
          code: seedCode,
          customerName: "ลูกค้าหน้าร้าน",
          status: "PREPARING", // ตัวอย่างสถานะ (schema เป็น String)
          total: a.price * 1 + b.price * 2,
          // ❌ userId: staff.id  (ลบออกแล้ว)
          items: {
            create: [
              { menuId: a.id, qty: 1, price: a.price, note: "เผ็ดน้อย" },
              { menuId: b.id, qty: 2, price: b.price },
            ],
          },
        },
        include: { items: true },
      });
      console.log("🧾 Sample order created:", order.code);
    } else {
      console.log("🧾 Sample order already exists:", seedCode, "(skip)");
    }
  }

  console.log("✅ Seeding done.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
