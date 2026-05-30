import Product from '../models/Product.js';
import Category from '../models/Category.js';

export const pcBuilderService = {

  checkCompatibility: async (parts) => {
    const issues = [];
    const details = {
      socket:  { status: 'idle', message: '' },
      ramType: { status: 'idle', message: '' },
      power:   { status: 'idle', message: '' },
      case:    { status: 'idle', message: '' },
      vgaLength: { status: 'idle', message: '' }
    };

    const get = async (id) => id ? Product.findById(id).lean() : null;

    const [cpu, mainboard, ram, vga, psu, casePart] = await Promise.all([
      get(parts.cpu), get(parts.mainboard), get(parts.ram), get(parts.vga), get(parts.psu), get(parts.case)
    ]);

    // 1. Socket: CPU vs Mainboard
    if (cpu && mainboard) {
      const cs = cpu.attributes?.socket, ms = mainboard.attributes?.socket;
      if (cs && ms) {
        if (cs.replace(/\s/g, '').toUpperCase() === ms.replace(/\s/g, '').toUpperCase()) {
          details.socket = { status: 'ok', message: `Tương thích Socket (${cs})` };
        } else {
          details.socket = { status: 'error', message: `Xung đột Socket: CPU dùng ${cs} nhưng Mainboard dùng ${ms}!` };
          issues.push(details.socket.message);
        }
      }
    }

    // 2. RAM type: Mainboard vs RAM
    if (mainboard && ram) {
      const mr = mainboard.attributes?.ramType, rr = ram.attributes?.ramType;
      if (mr && rr) {
        if (mr.toUpperCase() === rr.toUpperCase()) {
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
      if (cpu) required += cpu.attributes?.power || 65;
      if (vga) required += vga.attributes?.power || 75;
      const pw = psu.attributes?.wattage || 0;
      if (pw >= required) {
        details.power = { status: 'ok', message: `Nguồn đủ: Cần ~${required}W, PSU có ${pw}W` };
      } else {
        details.power = { status: 'error', message: `Nguồn yếu: Cần tối thiểu ${required}W, PSU chỉ có ${pw}W!` };
        issues.push(details.power.message);
      }
    }

    // 4. Case Size: Case vs Mainboard
    if (casePart && mainboard) {
      const bSize = mainboard.attributes?.size || 'ATX'; // Mặc định ATX nếu thiếu
      const cSize = casePart.attributes?.size || 'ATX';
      // Logic: Vỏ Micro-ATX không lắp được Mainboard ATX
      if (cSize === 'Micro-ATX' && bSize === 'ATX') {
        details.case = { status: 'error', message: `Xung đột kích thước: Vỏ Micro-ATX không lắp vừa Mainboard ATX!` };
        issues.push(details.case.message);
      } else {
        details.case = { status: 'ok', message: `Kích thước Vỏ máy & Mainboard phù hợp` };
      }
    }

    // 5. VGA Length: VGA vs Case
    if (vga && casePart) {
      const vLen = vga.attributes?.length;
      const cMax = casePart.attributes?.vgaMaxLen;
      if (vLen && cMax) {
        if (vLen <= cMax) {
          details.vgaLength = { status: 'ok', message: `Chiều dài VGA (${vLen}mm) phù hợp với Vỏ máy` };
        } else {
          details.vgaLength = { status: 'error', message: `VGA quá dài: VGA ${vLen}mm nhưng Vỏ máy chỉ hỗ trợ tối đa ${cMax}mm!` };
          issues.push(details.vgaLength.message);
        }
      }
    }

    return { compatible: issues.length === 0, issues, details };
  },

  suggestBuild: async (budget, need, count = 3) => {
    const byCategory = async (catName) => {
      const category = await Category.findOne({ name: { $regex: new RegExp(`^${catName}$`, 'i') } });
      if (!category) return [];
      return Product.find({ category: category._id, status: 'active', stockQuantity: { $gt: 0 } }).sort({ price: -1 }).lean();
    };

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
      ramList = ramList.filter(r => r.attributes?.capacity === 8 || r.attributes?.capacity === 16);
      psuList = psuList.filter(p => p.attributes?.wattage <= 550);
    } else if (need === 'gaming') {
      vgaList = vgaList.filter(v => v && v.price > 4000000);
      ramList = ramList.filter(r => r.attributes?.capacity === 16 || r.attributes?.capacity === 32);
    } else if (need === 'design') {
      cpuList = cpuList.filter(c => c.price > 3000000);
      ramList = ramList.filter(r => r.attributes?.capacity === 16 || r.attributes?.capacity === 32);
      vgaList = vgaList.filter(v => v && v.price > 5000000);
    }

    const results = [];
    for (const c of cpuList) {
      if (c.price >= budget) continue;
      const compatibleMbs = mbList.filter(m => m.attributes?.socket === c.attributes?.socket);
      for (const m of compatibleMbs) {
        if (c.price + m.price >= budget) continue;
        const compatibleRams = ramList.filter(r => r.attributes?.ramType === m.attributes?.ramType);
        for (const r of compatibleRams) {
          if (c.price + m.price + r.price >= budget) continue;
          for (const v of vgaList) {
            const currentTotal = c.price + m.price + r.price + (v ? v.price : 0);
            if (currentTotal >= budget) continue;
            const powerRequired = 100 + (c.attributes?.power || 65) + (v ? (v.attributes?.power || 75) : 0);
            const compatiblePsus = psuList.filter(p => (p.attributes?.wattage || 0) >= powerRequired);

            for (const p of compatiblePsus) {
              for (const s of ssdList) {
                for (const cs of caseList) {
                  const total = c.price + m.price + r.price + (v ? v.price : 0) + p.price + s.price + cs.price;
                  if (total <= budget) {
                    results.push({ components: { cpu: c, mainboard: m, ram: r, vga: v, psu: p, ssd: s, case: cs }, totalPrice: total, budget });
                  }
                  // Giới hạn tìm kiếm để tránh tràn bộ nhớ trên Vercel
                  if (results.length > 500) break;
                }
              }
            }
          }
        }
      }
    }
    // Sort results by totalPrice desc (prefer higher utilization of budget) then return top `count`
    results.sort((a, b) => b.totalPrice - a.totalPrice);
    return results.slice(0, count);
  }
};
