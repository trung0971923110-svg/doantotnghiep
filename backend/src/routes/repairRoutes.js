import express from 'express';
import { dbService } from '../services/dbService.js';

const router = express.Router();

// Get all repairs
router.get('/', (req, res) => {
  const repairs = dbService.getCollection('repairs');
  res.json(repairs);
});

// Get repair by ID
router.get('/:id', (req, res) => {
  const repair = dbService.getById('repairs', req.params.id);
  if (!repair) {
    return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
  }
  res.json(repair);
});

// Get repairs by customer phone (for tracking)
router.get('/customer/:phone', (req, res) => {
  const { phone } = req.params;
  const repairs = dbService.getCollection('repairs');
  const filtered = repairs.filter(r => r.customerPhone === phone);
  res.json(filtered);
});

// Book a repair (Customer)
router.post('/book', (req, res) => {
  const { customerName, customerPhone, deviceType, deviceName, issueDescription } = req.body;
  if (!customerName || !customerPhone || !deviceType || !issueDescription) {
    return res.status(400).json({ message: 'Thiếu thông tin đặt lịch hẹn' });
  }

  const newRepair = {
    customerName,
    customerPhone,
    deviceType,
    deviceName: deviceName || 'Thiết bị không rõ model',
    issueDescription,
    status: 'received',
    assignedTechId: null,
    history: [
      {
        status: 'received',
        timestamp: new Date().toISOString(),
        note: 'Hệ thống tiếp nhận yêu cầu đặt lịch hẹn sửa chữa trực tuyến của khách hàng.'
      }
    ],
    partsUsed: [],
    serviceFee: 150000, // Standard fee
    totalPrice: 150000,
    createdAt: new Date().toISOString()
  };

  const inserted = dbService.insert('repairs', newRepair);
  res.status(201).json(inserted);
});

// Assign technician
router.patch('/:id/assign', (req, res) => {
  const { id } = req.params;
  const { techId } = req.body;

  const repair = dbService.getById('repairs', id);
  if (!repair) {
    return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
  }

  const users = dbService.getCollection('users');
  const tech = users.find(u => u.id === techId && u.role === 'technician');
  const techName = tech ? tech.name : 'Kỹ thuật viên';

  const currentHistory = repair.history || [];
  const updatedHistory = [
    ...currentHistory,
    {
      status: repair.status,
      timestamp: new Date().toISOString(),
      note: `Đã phân phối công việc cho Kỹ thuật viên: ${techName}.`
    }
  ];

  const updated = dbService.update('repairs', id, {
    assignedTechId: techId,
    history: updatedHistory
  });

  res.json(updated);
});

// Update repair status
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const repair = dbService.getById('repairs', id);
  if (!repair) {
    return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
  }

  const validStatuses = ['received', 'inspecting', 'fixing', 'completed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Trạng thái sửa chữa không hợp lệ' });
  }

  const currentHistory = repair.history || [];
  const updatedHistory = [
    ...currentHistory,
    {
      status,
      timestamp: new Date().toISOString(),
      note: note || `Cập nhật trạng thái phiếu sửa chữa sang: ${status.toUpperCase()}.`
    }
  ];

  const updated = dbService.update('repairs', id, {
    status,
    history: updatedHistory
  });

  res.json(updated);
});

// Add replacement part
router.post('/:id/parts', (req, res) => {
  const { id } = req.params;
  const { partId, qty } = req.body;

  const repair = dbService.getById('repairs', id);
  if (!repair) {
    return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
  }

  const inventoryItem = dbService.getById('inventory', partId);
  if (!inventoryItem) {
    return res.status(404).json({ message: 'Không tìm thấy linh kiện trong kho' });
  }

  const quantity = Number(qty || 1);
  if (inventoryItem.stock < quantity) {
    return res.status(400).json({ message: `Lượng tồn kho không đủ (Hiện tại: ${inventoryItem.stock})` });
  }

  // Deduct from inventory
  dbService.update('inventory', partId, { stock: inventoryItem.stock - quantity });

  // Add to partsUsed
  const partsUsed = repair.partsUsed || [];
  const existingPartIndex = partsUsed.findIndex(p => p.id === partId);

  if (existingPartIndex > -1) {
    partsUsed[existingPartIndex].qty += quantity;
    partsUsed[existingPartIndex].total = partsUsed[existingPartIndex].qty * partsUsed[existingPartIndex].price;
  } else {
    partsUsed.push({
      id: partId,
      name: inventoryItem.name,
      qty: quantity,
      price: inventoryItem.price,
      total: quantity * inventoryItem.price
    });
  }

  // Calculate new total
  const partsCost = partsUsed.reduce((sum, p) => sum + (p.price * p.qty), 0);
  const serviceFee = repair.serviceFee || 150000;
  const totalPrice = partsCost + serviceFee;

  const updatedHistory = [
    ...(repair.history || []),
    {
      status: repair.status,
      timestamp: new Date().toISOString(),
      note: `KTV đã bổ sung linh kiện thay thế: ${inventoryItem.name} (Số lượng: ${quantity}).`
    }
  ];

  const updated = dbService.update('repairs', id, {
    partsUsed,
    totalPrice,
    history: updatedHistory
  });

  res.json(updated);
});

// Update service fee & generate final bill
router.patch('/:id/finalize', (req, res) => {
  const { id } = req.params;
  const { serviceFee } = req.body;

  const repair = dbService.getById('repairs', id);
  if (!repair) {
    return res.status(404).json({ message: 'Không tìm thấy phiếu sửa chữa' });
  }

  const fee = Number(serviceFee !== undefined ? serviceFee : repair.serviceFee);
  const partsCost = (repair.partsUsed || []).reduce((sum, p) => sum + (p.price * p.qty), 0);
  const totalPrice = partsCost + fee;

  const updatedHistory = [
    ...(repair.history || []),
    {
      status: repair.status,
      timestamp: new Date().toISOString(),
      note: `Chi phí dịch vụ được điều chỉnh thành ${fee.toLocaleString()}đ. Xuất hóa đơn tổng trị giá ${totalPrice.toLocaleString()}đ.`
    }
  ];

  const updated = dbService.update('repairs', id, {
    serviceFee: fee,
    totalPrice,
    history: updatedHistory
  });

  res.json(updated);
});

export default router;
