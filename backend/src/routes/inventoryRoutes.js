import express from 'express';
import { dbService } from '../services/dbService.js';

const router = express.Router();

// Get all inventory
router.get('/', (req, res) => {
  const inventory = dbService.getCollection('inventory');
  res.json(inventory);
});

// Get low stock inventory items
router.get('/low-stock', (req, res) => {
  const inventory = dbService.getCollection('inventory');
  const lowStock = inventory.filter(item => item.stock <= item.minStock);
  res.json(lowStock);
});

// Update stock
router.patch('/:id/stock', (req, res) => {
  const { id } = req.params;
  const { quantity, mode } = req.body; // mode can be 'add', 'subtract', or 'set'

  const item = dbService.getById('inventory', id);
  if (!item) {
    return res.status(404).json({ message: 'Không tìm thấy linh kiện' });
  }

  let newStock = item.stock;
  if (mode === 'add') {
    newStock += Number(quantity);
  } else if (mode === 'subtract') {
    newStock = Math.max(0, newStock - Number(quantity));
  } else {
    newStock = Number(quantity);
  }

  const updated = dbService.update('inventory', id, { stock: newStock });
  res.json(updated);
});

// Add new inventory item
router.post('/', (req, res) => {
  const { name, category, price, stock, minStock, specs } = req.body;
  if (!name || !category || price === undefined || stock === undefined) {
    return res.status(400).json({ message: 'Thiếu thông tin linh kiện bắt buộc' });
  }

  const newItem = {
    name,
    category,
    price: Number(price),
    stock: Number(stock),
    minStock: Number(minStock || 0),
    specs: specs || {}
  };

  const inserted = dbService.insert('inventory', newItem);
  res.status(201).json(inserted);
});

export default router;
