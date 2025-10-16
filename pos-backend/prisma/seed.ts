// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🔰 Seeding start...");

  // ----------------------------
  // 1) Users: admin / staff
  // ----------------------------
  const adminPass = await bcrypt.hash("admin123", 10);
  const staffPass = await bcrypt.hash("staff123", 10);

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

  console.log("👥 Users:", admin.email, staff.email);

  // ----------------------------
  // 2) เตรียมข้อมูลเมนู (มี category ชัดเจน)
  //    * ระบบจะ auto-create Category ตามที่พบในรายการนี้
  // ----------------------------
  const menusData = [
    { name: "ข้าวกะเพราไก่ไข่ดาว", price: 65,  categoryName: "จานเดียว",   status: "AVAILABLE",   imageUrl: null as string | null },
    { name: "ผัดไทยกุ้งสด",        price: 80,  categoryName: "เส้น",        status: "AVAILABLE",   imageUrl: null },
    { name: "ต้มยำกุ้ง",           price: 120, categoryName: "ต้มยำ",      status: "AVAILABLE",   imageUrl: null },
    { name: "ชาเย็น",               price: 35,  categoryName: "เครื่องดื่ม", status: "AVAILABLE",   imageUrl: null },
    { name: "ข้าวไข่เจียวหมูสับ",   price: 55,  categoryName: "จานเดียว",   status: "UNAVAILABLE", imageUrl: null },
  ] as const;

  // สร้าง/อัปเดต Category อัตโนมัติจาก menusData
  const uniqueCategoryNames = Array.from(new Set(menusData.map(m => m.categoryName)));
  for (const name of uniqueCategoryNames) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("📂 Categories created:", uniqueCategoryNames.length);

  // ดึง Category ทั้งหมดมา map เป็นชื่อ → id
  const allCats = await prisma.category.findMany();
  const catIdByName = new Map(allCats.map(c => [c.name, c.id]));

  // ----------------------------
  // 3) สร้าง/อัปเดตเมนูทีละตัว (findFirst → update/create)
  //    * ไม่ใช้ upsert เพราะ name ไม่ unique
  // ----------------------------
  for (const m of menusData) {
    const categoryId = catIdByName.get(m.categoryName) ?? null;

    const exists = await prisma.menu.findFirst({ where: { name: m.name } });
    if (exists) {
      await prisma.menu.update({
        where: { id: exists.id },
        data: {
          price: m.price,
          status: m.status as any,      // กรณีใช้ Enum ใน schema
          imageUrl: m.imageUrl,
          categoryId,
        },
      });
    } else {
      await prisma.menu.create({
        data: {
          name: m.name,
          price: m.price,
          status: m.status as any,
          imageUrl: m.imageUrl,
          categoryId,
        },
      });
    }
  }

  const menuList = await prisma.menu.findMany({ orderBy: { id: "asc" } });
  console.log(`🍽️ Menus: ${menuList.length} items`);

  // ----------------------------
  // 4) Order ตัวอย่าง (สร้างเฉพาะถ้ายังไม่มี)
  //    * ต้องใส่ name ใน OrderItem ตาม schema ใหม่
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
          status: "UNPAID", // ตาม schema ปัจจุบัน (มีแค่ UNPAID | PAID)
          total: a.price * 1 + b.price * 2,
          method: "CASH",
          amountPaid: 0,
          change: 0,
          items: {
            create: [
              { menuId: a.id, name: a.name, qty: 1, price: a.price, note: "เผ็ดน้อย" },
              { menuId: b.id, name: b.name, qty: 2, price: b.price },
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
