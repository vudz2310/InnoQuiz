import { prisma } from "../config/DB.js";

async function seedMajorsAndClasses() {
  console.log("Checking and seeding Majors & Classes...");

  const count = await prisma.major.count();
  if (count > 0) {
    console.log(`Already have ${count} majors in database.`);
    return;
  }

  const majorsData = [
    {
      code: "CNTT",
      name: "Công nghệ thông tin",
      description: "Khoa Công nghệ thông tin - Đại học Kinh doanh và Công nghệ Hà Nội",
      status: "ACTIVE",
      allowRegistration: true,
      displayOrder: 1,
      classes: [
        { code: "CNTT29-01", name: "CNTT K29.01", cohort: "K29" },
        { code: "CNTT29-02", name: "CNTT K29.02", cohort: "K29" },
        { code: "CNTT30-01", name: "CNTT K30.01", cohort: "K30" },
        { code: "CNTT30-02", name: "CNTT K30.02", cohort: "K30" },
      ],
    },
    {
      code: "QTKD",
      name: "Quản trị kinh doanh",
      description: "Khoa Quản trị kinh doanh - HUBT",
      status: "ACTIVE",
      allowRegistration: true,
      displayOrder: 2,
      classes: [
        { code: "QTKD29-01", name: "QTKD K29.01", cohort: "K29" },
        { code: "QTKD30-01", name: "QTKD K30.01", cohort: "K30" },
      ],
    },
    {
      code: "TCNH",
      name: "Tài chính - Ngân hàng",
      description: "Khoa Tài chính - Ngân hàng - HUBT",
      status: "ACTIVE",
      allowRegistration: true,
      displayOrder: 3,
      classes: [
        { code: "TCNH29-01", name: "TCNH K29.01", cohort: "K29" },
        { code: "TCNH30-01", name: "TCNH K30.01", cohort: "K30" },
      ],
    },
    {
      code: "KETOAN",
      name: "Kế toán",
      description: "Khoa Kế toán - Kiểm toán - HUBT",
      status: "ACTIVE",
      allowRegistration: true,
      displayOrder: 4,
      classes: [
        { code: "KT29-01", name: "Kế toán K29.01", cohort: "K29" },
        { code: "KT30-01", name: "Kế toán K30.01", cohort: "K30" },
      ],
    },
    {
      code: "NNA",
      name: "Ngôn ngữ Anh",
      description: "Khoa Ngôn ngữ Anh - HUBT",
      status: "ACTIVE",
      allowRegistration: true,
      displayOrder: 5,
      classes: [
        { code: "NNA29-01", name: "NNA K29.01", cohort: "K29" },
        { code: "NNA30-01", name: "NNA K30.01", cohort: "K30" },
      ],
    },
  ];

  for (const m of majorsData) {
    const { classes, ...majorInfo } = m;
    const createdMajor = await prisma.major.create({
      data: majorInfo,
    });

    for (const c of classes) {
      await prisma.academicClass.create({
        data: {
          code: c.code,
          name: c.name,
          cohort: c.cohort,
          majorId: createdMajor.id,
          status: "ACTIVE",
          allowRegistration: true,
        },
      });
    }
  }

  console.log("Seeded initial majors and classes successfully!");
}

seedMajorsAndClasses()
  .catch((e) => {
    console.error("Error seeding majors:", e);
  })
  .finally(async () => {
    process.exit(0);
  });
