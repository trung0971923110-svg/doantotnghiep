import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Inventory from './src/models/Inventory.js';
import Repair from './src/models/Repair.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sanpham';

const users = [
  { username: 'admin',    password: 'admin123',    role: 'admin',      name: 'Nguyễn Văn Quản Lý' },
  { username: 'tech1',    password: 'tech123',     role: 'technician', name: 'Trần Minh Kỹ Thuật' },
  { username: 'tech2',    password: 'tech123',     role: 'technician', name: 'Lê Anh Tuấn (KTV)' },
  { username: 'customer', password: 'customer123', role: 'customer',   name: 'Phạm Hoàng Nam' }
];

const inventory = [
  { name: 'Intel Core i3-12100F',                         image: 'https://placehold.co/400x300?text=i3+12100F', category: 'cpu',         price: 2150000,  stock: 15, minStock: 5,  specs: { socket: 'LGA1700', power: 65 } },
  { name: 'Intel Core i5-12400F',                         image: 'https://placehold.co/400x300?text=i5+12400F', category: 'cpu',         price: 3490000,  stock: 12, minStock: 4,  specs: { socket: 'LGA1700', power: 65 } },
  { name: 'Intel Core i5-13400F',                         image: 'https://placehold.co/400x300?text=i5+13400F', category: 'cpu',         price: 5290000,  stock: 8,  minStock: 3,  specs: { socket: 'LGA1700', power: 65 } },
  { name: 'AMD Ryzen 5 7600',                             image: 'https://placehold.co/400x300?text=Ryzen+5+7600', category: 'cpu',         price: 5450000,  stock: 6,  minStock: 2,  specs: { socket: 'AM5',     power: 65 } },
  { name: 'AMD Ryzen 7 7800X3D',                          image: 'https://placehold.co/400x300?text=Ryzen+7+7800X3D', category: 'cpu',         price: 10500000, stock: 3,  minStock: 2,  specs: { socket: 'AM5',     power: 120 } },
  { name: 'MSI PRO H610M-E DDR4',                         image: 'https://placehold.co/400x300?text=MSI+H610M', category: 'mainboard',   price: 1850000,  stock: 10, minStock: 3,  specs: { socket: 'LGA1700', ramType: 'DDR4' } },
  { name: 'ASUS PRIME B760M-A WIFI DDR4',                 image: 'https://placehold.co/400x300?text=ASUS+B760M', category: 'mainboard',   price: 3150000,  stock: 7,  minStock: 3,  specs: { socket: 'LGA1700', ramType: 'DDR4' } },
  { name: 'GIGABYTE B760M GAMING X AX DDR5',              image: 'https://placehold.co/400x300?text=Gigabyte+B760M', category: 'mainboard',   price: 4200000,  stock: 5,  minStock: 2,  specs: { socket: 'LGA1700', ramType: 'DDR5' } },
  { name: 'MSI PRO B650M-A WIFI DDR5',                    image: 'https://placehold.co/400x300?text=MSI+B650M', category: 'mainboard',   price: 4390000,  stock: 4,  minStock: 2,  specs: { socket: 'AM5',     ramType: 'DDR5' } },
  { name: 'ASUS ROG STRIX B650-A GAMING WIFI',            image: 'https://placehold.co/400x300?text=ROG+B650-A', category: 'mainboard',   price: 6250000,  stock: 2,  minStock: 1,  specs: { socket: 'AM5',     ramType: 'DDR5' } },
    ...[
      { b: 'Corsair', p: [290, 590, 1150, 2350] },
      { b: 'Kingston', p: [280, 550, 1050, 2250] },
      { b: 'G.Skill', p: [300, 580, 1100, 2450] },
      { b: 'Kingmax', p: [260, 490, 950, 2100] },
      { b: 'Crucial', p: [270, 520, 990, 2150] },
      { b: 'TeamGroup', p: [280, 540, 1020, 2200] },
      { b: 'ADATA', p: [320, 650, 1250, 2650] },
      { b: 'Lexar', p: [275, 510, 980, 2180] },
      { b: 'Mushkin', p: [265, 480, 920, 2050] },
      { b: 'GeIL', p: [285, 530, 1010, 2250] },
      { b: 'PNY', p: [295, 560, 1080, 2400] },
      { b: 'Apacer', p: [270, 500, 960, 2150] },
      { b: 'Patriot', p: [290, 570, 1090, 2380] },
      { b: 'Gigabyte', p: [310, 540, 1030, 2300] },
      { b: 'ASUS', p: [350, 680, 1350, 2850] }
    ].flatMap(brandObj => [4, 8, 16, 32].map((cap, idx) => ({
      name: `${brandObj.b} ${cap}GB DDR4`,
      image: `https://placehold.co/400x300?text=${brandObj.b}+${cap}GB`,
      category: 'ram',
      price: brandObj.p[idx] * 1000,
      stock: 15,
      minStock: 5,
      specs: { ramType: 'DDR4', capacity: cap }
    }))),
  { name: 'MSI GeForce GTX 1650 D6 AERO ITX 4G',         image: 'https://placehold.co/400x300?text=GTX+1650', category: 'vga',         price: 3650000,  stock: 6,  minStock: 2,  specs: { power: 75 } },
  { name: 'ASUS Dual GeForce RTX 3050 V2 8GB',           image: 'https://placehold.co/400x300?text=RTX+3050', category: 'vga',         price: 5890000,  stock: 8,  minStock: 3,  specs: { power: 130 } },
  { name: 'GIGABYTE GeForce RTX 4060 WINDFORCE OC 8G',   image: 'https://placehold.co/400x300?text=RTX+4060', category: 'vga',         price: 8190000,  stock: 10, minStock: 3,  specs: { power: 115 } },
  { name: 'MSI GeForce RTX 4060 Ti VENTUS 2X 8G OC',     image: 'https://placehold.co/400x300?text=RTX+4060Ti', category: 'vga',         price: 11450000, stock: 5,  minStock: 2,  specs: { power: 160 } },
  { name: 'ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB', image: 'https://placehold.co/400x300?text=RTX+4070', category: 'vga',         price: 19490000, stock: 3,  minStock: 1,  specs: { power: 220 } },
  { name: 'Antec Atom V550 550W',                         image: 'https://placehold.co/400x300?text=Antec+550W', category: 'psu',         price: 690000,   stock: 14, minStock: 5,  specs: { wattage: 550 } },
  { name: 'MSI MAG A650BN 650W 80 Plus Bronze',           image: 'https://placehold.co/400x300?text=MSI+650W', category: 'psu',         price: 1350000,  stock: 11, minStock: 4,  specs: { wattage: 650 } },
  { name: 'Corsair CV750 750W 80 Plus Bronze',            image: 'https://placehold.co/400x300?text=Corsair+750W', category: 'psu',         price: 1790000,  stock: 8,  minStock: 3,  specs: { wattage: 750 } },
  { name: 'MSI MAG A850GL 850W PCIe 5.0 80 Plus Gold',   image: 'https://placehold.co/400x300?text=MSI+850W', category: 'psu',         price: 2990000,  stock: 4,  minStock: 2,  specs: { wattage: 850 } },
  { name: 'Kingston A400 240GB 2.5 inch SATA3',           image: 'https://placehold.co/400x300?text=SSD+Kingston', category: 'ssd',         price: 550000,   stock: 25, minStock: 8,  specs: { capacity: '240GB' } },
  { name: 'Samsung 980 500GB M.2 NVMe PCIe Gen3',        image: 'https://placehold.co/400x300?text=SSD+Samsung', category: 'ssd',         price: 1290000,  stock: 16, minStock: 5,  specs: { capacity: '500GB' } },
  { name: 'Kingston NV2 1TB M.2 PCIe Gen4 x4 NVMe',      image: 'https://placehold.co/400x300?text=SSD+NVMe', category: 'ssd',         price: 1690000,  stock: 20, minStock: 6,  specs: { capacity: '1TB' } },
  { name: 'Samsung 990 PRO 1TB M.2 NVMe PCIe Gen4 x4',  image: 'https://placehold.co/400x300?text=SSD+990Pro', category: 'ssd',         price: 2890000,  stock: 6,  minStock: 2,  specs: { capacity: '1TB' } },
  { name: 'Xigmatek XA-22 Văn phòng',                    image: 'https://placehold.co/400x300?text=Case+XA-22', category: 'case',        price: 320000,   stock: 15, minStock: 4,  specs: {} },
  { name: 'Xigmatek NYX 3F (Kèm 3 Fan RGB)',             image: 'https://placehold.co/400x300?text=Case+NYX', category: 'case',        price: 650000,   stock: 12, minStock: 4,  specs: {} },
  { name: 'Montech AIR 100 LITE Black (Kèm 2 Fan)',       image: 'https://placehold.co/400x300?text=Case+Montech', category: 'case',        price: 950000,   stock: 8,  minStock: 2,  specs: {} },
  { name: 'Camera IP Dome Dahua 2.0MP (Trong nhà)',       image: 'https://via.placeholder.com/400x300?text=Camera+IP', category: 'camera',      price: 650000,   stock: 45, minStock: 10, specs: { type: 'IP',     environment: 'indoor',  resolution: '1080p' } },
  { name: 'Camera IP Thân Dahua 2.0MP (Ngoài trời)',      image: 'https://via.placeholder.com/400x300?text=Camera+Body', category: 'camera',      price: 750000,   stock: 35, minStock: 10, specs: { type: 'IP',     environment: 'outdoor', resolution: '1080p' } },
  { name: 'Camera IP Dome Hikvision 4.0MP 2K (Trong nhà)', image: 'https://via.placeholder.com/400x300?text=Camera+2K', category: 'camera',    price: 1150000,  stock: 20, minStock: 5,  specs: { type: 'IP',     environment: 'indoor',  resolution: '2K' } },
  { name: 'Camera IP Thân Hikvision 4.0MP 2K (Ngoài trời)', image: 'https://via.placeholder.com/400x300?text=Camera+Outdoor', category: 'camera',   price: 1250000,  stock: 18, minStock: 5,  specs: { type: 'IP',     environment: 'outdoor', resolution: '2K' } },
  { name: 'Camera IP Thân Hikvision 8.0MP 4K siêu sắc nét', image: 'https://via.placeholder.com/400x300?text=Camera+4K', category: 'camera',   price: 2450000,  stock: 8,  minStock: 2,  specs: { type: 'IP',     environment: 'outdoor', resolution: '4K' } },
  { name: 'Camera Analog Dahua 2.0MP giá rẻ',             image: 'https://via.placeholder.com/400x300?text=Camera+Analog', category: 'camera',      price: 380000,   stock: 50, minStock: 15, specs: { type: 'Analog', environment: 'indoor',  resolution: '1080p' } },
  { name: 'Đầu ghi IP Hikvision 4 kênh PoE',             image: 'https://via.placeholder.com/400x300?text=DVR+4CH', category: 'dvr',         price: 1850000,  stock: 10, minStock: 3,  specs: { channels: 4,  type: 'IP' } },
  { name: 'Đầu ghi IP Hikvision 8 kênh',                  image: 'https://via.placeholder.com/400x300?text=DVR+8CH', category: 'dvr',         price: 2650000,  stock: 8,  minStock: 2,  specs: { channels: 8,  type: 'IP' } },
  { name: 'Đầu ghi Analog Dahua 4 kênh',                  image: 'https://via.placeholder.com/400x300?text=DVR+Analog', category: 'dvr',         price: 1100000,  stock: 12, minStock: 3,  specs: { channels: 4,  type: 'Analog' } },
  { name: 'Đầu ghi Analog Dahua 8 kênh',                  image: 'https://via.placeholder.com/400x300?text=DVR+8CH+Analog', category: 'dvr',         price: 1650000,  stock: 9,  minStock: 3,  specs: { channels: 8,  type: 'Analog' } },
  { name: 'Ổ cứng Camera Seagate Skyhawk 1TB',            image: 'https://via.placeholder.com/400x300?text=HDD+1TB', category: 'hdd',         price: 1250000,  stock: 15, minStock: 5,  specs: { capacity: '1TB' } },
  { name: 'Ổ cứng Camera Seagate Skyhawk 2TB',            image: 'https://via.placeholder.com/400x300?text=HDD+2TB', category: 'hdd',         price: 1850000,  stock: 10, minStock: 4,  specs: { capacity: '2TB' } },
  { name: 'Ổ cứng Camera WD Purple 4TB',                  image: 'https://via.placeholder.com/400x300?text=HDD+4TB', category: 'hdd',         price: 3150000,  stock: 5,  minStock: 2,  specs: { capacity: '4TB' } },
  { name: 'Cáp đồng trục kèm nguồn RG59 (Cuộn 100m)',    image: 'https://via.placeholder.com/400x300?text=Cable+RG59', category: 'cable',       price: 650000,   stock: 14, minStock: 4,  specs: { length: 100 } },
  { name: 'Cáp mạng CAT6 UTP bấm sẵn (Cuộn 100m)',       image: 'https://via.placeholder.com/400x300?text=Cable+CAT6', category: 'cable',       price: 550000,   stock: 20, minStock: 5,  specs: { length: 100 } },
  { name: 'Hộp mực Canon Cartridge 303 (LBP2900)',        image: 'https://placehold.co/400x300?text=Cartridge+303', category: 'accessories', price: 250000,   stock: 2,  minStock: 5,  specs: {} },
  { name: 'Keo tản nhiệt CPU MX-4',                       image: 'https://placehold.co/400x300?text=Keo+MX-4', category: 'accessories', price: 120000,   stock: 30, minStock: 5,  specs: {} },
  { name: 'Jack BNC + F5 Camera Analog (Bộ 10 cái)',      image: 'https://placehold.co/400x300?text=BNC+Jack', category: 'accessories', price: 50000,    stock: 60, minStock: 10, specs: {} },
  { name: 'Hạt mạng RJ45 AMP sắt (Hộp 100 hạt)',         image: 'https://placehold.co/400x300?text=RJ45+Plug', category: 'accessories', price: 150000,   stock: 12, minStock: 3,  specs: {} }
];

async function seed() {
  console.log('🌱 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas!');

  // Clean up existing data
  await User.deleteMany({});
  await Inventory.deleteMany({});
  await Repair.deleteMany({});
  console.log('🗑️  Cleared existing data');

  // Seed Users
  const createdUsers = await User.insertMany(users);
  console.log(`👥 Seeded ${createdUsers.length} users`);

  // Seed Inventory
  const createdInventory = await Inventory.insertMany(inventory);
  console.log(`📦 Seeded ${createdInventory.length} inventory items`);

  // Seed sample Repairs
  const tech1 = createdUsers.find(u => u.username === 'tech1');
  const tech2 = createdUsers.find(u => u.username === 'tech2');
  const muc = createdInventory.find(i => i.name.includes('Canon Cartridge'));
  const keo = createdInventory.find(i => i.name.includes('Keo tản nhiệt'));

  const repairs = [
    {
      repairCode: 'REP-1001',
      customerName: 'Trần Văn Hùng',
      customerPhone: '0912345678',
      deviceType: 'pc',
      deviceName: 'PC Gaming Intel Core i3',
      issueDescription: 'Máy khởi động lên đèn quạt quay nhưng không lên màn hình.',
      status: 'fixing',
      assignedTechId: tech1._id,
      history: [
        { status: 'received',   timestamp: new Date('2026-05-23T08:00:00.000Z'), note: 'Tiếp nhận máy từ khách hàng tại cửa hàng.' },
        { status: 'inspecting', timestamp: new Date('2026-05-23T09:30:00.000Z'), note: 'KTV kiểm tra: Máy lỗi RAM do chân bị oxy hóa. Đề xuất vệ sinh máy và tra keo tản nhiệt.' },
        { status: 'fixing',     timestamp: new Date('2026-05-23T10:15:00.000Z'), note: 'Đang vệ sinh thùng máy, bôi keo tản nhiệt MX-4 cho CPU.' }
      ],
      partsUsed: [{ inventoryId: keo._id, name: keo.name, qty: 1, price: keo.price }],
      serviceFee: 150000,
      totalPrice: 270000
    },
    {
      repairCode: 'REP-1002',
      customerName: 'Nguyễn Thị Mai',
      customerPhone: '0987654321',
      deviceType: 'printer',
      deviceName: 'Canon LBP 2900',
      issueDescription: 'In ra giấy có vệt đen dọc trang rất đậm, chữ mờ nhòe.',
      status: 'completed',
      assignedTechId: tech2._id,
      history: [
        { status: 'received',   timestamp: new Date('2026-05-22T14:20:00.000Z'), note: 'Nhận máy in Canon 2900 báo lỗi vệt đen dọc giấy.' },
        { status: 'inspecting', timestamp: new Date('2026-05-22T15:00:00.000Z'), note: 'Hộp mực cũ hỏng drum, mực thải tràn. Cần thay Cartridge 303 mới.' },
        { status: 'fixing',     timestamp: new Date('2026-05-22T15:30:00.000Z'), note: 'Lắp hộp mực Cartridge 303 mới, lau trục cuốn giấy, hút bụi.' },
        { status: 'completed',  timestamp: new Date('2026-05-22T16:00:00.000Z'), note: 'Test in thử 10 trang sắc nét. Đã bàn giao và xuất hóa đơn.' }
      ],
      partsUsed: [{ inventoryId: muc._id, name: muc.name, qty: 1, price: muc.price }],
      serviceFee: 100000,
      totalPrice: 350000
    },
    {
      repairCode: 'REP-1003',
      customerName: 'Lê Văn Tuyên',
      customerPhone: '0905123456',
      deviceType: 'laptop',
      deviceName: 'Dell Vostro 3510',
      issueDescription: 'Máy báo No Bootable Device, ổ cứng HDD có tiếng kêu cạch cạch.',
      status: 'received',
      assignedTechId: null,
      history: [
        { status: 'received', timestamp: new Date('2026-05-23T11:10:00.000Z'), note: 'Nhận máy Dell Vostro báo lỗi ổ cứng. Khách yêu cầu thay SSD và cài lại Win 11.' }
      ],
      partsUsed: [],
      serviceFee: 200000,
      totalPrice: 200000
    }
  ];

  await Repair.insertMany(repairs);
  console.log(`🔧 Seeded ${repairs.length} repair records`);

  console.log('\n🎉 Database seeded successfully!');
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB Atlas');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
