import express from 'express';
import Repair from '../models/Repair.js';
import Inventory from '../models/Inventory.js';
import User from '../models/User.js';

const router = express.Router();

// GET all repairs
router.get('/', async (req, res) => {
  try {
    const repairs = await Repair.find().sort({ createdAt: -1 });
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách phiếu sửa chữa', error: err.message });
  }
});

// GET repair by repairCode (e.g. REP-1001)
router.get('/code/:code', async (req, res) => {
  try {
    const repair = await Repair.findOne({ repairCode: req.params.code.toUpperCase() });
    if (!repair) return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải phiếu sửa chữa', error: err.message });
  }
});

// GET repairs by customer phone
router.get('/customer/:phone', async (req, res) => {
  try {
    const repairs = await Repair.find({ customerPhone: req.params.phone }).sort({ createdAt: -1 });
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tìm kiếm theo số điện thoại', error: err.message });
  }
});

// GET repairs by technician ID
router.get('/tech/:techId', async (req, res) => {
  try {
    const repairs = await Repair.find({ assignedTechId: req.params.techId }).sort({ createdAt: -1 });
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải công việc kỹ thuật viên', error: err.message });
  }
});

// GET repair by MongoDB ObjectId
router.get('/:id', async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải phiếu sửa chữa', error: err.message });
  }
});

// POST book new repair
router.post('/book', async (req, res) => {
  try {
    const { customerName, customerPhone, deviceType, deviceName, issueDescription } = req.body;
    if (!customerName || !customerPhone || !deviceType || !issueDescription) {
      return res.status(400).json({ message: 'Thiếu thông tin đặt lịch hẹn' });
    }

    const repair = new Repair({
      customerName,
      customerPhone,
      deviceType,
      deviceName: deviceName || 'Thiết bị không rõ model',
      issueDescription,
      status: 'received',
      history: [{
        status: 'received',
        timestamp: new Date(),
        note: 'Hệ thống tiếp nhận yêu cầu đặt lịch hẹn sửa chữa trực tuyến của khách hàng.'
      }],
      serviceFee: 150000,
      totalPrice: 150000
    });

    await repair.save();
    res.status(201).json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đặt lịch sửa chữa', error: err.message });
  }
});

// PATCH assign technician
router.patch('/:id/assign', async (req, res) => {
  try {
    const { techId } = req.body;
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });

    const tech = await User.findById(techId);
    const techName = tech ? tech.name : 'Kỹ thuật viên';

    repair.assignedTechId = techId;
    repair.history.push({
      status: repair.status,
      timestamp: new Date(),
      note: `Đã phân phối công việc cho Kỹ thuật viên: ${techName}.`
    });

    await repair.save();
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi phân công kỹ thuật viên', error: err.message });
  }
});

// PATCH update repair status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['received', 'inspecting', 'fixing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái sửa chữa không hợp lệ' });
    }

    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });

    repair.status = status;
    repair.history.push({
      status,
      timestamp: new Date(),
      note: note || `Cập nhật trạng thái: ${status.toUpperCase()}`
    });

    await repair.save();
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: err.message });
  }
});

// POST add replacement part to repair
router.post('/:id/parts', async (req, res) => {
  try {
    const { partId, qty } = req.body;
    const quantity = Number(qty || 1);

    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });

    const part = await Inventory.findById(partId);
    if (!part) return res.status(404).json({ message: 'Không tìm thấy linh kiện trong kho' });

    if (part.stock < quantity) {
      return res.status(400).json({ message: `Tồn kho không đủ (Hiện có: ${part.stock})` });
    }

    // Deduct stock
    part.stock -= quantity;
    await part.save();

    // Update or add to partsUsed
    const existingIdx = repair.partsUsed.findIndex(p => p.inventoryId?.toString() === partId);
    if (existingIdx > -1) {
      repair.partsUsed[existingIdx].qty += quantity;
    } else {
      repair.partsUsed.push({ inventoryId: part._id, name: part.name, qty: quantity, price: part.price });
    }

    // Recalculate total
    const partsCost = repair.partsUsed.reduce((sum, p) => sum + p.price * p.qty, 0);
    repair.totalPrice = partsCost + repair.serviceFee;

    repair.history.push({
      status: repair.status,
      timestamp: new Date(),
      note: `KTV bổ sung linh kiện thay thế: ${part.name} (SL: ${quantity}).`
    });

    await repair.save();
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm linh kiện vào phiếu', error: err.message });
  }
});

// PATCH finalize bill
router.patch('/:id/finalize', async (req, res) => {
  try {
    const { serviceFee } = req.body;
    const repair = await Repair.findById(req.params.id);
    if (!repair) return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });

    const fee = Number(serviceFee !== undefined ? serviceFee : repair.serviceFee);
    const partsCost = repair.partsUsed.reduce((sum, p) => sum + p.price * p.qty, 0);

    repair.serviceFee = fee;
    repair.totalPrice = partsCost + fee;
    repair.history.push({
      status: repair.status,
      timestamp: new Date(),
      note: `Chốt hóa đơn: Phí công ${fee.toLocaleString()}đ. Tổng: ${repair.totalPrice.toLocaleString()}đ.`
    });

    await repair.save();
    res.json(repair);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi chốt hóa đơn', error: err.message });
  }
});

export default router;
