import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from '../models/Product.js';

// Khởi tạo Gemini AI
let genAIInstance = null;
let lastUsedKey = null;

const getModel = () => {
  // Sử dụng khóa mới bạn cung cấp làm fallback mặc định
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBvQiLrldj_cmVHTk6S15iBNQwQvDyVOZU';
  if (!apiKey) return null;

  // Tự động khởi tạo lại nếu mã khóa thay đổi (từ .env hoặc code)
  if (!genAIInstance || lastUsedKey !== apiKey) {
    genAIInstance = new GoogleGenerativeAI(apiKey);
    lastUsedKey = apiKey;
    console.log(`[AI] ✅ Gemini initialized, key prefix: ${apiKey.substring(0, 10)}...`);
  }

  // Dùng gemini-1.5-flash: 1500 req/ngày (cao hơn 2.0-flash chỉ 200 req/ngày)
  return genAIInstance.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const aiService = {
  generateResponse: async (message) => {
    try {
      const model = getModel();
      if (!model) {
        return "Hệ thống AI chưa nhận được API Key. Vui lòng kiểm tra file .env trong thư mục backend và khởi động lại server.";
      }

      // Giảm từ 50 → 20 sản phẩm để tiết kiệm token
      const products = await Product.find({ status: 'active' })
        .sort({ updatedAt: -1 })
        .limit(20)
        .lean();

      // Chỉ lấy tên + giá, bỏ mô tả dài để giảm token
      const productContext = products.map(p =>
        `- ${p.name}: ${p.price ? p.price.toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}`
      ).join('\n');

      const prompt = `Bạn là trợ lý AI của cửa hàng ITSurv-SMS (Hà Nội). Tư vấn linh kiện, báo giá và hỗ trợ lắp ráp PC.

Sản phẩm trong kho:
${productContext}

Quy tắc: Ưu tiên sản phẩm có sẵn. Trả lời tiếng Việt, thân thiện, ngắn gọn. Tính tổng tiền nếu cần.

Câu hỏi: "${message}"`;

      const result = await model.generateContent(prompt);
      return result.response.text();

    } catch (error) {
      console.error('❌ Lỗi Gemini AI:', error.status, error.message);

      if (error.status === 429) {
        return "AI đang bận, bạn vui lòng thử lại sau vài giây nhé! 🙏";
      }
      if (error.message && error.message.includes('API_KEY_INVALID')) {
        return "API Key không hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY trong file .env.";
      }
      // Return detailed error for debugging
      return `Lỗi AI: ${error.message || 'Unknown error'}`;
    }
  }
};