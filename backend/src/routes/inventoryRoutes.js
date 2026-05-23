import express from 'express';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// GET all inventory items
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await Inventory.find(filter).sort({ category: 1, name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải kho linh kiện', error: err.message });
  }
});

// GET low stock items
router.get('/low-stock', async (req, res) => {
  try {
    // Use aggregation to compare stock vs minStock dynamically
    const lowStock = await Inventory.aggregate([
      { $match: { $expr: { $lte: ['$stock', '$minStock'] } } },
      { $sort: { category: 1 } }
    ]);
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải danh sách cảnh báo kho', error: err.message });
  }
});

// GET single item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy linh kiện' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi tải linh kiện', error: err.message });
  }
});

// POST add new inventory item
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock, minStock, specs } = req.body;
    if (!name || !category || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Thiếu thông tin linh kiện bắt buộc' });
    }
    const newItem = new Inventory({ name, category, price, stock, minStock: minStock || 0, specs: specs || {} });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi thêm linh kiện', error: err.message });
  }
});

// PATCH update stock level
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, mode } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Không tìm thấy linh kiện' });

    if (mode === 'add')      item.stock = item.stock + Number(quantity);
    else if (mode === 'subtract') item.stock = Math.max(0, item.stock - Number(quantity));
    else                    item.stock = Number(quantity);

    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật tồn kho', error: err.message });
  }
});

// PATCH update full item info
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy linh kiện' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi cập nhật linh kiện', error: err.message });
  }
});

// DELETE item
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy linh kiện' });
    res.json({ message: 'Xóa linh kiện thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi xóa linh kiện', error: err.message });
  }
});

export default router;
