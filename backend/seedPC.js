import 'dotenv/config';
import mongoose from 'mongoose';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';
import Need from './src/models/Need.js';
import RecommendationRule from './src/models/RecommendationRule.js';
import User from './src/models/User.js';

const MONGODB_URI = process.env.MONGODB_URI || process.argv[2] || 'mongodb://127.0.0.1:27017/sanpham';
if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not set; falling back to', MONGODB_URI);
}

const categoriesData = [
  { name: 'CPU' },
  { name: 'Mainboard' },
  { name: 'RAM' },
  { name: 'VGA' },
  { name: 'PSU' },
  { name: 'SSD' },
  { name: 'Case' }
];

const needsData = [
  { name: 'Chơi game' },
  { name: 'Lập trình' },
  { name: 'Đồ họa 3D' },
  { name: 'Văn phòng' }
];

const usersData = [
  { username: 'admin', password: 'adminpassword123', name: 'Nguyễn Admin', email: 'admin@pcbuilder.vn', phone: '0912345678', address: 'Hà Nội', role: 'admin' },
  { username: 'customer1', password: 'userpassword123', name: 'Trần Văn Khách', email: 'khachhang@gmail.com', phone: '0987654321', address: 'TP. Hồ Chí Minh', role: 'customer' }
];

async function seed() {
  console.log('⏳ Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB Atlas!');

  // Clear existing collections
  console.log('🗑️ Clearing existing collections...');
  await Category.deleteMany({});
  await Product.deleteMany({});
  await Need.deleteMany({});
  await RecommendationRule.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️ Collections cleared.');

  // Seed Users
  console.log('👤 Seeding users...');
  const users = await User.insertMany(usersData);
  console.log(`✅ Seeded ${users.length} users.`);

  // Seed Categories
  console.log('📁 Seeding categories...');
  const categories = await Category.insertMany(categoriesData);
  console.log(`✅ Seeded ${categories.length} categories.`);

  // Map Category Name to ObjectId
  const getCatId = (name) => categories.find(c => c.name === name)._id;

  const productsData = [
    // CPUs
    { name: 'Intel Core i3-12100F', category: getCatId('CPU'), brand: 'Intel', price: 2150000, stockQuantity: 15, specs: '4 Cores, 8 Threads, Socket LGA1700', description: 'CPU Intel Gen 12 phân khúc giá rẻ hiệu năng cao', attributes: { socket: 'LGA1700', power: 65, cores: 4 } },
    { name: 'Intel Core i5-12400F', category: getCatId('CPU'), brand: 'Intel', price: 3490000, stockQuantity: 12, specs: '6 Cores, 12 Threads, Socket LGA1700', description: 'CPU quốc dân cho game thủ tầm trung', attributes: { socket: 'LGA1700', power: 65, cores: 6 } },
    { name: 'Intel Core i5-13400F', category: getCatId('CPU'), brand: 'Intel', price: 5290000, stockQuantity: 8, specs: '10 Cores, 16 Threads, Socket LGA1700', description: 'CPU Gen 13 mạnh mẽ nhiều nhân xử lý tốt đa tác vụ', attributes: { socket: 'LGA1700', power: 65, cores: 10 } },
    { name: 'AMD Ryzen 5 7600', category: getCatId('CPU'), brand: 'AMD', price: 5450000, stockQuantity: 6, specs: '6 Cores, 12 Threads, Socket AM5', description: 'CPU AMD thế hệ mới hỗ trợ RAM DDR5 cực tốt', attributes: { socket: 'AM5', power: 65, cores: 6 } },
    { name: 'AMD Ryzen 7 7800X3D', category: getCatId('CPU'), brand: 'AMD', price: 10500000, stockQuantity: 3, specs: '8 Cores, 16 Threads, Socket AM5, 3D V-Cache', description: 'Vua chơi game ở thời điểm hiện tại', attributes: { socket: 'AM5', power: 120, cores: 8 } },

    // Mainboards
    { name: 'MSI PRO H610M-E DDR4', category: getCatId('Mainboard'), brand: 'MSI', price: 1850000, stockQuantity: 10, specs: 'Socket LGA1700, DDR4', description: 'Mainboard phổ thông giá tốt', attributes: { socket: 'LGA1700', ramType: 'DDR4' } },
    { name: 'ASUS PRIME B760M-A WIFI DDR4', category: getCatId('Mainboard'), brand: 'ASUS', price: 3150000, stockQuantity: 7, specs: 'Socket LGA1700, DDR4, Wifi tích hợp', description: 'Mainboard tầm trung đầy đủ kết nối', attributes: { socket: 'LGA1700', ramType: 'DDR4' } },
    { name: 'GIGABYTE B760M GAMING X AX DDR5', category: getCatId('Mainboard'), brand: 'Gigabyte', price: 4200000, stockQuantity: 5, specs: 'Socket LGA1700, DDR5, Wifi tích hợp', description: 'Mainboard B760 cao cấp hỗ trợ RAM DDR5', attributes: { socket: 'LGA1700', ramType: 'DDR5' } },
    { name: 'MSI PRO B650M-A WIFI DDR5', category: getCatId('Mainboard'), brand: 'MSI', price: 4390000, stockQuantity: 4, specs: 'Socket AM5, DDR5, Wifi tích hợp', description: 'Mainboard chuẩn cho CPU AMD AM5', attributes: { socket: 'AM5', ramType: 'DDR5' } },
    { name: 'ASUS ROG STRIX B650-A GAMING WIFI', category: getCatId('Mainboard'), brand: 'ASUS', price: 6250000, stockQuantity: 2, specs: 'Socket AM5, DDR5, Thiết kế Gaming đẹp mắt', description: 'Mainboard AM5 cao cấp của ASUS ROG', attributes: { socket: 'AM5', ramType: 'DDR5' } },

    // RAMs
    { name: 'Kingston FURY Beast 8GB DDR4 3200MHz', category: getCatId('RAM'), brand: 'Kingston', price: 590000, stockQuantity: 30, specs: '8GB DDR4 3200MHz', description: 'RAM bền bỉ giá rẻ của Kingston', attributes: { ramType: 'DDR4', capacity: 8 } },
    { name: 'Kingston FURY Beast 16GB DDR4 3200MHz', category: getCatId('RAM'), brand: 'Kingston', price: 1150000, stockQuantity: 25, specs: '16GB DDR4 3200MHz', description: 'Dung lượng 16GB chuẩn cho PC hiện đại', attributes: { ramType: 'DDR4', capacity: 16 } },
    { name: 'Corsair Vengeance LPX 16GB DDR4 3200MHz', category: getCatId('RAM'), brand: 'Corsair', price: 1090000, stockQuantity: 18, specs: '16GB DDR4 3200MHz tản thép', description: 'RAM tản nhiệt chuyên nghiệp', attributes: { ramType: 'DDR4', capacity: 16 } },
    { name: 'Kingston FURY Beast 16GB DDR5 5600MHz', category: getCatId('RAM'), brand: 'Kingston', price: 1550000, stockQuantity: 12, specs: '16GB DDR5 5600MHz tốc độ cao', description: 'RAM DDR5 hiệu năng vượt trội', attributes: { ramType: 'DDR5', capacity: 16 } },
    { name: 'Corsair Vengeance RGB 32GB DDR5 6000MHz', category: getCatId('RAM'), brand: 'Corsair', price: 3390000, stockQuantity: 8, specs: '32GB (2x16GB) DDR5 6000MHz có LED RGB', description: 'Cặp RAM DDR5 đỉnh cao thẩm mỹ và tốc độ', attributes: { ramType: 'DDR5', capacity: 32 } },

    // VGAs
    { name: 'MSI GeForce GTX 1650 D6 AERO ITX 4G', category: getCatId('VGA'), brand: 'MSI', price: 3650000, stockQuantity: 6, specs: '4GB GDDR6, 1 quạt gọn nhẹ', description: 'Card đồ họa bình dân cho máy văn phòng và game nhẹ', attributes: { power: 75 } },
    { name: 'ASUS Dual GeForce RTX 3050 V2 8GB', category: getCatId('VGA'), brand: 'ASUS', price: 5890000, stockQuantity: 8, specs: '8GB GDDR6, Hỗ trợ DLSS & Ray Tracing', description: 'Card đồ họa tầm trung giá mềm có công nghệ Ray Tracing', attributes: { power: 130 } },
    { name: 'GIGABYTE GeForce RTX 4060 WINDFORCE OC 8G', category: getCatId('VGA'), brand: 'Gigabyte', price: 8190000, stockQuantity: 10, specs: '8GB GDDR6, Thế hệ RTX 40, Tiết kiệm điện', description: 'Card đồ họa quốc dân thế hệ 40 siêu mát', attributes: { power: 115 } },
    { name: 'MSI GeForce RTX 4060 Ti VENTUS 2X 8G OC', category: getCatId('VGA'), brand: 'MSI', price: 11450000, stockQuantity: 5, specs: '8GB GDDR6, Đồ họa mượt mà', description: 'Sự lựa chọn hoàn hảo cho chơi game Full HD và 2K', attributes: { power: 160 } },
    { name: 'ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB', category: getCatId('VGA'), brand: 'ASUS', price: 19490000, stockQuantity: 3, specs: '12GB GDDR6X, Siêu bền TUF', description: 'Quái vật chiến game 2K/4K và làm đồ họa chuyên nghiệp', attributes: { power: 220 } },

    // PSUs
    { name: 'Antec Atom V550 550W', category: getCatId('PSU'), brand: 'Antec', price: 690000, stockQuantity: 14, specs: '550W công suất thực', description: 'Nguồn giá rẻ cho cấu hình văn phòng', attributes: { wattage: 550 } },
    { name: 'MSI MAG A650BN 650W 80 Plus Bronze', category: getCatId('PSU'), brand: 'MSI', price: 1350000, stockQuantity: 11, specs: '650W, 80 Plus Bronze', description: 'Nguồn chất lượng cao cho PC chơi game tầm trung', attributes: { wattage: 650 } },
    { name: 'Corsair CV750 750W 80 Plus Bronze', category: getCatId('PSU'), brand: 'Corsair', price: 1790000, stockQuantity: 8, specs: '750W, 80 Plus Bronze', description: 'Nguồn ổn định cho cấu hình RTX 4060/4070', attributes: { wattage: 750 } },
    { name: 'MSI MAG A850GL 850W PCIe 5.0 80 Plus Gold', category: getCatId('PSU'), brand: 'MSI', price: 2990000, stockQuantity: 4, specs: '850W, 80 Plus Gold, Full Modular', description: 'Nguồn chuẩn ATX 3.0 gánh card màn hình cao cấp', attributes: { wattage: 850 } },

    // SSDs
    { name: 'Kingston A400 240GB 2.5 inch SATA3', category: getCatId('SSD'), brand: 'Kingston', price: 550000, stockQuantity: 25, specs: '240GB SATA3', description: 'Nâng cấp tốc độ máy tính cũ cực tốt', attributes: { capacity: 240 } },
    { name: 'Samsung 980 500GB M.2 NVMe PCIe Gen3', category: getCatId('SSD'), brand: 'Samsung', price: 1290000, stockQuantity: 16, specs: '500GB NVMe PCIe Gen3', description: 'SSD tốc độ cao đáng tin cậy của Samsung', attributes: { capacity: 500 } },
    { name: 'Kingston NV2 1TB M.2 PCIe Gen4 x4 NVMe', category: getCatId('SSD'), brand: 'Kingston', price: 1690000, stockQuantity: 20, specs: '1TB NVMe PCIe Gen4', description: 'Dung lượng lớn 1TB giá cực hời', attributes: { capacity: 1000 } },
    { name: 'Samsung 990 PRO 1TB M.2 NVMe PCIe Gen4 x4', category: getCatId('SSD'), brand: 'Samsung', price: 2890000, stockQuantity: 6, specs: '1TB NVMe PCIe Gen4, Tốc độ đọc 7450MB/s', description: 'Ông vua SSD Gen 4 tốc độ khủng khiếp', attributes: { capacity: 1000 } },

    // Cases
    { name: 'Xigmatek XA-22 Văn phòng', category: getCatId('Case'), brand: 'Xigmatek', price: 320000, stockQuantity: 15, specs: 'Vỏ ATX nhỏ gọn màu đen', description: 'Case văn phòng đơn giản', attributes: { size: 'ATX' } },
    { name: 'Xigmatek NYX 3F (Kèm 3 Fan RGB)', category: getCatId('Case'), brand: 'Xigmatek', price: 650000, stockQuantity: 12, specs: 'Mặt kính cường lực kèm quạt màu', description: 'Lựa chọn vỏ máy đẹp giá rẻ cho sinh viên', attributes: { size: 'Micro-ATX' } },
    { name: 'Montech AIR 100 LITE Black (Kèm 2 Fan)', category: getCatId('Case'), brand: 'Montech', price: 950000, stockQuantity: 8, specs: 'Thiết kế Mesh tổ ong đối lưu không khí', description: 'Vỏ máy cao cấp luồng khí tốt', attributes: { size: 'Micro-ATX' } }
  ];

  console.log('📦 Seeding products...');
  const products = await Product.insertMany(productsData);
  console.log(`✅ Seeded ${products.length} products.`);

  // Seed Needs
  console.log('🎯 Seeding needs...');
  const needs = await Need.insertMany(needsData);
  console.log(`✅ Seeded ${needs.length} needs.`);

  // Seed Recommendation Rules
  console.log('🧠 Seeding recommendation rules...');
  const getNeedId = (name) => needs.find(n => n.name === name)._id;

  const rulesData = [
    {
      need: getNeedId('Chơi game'),
      minCPUCore: 6,
      minRAM: 16,
      requireVGA: true,
      priorityComponent: 'vga',
      budgetDistribution: {
        cpu: 0.20,
        ram: 0.10,
        mainboard: 0.12,
        vga: 0.40,
        psu: 0.08,
        ssd: 0.05,
        case: 0.05
      }
    },
    {
      need: getNeedId('Lập trình'),
      minCPUCore: 6,
      minRAM: 16,
      requireVGA: false,
      priorityComponent: 'cpu',
      budgetDistribution: {
        cpu: 0.30,
        ram: 0.15,
        mainboard: 0.15,
        vga: 0.15,
        psu: 0.08,
        ssd: 0.12,
        case: 0.05
      }
    },
    {
      need: getNeedId('Đồ họa 3D'),
      minCPUCore: 8,
      minRAM: 16,
      requireVGA: true,
      priorityComponent: 'vga',
      budgetDistribution: {
        cpu: 0.25,
        ram: 0.15,
        mainboard: 0.15,
        vga: 0.30,
        psu: 0.08,
        ssd: 0.07,
        case: 0.05
      }
    },
    {
      need: getNeedId('Văn phòng'),
      minCPUCore: 4,
      minRAM: 8,
      requireVGA: false,
      priorityComponent: 'cpu',
      budgetDistribution: {
        cpu: 0.30,
        ram: 0.15,
        mainboard: 0.15,
        vga: 0.00,
        psu: 0.10,
        ssd: 0.20,
        case: 0.10
      }
    }
  ];

  const rules = await RecommendationRule.insertMany(rulesData);
  console.log(`✅ Seeded ${rules.length} recommendation rules.`);

  console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB Atlas.');
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
