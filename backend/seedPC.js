import 'dotenv/config';
import mongoose from 'mongoose';
import Category from './src/models/Category.js';
import Product from './src/models/Product.js';
import Need from './src/models/Need.js';
import RecommendationRule from './src/models/RecommendationRule.js';
import User from './src/models/User.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || process.argv[2] || 'mongodb+srv://trung0971923110_db_user:Trung2004@builsanphamtheoyeucau.j4ckpyc.mongodb.net/sanpham';
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
  console.log('✅ Connected to MongoDB!');

  // Clear existing collections
  console.log('🗑️ Clearing existing collections...');
  // CHỈ XÓA KHI THỰC SỰ MUỐN RESET TOÀN BỘ. 
  // Nếu muốn thêm sản phẩm mới mà giữ link ảnh cũ, hãy comment các dòng deleteMany.
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    Need.deleteMany({}),
    RecommendationRule.deleteMany({}),
    User.deleteMany({})
  ]);
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
    { name: 'Intel Core i3-10100F', image: 'https://via.placeholder.com/400x300?text=Core+i5+11400F', category: getCatId('CPU'), brand: 'Intel', price: 2650000, stockQuantity: 15, specs: '6 Cores, 12 Threads, Socket LGA1200', description: 'CPU Intel Gen 11 tầm trung mạnh mẽ', attributes: { socket: 'LGA1200', power: 65, cores: 6 } },
    { name: 'Intel Core i5-13600K', image: 'https://via.placeholder.com/400x300?text=Core+i5+13600K', category: getCatId('CPU'), brand: 'Intel', price: 7850000, stockQuantity: 7, specs: '14 Cores, 20 Threads, Socket LGA1700', description: 'CPU Intel Gen 13 hiệu năng cực cao cho gaming và làm việc', attributes: { socket: 'LGA1700', power: 125, cores: 14 } },
    { name: 'Intel Core i7-12700K', image: 'https://via.placeholder.com/400x300?text=Core+i7+12700K', category: getCatId('CPU'), brand: 'Intel', price: 7290000, stockQuantity: 5, specs: '12 Cores, 20 Threads, Socket LGA1700', description: 'CPU Intel Gen 12 cao cấp cho đồ họa và chơi game nặng', attributes: { socket: 'LGA1700', power: 125, cores: 12 } },
    { name: 'Intel Core i7-13700', image: 'https://via.placeholder.com/400x300?text=Core+i7+13700', category: getCatId('CPU'), brand: 'Intel', price: 9890000, stockQuantity: 4, specs: '16 Cores, 24 Threads, Socket LGA1700', description: 'CPU Intel Gen 13 mạnh mẽ vượt trội', attributes: { socket: 'LGA1700', power: 65, cores: 16 } },
    { name: 'Intel Core i3-12100F', image: 'https://via.placeholder.com/400x300?text=Core+i3+12100F', category: getCatId('CPU'), brand: 'Intel', price: 2150000, stockQuantity: 15, specs: '4 Cores, 8 Threads, Socket LGA1700', description: 'CPU Intel Gen 12 phân khúc giá rẻ hiệu năng cao', attributes: { socket: 'LGA1700', power: 65, cores: 4 } },
    { name: 'Intel Core i5-12400F', image: 'https://via.placeholder.com/400x300?text=Core+i5+12400F', category: getCatId('CPU'), brand: 'Intel', price: 3490000, stockQuantity: 12, specs: '6 Cores, 12 Threads, Socket LGA1700', description: 'CPU quốc dân cho game thủ tầm trung', attributes: { socket: 'LGA1700', power: 65, cores: 6 } },
    { name: 'Intel Core i5-13400F', image: 'https://via.placeholder.com/400x300?text=Core+i5+13400F', category: getCatId('CPU'), brand: 'Intel', price: 5290000, stockQuantity: 8, specs: '10 Cores, 16 Threads, Socket LGA1700', description: 'CPU Gen 13 mạnh mẽ nhiều nhân xử lý tốt đa tác vụ', attributes: { socket: 'LGA1700', power: 65, cores: 10 } },
    { name: 'Intel Core i9-14900K', image: 'https://via.placeholder.com/400x300?text=Core+i9+14900K', category: getCatId('CPU'), brand: 'Intel', price: 15500000, stockQuantity: 5, specs: '24 Cores, 32 Threads, Socket LGA1700', description: 'CPU Intel Gen 14 mạnh nhất cho người dùng cuối', attributes: { socket: 'LGA1700', power: 125, cores: 24 } },
    { name: 'AMD Ryzen 5 7600', image: 'https://via.placeholder.com/400x300?text=Ryzen+5+7600', category: getCatId('CPU'), brand: 'AMD', price: 5450000, stockQuantity: 6, specs: '6 Cores, 12 Threads, Socket AM5', description: 'CPU AMD thế hệ mới hỗ trợ RAM DDR5 cực tốt', attributes: { socket: 'AM5', power: 65, cores: 6 } },
    { name: 'AMD Ryzen 7 7800X3D', image: 'https://via.placeholder.com/400x300?text=Ryzen+7+7800X3D', category: getCatId('CPU'), brand: 'AMD', price: 10500000, stockQuantity: 3, specs: '8 Cores, 16 Threads, Socket AM5, 3D V-Cache', description: 'Vua chơi game ở thời điểm hiện tại', attributes: { socket: 'AM5', power: 120, cores: 8 } },

    // Mainboards
    { name: 'MSI PRO H610M-E DDR4', image: 'https://via.placeholder.com/400x300?text=MSI+H610M', category: getCatId('Mainboard'), brand: 'MSI', price: 1850000, stockQuantity: 10, specs: 'Socket LGA1700, DDR4', description: 'Mainboard phổ thông giá tốt', attributes: { socket: 'LGA1700', ramType: 'DDR4' } },
    { name: 'ASUS PRIME B760M-A WIFI DDR4', image: 'https://via.placeholder.com/400x300?text=ASUS+B760M', category: getCatId('Mainboard'), brand: 'ASUS', price: 3150000, stockQuantity: 7, specs: 'Socket LGA1700, DDR4, Wifi tích hợp', description: 'Mainboard tầm trung đầy đủ kết nối', attributes: { socket: 'LGA1700', ramType: 'DDR4' } },
    { name: 'ASUS TUF GAMING B560M-PLUS', image: 'https://via.placeholder.com/400x300?text=ASUS+B560M', category: getCatId('Mainboard'), brand: 'ASUS', price: 3450000, stockQuantity: 6, specs: 'Socket LGA1200, DDR4', description: 'Mainboard bền bỉ cho Intel Gen 10/11', attributes: { socket: 'LGA1200', ramType: 'DDR4' } },
    { name: 'GIGABYTE B760M GAMING X AX DDR5', image: 'https://via.placeholder.com/400x300?text=Gigabyte+B760M', category: getCatId('Mainboard'), brand: 'Gigabyte', price: 4200000, stockQuantity: 5, specs: 'Socket LGA1700, DDR5, Wifi tích hợp', description: 'Mainboard B760 cao cấp hỗ trợ RAM DDR5', attributes: { socket: 'LGA1700', ramType: 'DDR5' } },
    { name: 'GIGABYTE Z790 AORUS ELITE AX', image: 'https://via.placeholder.com/400x300?text=Gigabyte+Z790', category: getCatId('Mainboard'), brand: 'Gigabyte', price: 7590000, stockQuantity: 3, specs: 'Socket LGA1700, DDR5, High-end', description: 'Mainboard Z790 cao cấp cho ép xung', attributes: { socket: 'LGA1700', ramType: 'DDR5' } },
    { name: 'MSI MEG Z890 ACE', image: 'https://via.placeholder.com/400x300?text=MSI+Z890', category: getCatId('Mainboard'), brand: 'MSI', price: 18900000, stockQuantity: 2, specs: 'Socket LGA1851, DDR5, High-end', description: 'Mainboard Z890 thế hệ mới nhất cho Core Ultra', attributes: { socket: 'LGA1851', ramType: 'DDR5' } },
    { name: 'MSI PRO B650M-A WIFI DDR5', image: 'https://via.placeholder.com/400x300?text=MSI+B650M', category: getCatId('Mainboard'), brand: 'MSI', price: 4390000, stockQuantity: 4, specs: 'Socket AM5, DDR5, Wifi tích hợp', description: 'Mainboard chuẩn cho CPU AMD AM5', attributes: { socket: 'AM5', ramType: 'DDR5' } },
    { name: 'ASUS ROG STRIX B650-A GAMING WIFI', image: 'https://via.placeholder.com/400x300?text=ROG+B650-A', category: getCatId('Mainboard'), brand: 'ASUS', price: 6250000, stockQuantity: 2, specs: 'Socket AM5, DDR5, Thiết kế Gaming đẹp mắt', description: 'Mainboard AM5 cao cấp của ASUS ROG', attributes: { socket: 'AM5', ramType: 'DDR5' } },

    // RAMs
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
      category: getCatId('RAM'),
      brand: brandObj.b,
      price: brandObj.p[idx] * 1000,
      stockQuantity: 15,
      specs: `DDR4 3200MHz`,
      description: `Thanh RAM ${cap}GB chất lượng cao từ ${brandObj.b}`,
      attributes: { ramType: 'DDR4', capacity: cap }
    }))),

    // VGAs
    { name: 'MSI GeForce GTX 1650 D6 AERO ITX 4G', image: 'https://via.placeholder.com/400x300?text=GTX+1650+MSI', category: getCatId('VGA'), brand: 'MSI', price: 3650000, stockQuantity: 6, specs: '4GB GDDR6, 1 quạt gọn nhẹ', description: 'Card đồ họa bình dân cho máy văn phòng và game nhẹ', attributes: { power: 75, capacity: 4 } },
    { name: 'ASUS Dual GeForce RTX 3050 V2 8GB', image: 'https://via.placeholder.com/400x300?text=RTX+3050+ASUS', category: getCatId('VGA'), brand: 'ASUS', price: 5890000, stockQuantity: 8, specs: '8GB GDDR6, Hỗ trợ DLSS & Ray Tracing', description: 'Card đồ họa tầm trung giá mềm có công nghệ Ray Tracing', attributes: { power: 130, capacity: 8 } },
    { name: 'GIGABYTE GeForce RTX 4060 WINDFORCE OC 8G', image: 'https://via.placeholder.com/400x300?text=RTX+4060+Gigabyte', category: getCatId('VGA'), brand: 'Gigabyte', price: 8190000, stockQuantity: 10, specs: '8GB GDDR6, Thế hệ RTX 40, Tiết kiệm điện', description: 'Card đồ họa quốc dân thế hệ 40 siêu mát', attributes: { power: 115, capacity: 8 } },
    { name: 'GIGABYTE GeForce RTX 4070 Ti SUPER EAGLE OC', image: 'https://via.placeholder.com/400x300?text=RTX+4070Ti+Gigabyte', category: getCatId('VGA'), brand: 'Gigabyte', price: 24990000, stockQuantity: 4, specs: '16GB GDDR6X, 3 fan', description: 'Card đồ họa cực mạnh cho gaming 4K', attributes: { power: 285, capacity: 16 } },
    { name: 'MSI GeForce RTX 4060 Ti VENTUS 2X 8G OC', image: 'https://via.placeholder.com/400x300?text=RTX+4060+Ti+MSI', category: getCatId('VGA'), brand: 'MSI', price: 11450000, stockQuantity: 5, specs: '8GB GDDR6, Đồ họa mượt mà', description: 'Sự lựa chọn hoàn hảo cho chơi game Full HD và 2K', attributes: { power: 160, capacity: 8 } },
    { name: 'ASUS TUF Gaming GeForce RTX 4070 SUPER 12GB', image: 'https://via.placeholder.com/400x300?text=RTX+4070+Super+ASUS', category: getCatId('VGA'), brand: 'ASUS', price: 19490000, stockQuantity: 3, specs: '12GB GDDR6X, Siêu bền TUF', description: 'Quái vật chiến game 2K/4K và làm đồ họa chuyên nghiệp', attributes: { power: 220, capacity: 12 } },

    // PSUs
    { name: 'Antec Atom V550 550W', image: 'https://placehold.co/400x300?text=Antec+V550', category: getCatId('PSU'), brand: 'Antec', price: 690000, stockQuantity: 14, specs: '550W công suất thực', description: 'Nguồn giá rẻ cho cấu hình văn phòng', attributes: { wattage: 550 } },
    { name: 'Antec NeoEco 750W 80 Plus Gold', image: 'https://placehold.co/400x300?text=Antec+750W', category: getCatId('PSU'), brand: 'Antec', price: 2350000, stockQuantity: 6, specs: '750W Gold, Full Modular', description: 'Nguồn cao cấp chuẩn Gold từ Antec', attributes: { wattage: 750 } },
    { name: 'MSI MAG A650BN 650W 80 Plus Bronze', image: 'https://placehold.co/400x300?text=MSI+A650BN', category: getCatId('PSU'), brand: 'MSI', price: 1350000, stockQuantity: 11, specs: '650W, 80 Plus Bronze', description: 'Nguồn chất lượng cao cho PC chơi game tầm trung', attributes: { wattage: 650 } },
    { name: 'Corsair CV750 750W 80 Plus Bronze', image: 'https://placehold.co/400x300?text=Corsair+CV750', category: getCatId('PSU'), brand: 'Corsair', price: 1790000, stockQuantity: 8, specs: '750W, 80 Plus Bronze', description: 'Nguồn ổn định cho cấu hình RTX 4060/4070', attributes: { wattage: 750 } },
    { name: 'Corsair RM850e 850W 80 Plus Gold', image: 'https://placehold.co/400x300?text=Corsair+850W', category: getCatId('PSU'), brand: 'Corsair', price: 3250000, stockQuantity: 5, specs: '850W Gold, PCIe 5.0 ready', description: 'Nguồn Corsair chuẩn Gold cao cấp', attributes: { wattage: 850 } },
    { name: 'MSI MAG A850GL 850W PCIe 5.0 80 Plus Gold', image: 'https://placehold.co/400x300?text=MSI+A850GL', category: getCatId('PSU'), brand: 'MSI', price: 2990000, stockQuantity: 4, specs: '850W, 80 Plus Gold, Full Modular', description: 'Nguồn chuẩn ATX 3.0 gánh card màn hình cao cấp', attributes: { wattage: 850 } },

    // SSDs
    { name: 'Lexar NS100 128GB 2.5 inch SATA3', image: 'https://placehold.co/400x300?text=Lexar+128GB', category: getCatId('SSD'), brand: 'Lexar', price: 350000, stockQuantity: 20, specs: '128GB SATA3', description: 'SSD giá rẻ khởi động máy cực nhanh', attributes: { capacity: 128, readSpeed: 520, writeSpeed: 450 } },
    { name: 'Kingston A400 256GB 2.5 inch SATA3', image: 'https://placehold.co/400x300?text=Kingston+A400', category: getCatId('SSD'), brand: 'Kingston', price: 550000, stockQuantity: 25, specs: '256GB SATA3', description: 'Nâng cấp tốc độ máy tính cũ cực tốt', attributes: { capacity: 256, readSpeed: 500, writeSpeed: 350 } },
    { name: 'Samsung 870 EVO 256GB 2.5 inch SATA3', image: 'https://placehold.co/400x300?text=Samsung+256GB', category: getCatId('SSD'), brand: 'Samsung', price: 950000, stockQuantity: 15, specs: '256GB SATA3', description: 'Dòng SSD SATA3 bền bỉ và ổn định nhất của Samsung', attributes: { capacity: 256, readSpeed: 560, writeSpeed: 530 } },
    { name: 'Kingston NV2 1TB M.2 PCIe Gen4 x4 NVMe', image: 'https://placehold.co/400x300?text=Kingston+NV2', category: getCatId('SSD'), brand: 'Kingston', price: 1690000, stockQuantity: 20, specs: '1TB NVMe PCIe Gen4', description: 'Dung lượng lớn 1TB giá cực hời', attributes: { capacity: 1000 } },
    { name: 'Kingston NV2 512GB M.2 PCIe Gen4 x4 NVMe', image: 'https://placehold.co/400x300?text=Kingston+512GB', category: getCatId('SSD'), brand: 'Kingston', price: 990000, stockQuantity: 18, specs: '512GB NVMe PCIe Gen4', description: 'SSD NVMe Gen4 tốc độ cao giá phổ thông', attributes: { capacity: 512, readSpeed: 3500, writeSpeed: 2100 } },
    { name: 'Samsung 980 512GB M.2 NVMe PCIe Gen3', image: 'https://via.placeholder.com/400x300?text=Samsung+980', category: getCatId('SSD'), brand: 'Samsung', price: 1290000, stockQuantity: 16, specs: '512GB NVMe PCIe Gen3', description: 'SSD tốc độ cao đáng tin cậy của Samsung', attributes: { capacity: 512, readSpeed: 3100, writeSpeed: 2600 } },
    { name: 'Samsung 990 PRO 1TB M.2 NVMe PCIe Gen4 x4', image: 'https://via.placeholder.com/400x300?text=Samsung+990+PRO', category: getCatId('SSD'), brand: 'Samsung', price: 2890000, stockQuantity: 6, specs: '1TB NVMe PCIe Gen4, Tốc độ đọc 7450MB/s', description: 'Ông vua SSD Gen 4 tốc độ khủng khiếp', attributes: { capacity: 1000, readSpeed: 7450, writeSpeed: 6900 } },
    { name: 'WD Blue SN580 512GB NVMe Gen4', image: 'https://placehold.co/400x300?text=WD+Blue+512GB', category: getCatId('SSD'), brand: 'WD', price: 1350000, stockQuantity: 12, specs: '512GB Gen4', description: 'SSD WD Blue ổn định cho văn phòng', attributes: { capacity: 512, readSpeed: 4150, writeSpeed: 4150 } },
    { name: 'WD Black SN850X 1TB NVMe Gen4', image: 'https://placehold.co/400x300?text=WD+Black+1TB', category: getCatId('SSD'), brand: 'WD', price: 2950000, stockQuantity: 8, specs: '1TB Gen4 High Speed', description: 'SSD WD Black chuyên game', attributes: { capacity: 1000, readSpeed: 7300, writeSpeed: 6300 } },
    { name: 'Crucial P3 Plus 512GB Gen4', image: 'https://placehold.co/400x300?text=Crucial+512GB', category: getCatId('SSD'), brand: 'Crucial', price: 1250000, stockQuantity: 10, specs: '512GB Gen4', description: 'SSD Crucial giá tốt', attributes: { capacity: 512, readSpeed: 4700, writeSpeed: 1900 } },
    { name: 'Crucial T700 1TB Gen5', image: 'https://placehold.co/400x300?text=Crucial+1TB', category: getCatId('SSD'), brand: 'Crucial', price: 5490000, stockQuantity: 3, specs: '1TB Gen5 Ultra Speed', description: 'SSD Gen 5 nhanh nhất thế giới', attributes: { capacity: 1000, readSpeed: 11700, writeSpeed: 9500 } },
    { name: 'Lexar NM710 512GB Gen4', image: 'https://placehold.co/400x300?text=Lexar+512GB', category: getCatId('SSD'), brand: 'Lexar', price: 1190000, stockQuantity: 15, specs: '512GB Gen4', description: 'SSD Lexar bền bỉ', attributes: { capacity: 512, readSpeed: 5000, writeSpeed: 4500 } },
    { name: 'Lexar NM790 1TB Gen4', image: 'https://placehold.co/400x300?text=Lexar+1TB', category: getCatId('SSD'), brand: 'Lexar', price: 2150000, stockQuantity: 10, specs: '1TB Gen4 Performance', description: 'SSD Lexar hiệu năng cao', attributes: { capacity: 1000, readSpeed: 7400, writeSpeed: 6500 } },

    // Cases
    { name: 'Xigmatek XA-22 Văn phòng', image: 'https://placehold.co/400x300?text=Case+XA-22', category: getCatId('Case'), brand: 'Xigmatek', price: 320000, stockQuantity: 15, specs: 'Vỏ ATX nhỏ gọn màu đen', description: 'Case văn phòng đơn giản', attributes: { size: 'ATX' } },
    { name: 'Xigmatek NYX 3F (Kèm 3 Fan RGB)', image: 'https://placehold.co/400x300?text=Case+NYX+3F', category: getCatId('Case'), brand: 'Xigmatek', price: 650000, stockQuantity: 12, specs: 'Mặt kính cường lực kèm quạt màu', description: 'Lựa chọn vỏ máy đẹp giá rẻ cho sinh viên', attributes: { size: 'Micro-ATX' } },
    { name: 'Montech AIR 100 LITE Black (Kèm 2 Fan)', image: 'https://placehold.co/400x300?text=Case+Montech', category: getCatId('Case'), brand: 'Montech', price: 950000, stockQuantity: 8, specs: 'Thiết kế Mesh tổ ong đối lưu không khí', description: 'Vỏ máy cao cấp luồng khí tốt', attributes: { size: 'Micro-ATX' } },
    { name: 'VSP ES1 Black', image: 'https://placehold.co/400x300?text=VSP+ES1', category: getCatId('Case'), brand: 'VSP', price: 450000, stockQuantity: 20, specs: 'Vỏ case văn phòng VSP', description: 'Case VSP giá rẻ', attributes: { size: 'ATX' } },
    { name: 'VSP Tech V3-607', image: 'https://placehold.co/400x300?text=VSP+V3', category: getCatId('Case'), brand: 'VSP', price: 550000, stockQuantity: 15, specs: 'Vỏ case văn phòng VSP Tech', description: 'Case VSP Tech bền bỉ', attributes: { size: 'ATX' } },
    { name: 'Corsair 4000D Airflow', image: 'https://placehold.co/400x300?text=Corsair+4000D', category: getCatId('Case'), brand: 'Corsair', price: 2390000, stockQuantity: 5, specs: 'ATX High Airflow', description: 'Vỏ case Corsair cao cấp', attributes: { size: 'ATX' } },
    { name: 'Corsair 3000D RGB Airflow', image: 'https://placehold.co/400x300?text=Corsair+3000D', category: getCatId('Case'), brand: 'Corsair', price: 2150000, stockQuantity: 7, specs: 'ATX RGB Case', description: 'Vỏ case Corsair kèm fan RGB', attributes: { size: 'ATX' } }
  ];

  console.log('📦 Seeding products...');
  const products = await Product.insertMany(productsData);
  console.log(`✅ Seeded ${products.length} products.`);

  // Add placeholder images for products that don't have an image field
  console.log('🖼️ Ensuring product images are set...');
  for (const p of products) {
    if (!p.image) {
      const url = `https://placehold.co/400x300?text=${encodeURIComponent(p.name)}`;
      await Product.findByIdAndUpdate(p._id, { image: url });
    }
  }
  console.log('✅ Product images ensured.');

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
