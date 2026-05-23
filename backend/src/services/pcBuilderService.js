import Inventory from '../models/Inventory.js';

export const pcBuilderService = {

  checkCompatibility: async (parts) => {
    const issues = [];
    const details = {
      socket:  { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra socket' },
      ramType: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra thế hệ RAM' },
      power:   { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra công suất nguồn' }
    };

    const get = async (id) => id ? Inventory.findById(id).lean() : null;

    const [cpu, mainboard, ram, vga, psu] = await Promise.all([
      get(parts.cpu), get(parts.mainboard), get(parts.ram), get(parts.vga), get(parts.psu)
    ]);

    // 1. Socket: CPU vs Mainboard
    if (cpu && mainboard) {
      const cs = cpu.specs?.socket, ms = mainboard.specs?.socket;
      if (cs && ms) {
        if (cs === ms) {
          details.socket = { status: 'ok', message: `Tương thích Socket (${cs})` };
        } else {
          details.socket = { status: 'error', message: `Xung đột Socket: CPU dùng ${cs} nhưng Mainboard dùng ${ms}!` };
          issues.push(details.socket.message);
        }
      }
    }

    // 2. RAM type: Mainboard vs RAM
    if (mainboard && ram) {
      const mr = mainboard.specs?.ramType, rr = ram.specs?.ramType;
      if (mr && rr) {
        if (mr === rr) {
          details.ramType = { status: 'ok', message: `Tương thích thế hệ RAM (${mr})` };
        } else {
          details.ramType = { status: 'error', message: `Xung đột RAM: Mainboard hỗ trợ ${mr} nhưng thanh RAM là ${rr}!` };
          issues.push(details.ramType.message);
        }
      }
    }

    // 3. Power budget
    if (psu) {
      let required = 100;
      if (cpu) required += cpu.specs?.power || 65;
      if (vga) required += vga.specs?.power || 75;
      const pw = psu.specs?.wattage || 0;
      if (pw >= required) {
        details.power = { status: 'ok', message: `Nguồn đủ: Cần ~${required}W, PSU có ${pw}W` };
      } else {
        details.power = { status: 'error', message: `Nguồn yếu: Cần tối thiểu ${required}W, PSU chỉ có ${pw}W!` };
        issues.push(details.power.message);
      }
    }

    return { compatible: issues.length === 0, issues, details };
  },

  suggestBuild: async (budget, need) => {
    const byCategory = async (cat) =>
      Inventory.find({ category: cat, stock: { $gt: 0 } }).sort({ price: -1 }).lean();

    const [cpus, mbs, rams, vgas, psus, ssds, cases] = await Promise.all([
      byCategory('cpu'), byCategory('mainboard'), byCategory('ram'),
      byCategory('vga'), byCategory('psu'), byCategory('ssd'), byCategory('case')
    ]);

    // Filter by need
    let cpuList  = cpus;
    let mbList   = mbs;
    let ramList  = rams;
    let vgaList  = need === 'office' ? [null] : vgas;
    let psuList  = psus;
    let ssdList  = ssds;
    let caseList = cases;

    if (need === 'office') {
      cpuList = cpuList.filter(c => c.price < 4000000);
      ramList = ramList.filter(r => r.specs?.capacity === '8GB' || r.specs?.capacity === '16GB');
      psuList = psuList.filter(p => p.specs?.wattage <= 550);
    } else if (need === 'gaming') {
      vgaList = vgaList.filter(v => v && v.price > 4000000);
      ramList = ramList.filter(r => r.specs?.capacity === '16GB' || r.specs?.capacity === '32GB');
    } else if (need === 'design') {
      cpuList = cpuList.filter(c => c.price > 3000000);
      ramList = ramList.filter(r => r.specs?.capacity === '16GB' || r.specs?.capacity === '32GB');
      vgaList = vgaList.filter(v => v && v.price > 5000000);
    }

    let best = null, maxPrice = 0;

    for (const c of cpuList) {
      for (const m of mbList) {
        if (c.specs?.socket !== m.specs?.socket) continue;
        for (const r of ramList) {
          if (m.specs?.ramType !== r.specs?.ramType) continue;
          for (const v of vgaList) {
            for (const p of psuList) {
              let req = 100 + (c.specs?.power || 65);
              if (v) req += v.specs?.power || 75;
              if ((p.specs?.wattage || 0) < req) continue;
              for (const s of ssdList) {
                for (const cs of caseList) {
                  const total = c.price + m.price + r.price + (v ? v.price : 0) + p.price + s.price + cs.price;
                  if (total <= budget && total > maxPrice) {
                    maxPrice = total;
                    best = { components: { cpu: c, mainboard: m, ram: r, vga: v, psu: p, ssd: s, case: cs }, totalPrice: total, budget };
                  }
                }
              }
            }
          }
        }
      }
    }
    return best;
  }
};
