import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/db.json');

// Helper to read DB
const readDB = () => {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return { users: [], inventory: [], repairs: [] };
  }
};

// Helper to write DB
const writeDB = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error("Error writing database:", error);
    return false;
  }
};

export const dbService = {
  getCollection: (collectionName) => {
    const db = readDB();
    return db[collectionName] || [];
  },

  getById: (collectionName, id) => {
    const collection = dbService.getCollection(collectionName);
    return collection.find(item => item.id === id);
  },

  insert: (collectionName, item) => {
    const db = readDB();
    if (!db[collectionName]) db[collectionName] = [];
    
    // Auto-generate ID if not present
    if (!item.id) {
      const prefix = collectionName === 'repairs' ? 'REP-' : 'ITEM-';
      const maxNum = db[collectionName].reduce((max, current) => {
        const idStr = current.id || '';
        const match = idStr.match(/\d+/);
        if (match) {
          const num = parseInt(match[0]);
          return num > max ? num : max;
        }
        return max;
      }, 1000);
      item.id = `${prefix}${maxNum + 1}`;
    }

    db[collectionName].push(item);
    writeDB(db);
    return item;
  },

  update: (collectionName, id, updates) => {
    const db = readDB();
    if (!db[collectionName]) return null;

    const index = db[collectionName].findIndex(item => item.id === id);
    if (index === -1) return null;

    db[collectionName][index] = {
      ...db[collectionName][index],
      ...updates
    };

    writeDB(db);
    return db[collectionName][index];
  },

  delete: (collectionName, id) => {
    const db = readDB();
    if (!db[collectionName]) return false;

    const initialLength = db[collectionName].length;
    db[collectionName] = db[collectionName].filter(item => item.id !== id);
    
    if (db[collectionName].length === initialLength) return false;

    writeDB(db);
    return true;
  }
};
