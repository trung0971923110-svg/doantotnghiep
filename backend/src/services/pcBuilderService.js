import { dbService } from './dbService.js';

export const pcBuilderService = {
  // Check compatibility of a given set of component IDs
  checkCompatibility: (parts) => {
    const inventory = dbService.getCollection('inventory');
    const getPart = (id) => parts[id] ? inventory.find(p => p.id === parts[id]) : null;

    const cpu = getPart('cpu');
    const mainboard = getPart('mainboard');
    const ram = getPart('ram');
    const vga = getPart('vga');
    const psu = getPart('psu');

    const issues = [];
    const details = {
      socket: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra socket' },
      ramType: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra thế hệ RAM' },
      power: { status: 'idle', message: 'Chưa đủ linh kiện để kiểm tra công suất nguồn' }
    };

    // 1. Socket Check: CPU vs Mainboard
    if (cpu && mainboard) {
      const cpuSocket = cpu.specs?.socket;
      const mbSocket = mainboard.specs?.socket;
      if (cpuSocket && mbSocket) {
        if (cpuSocket === mbSocket) {
          details.socket = { status: 'ok', message: `Tương thích Socket (${cpuSocket})` };
        } else {
          details.socket = { status: 'error', message: `Xung đột Socket: CPU dùng ${cpuSocket} nhưng Mainboard dùng ${mbSocket}!` };
          issues.push(details.socket.message);
        }
      }
    }

    // 2. RAM Type Check: Mainboard vs RAM
    if (mainboard && ram) {
      const mbRamType = mainboard.specs?.ramType;
      const ramType = ram.specs?.ramType;
      if (mbRamType && ramType) {
        if (mbRamType === ramType) {
          details.ramType = { status: 'ok', message: `Tương thích thế hệ RAM (${ramType})` };
        } else {
          details.ramType = { status: 'error', message: `Xung đột RAM: Mainboard hỗ trợ ${mbRamType} nhưng thanh RAM là ${ramType}!` };
          issues.push(details.ramType.message);
        }
      }
    }

    // 3. Power Consumption Check: PSU vs (CPU + VGA)
    if (psu) {
      let requiredPower = 100; // Base motherboard + fans + storage power buffer
      if (cpu) requiredPower += (cpu.specs?.power || 65);
      if (vga) requiredPower += (vga.specs?.power || 75);

      const psuWattage = psu.specs?.wattage || 0;
      if (psuWattage >= requiredPower) {
        details.power = { status: 'ok', message: `Nguồn đủ đáp ứng: Cần khoảng ${requiredPower}W, Nguồn có ${psuWattage}W` };
      } else {
        details.power = { status: 'error', message: `Nguồn quá yếu: Cần tối thiểu ${requiredPower}W, nhưng nguồn chỉ có ${psuWattage}W!` };
        issues.push(details.power.message);
      }
    }

    return {
      compatible: issues.length === 0,
      issues,
      details
    };
  },

  // Suggest a PC configuration based on budget and needs
  suggestBuild: (budget, need) => {
    const inventory = dbService.getCollection('inventory');
    
    // Group components by category
    const parts = {};
    const categories = ['cpu', 'mainboard', 'ram', 'vga', 'psu', 'ssd', 'case'];
    categories.forEach(cat => {
      parts[cat] = inventory.filter(item => item.category === cat && item.stock > 0);
    });

    let bestBuild = null;
    let maxPriceFound = 0;

    // We can write a rule-based algorithm to select the best setup
    // Step 1: Filter components according to the 'need'
    // - 'office': integrated GPU (no VGA), standard components, low budget.
    // - 'gaming': heavy on VGA, moderate CPU, 16GB RAM.
    // - 'design': heavy on CPU and RAM (16GB-32GB), good VGA.

    // Let's filter candidates based on need
    let cpuCandidates = parts.cpu;
    let mbCandidates = parts.mainboard;
    let ramCandidates = parts.ram;
    let vgaCandidates = parts.vga;
    let psuCandidates = parts.psu;
    let ssdCandidates = parts.ssd;
    let caseCandidates = parts.case;

    if (need === 'office') {
      // Office doesn't need VGA
      vgaCandidates = [null]; // No GPU
      cpuCandidates = cpuCandidates.filter(c => c.price < 4000000); // i3 / i5
      ramCandidates = ramCandidates.filter(r => r.specs?.capacity === '8GB' || r.specs?.capacity === '16GB');
      psuCandidates = psuCandidates.filter(p => p.specs?.wattage <= 550);
      ssdCandidates = ssdCandidates.filter(s => s.price < 1500000);
    } else if (need === 'gaming') {
      vgaCandidates = vgaCandidates.filter(v => v.price > 4000000); // Gaming needs strong GPU
      ramCandidates = ramCandidates.filter(r => r.specs?.capacity === '16GB' || r.specs?.capacity === '32GB');
    } else if (need === 'design') {
      cpuCandidates = cpuCandidates.filter(c => c.price > 3000000); // Heavy CPU
      ramCandidates = ramCandidates.filter(r => r.specs?.capacity === '16GB' || r.specs?.capacity === '32GB');
      vgaCandidates = vgaCandidates.filter(v => v.price > 5000000); // Good CUDA acceleration
    }

    // Run combinations to find the highest-performance compatible build that fits the budget
    // For efficiency, let's sort each list by price and find a solid pairing
    // Sort candidates descending by price to find the best possible
    cpuCandidates.sort((a, b) => b.price - a.price);
    mbCandidates.sort((a, b) => b.price - a.price);
    ramCandidates.sort((a, b) => b.price - a.price);
    if (need !== 'office') vgaCandidates.sort((a, b) => b.price - a.price);
    psuCandidates.sort((a, b) => b.price - a.price);
    ssdCandidates.sort((a, b) => b.price - a.price);
    caseCandidates.sort((a, b) => b.price - a.price);

    for (let c of cpuCandidates) {
      for (let m of mbCandidates) {
        // Compatibility check CPU & Mainboard
        if (c.specs.socket !== m.specs.socket) continue;

        for (let r of ramCandidates) {
          // Compatibility check RAM & Mainboard
          if (m.specs.ramType !== r.specs.ramType) continue;

          for (let v of vgaCandidates) {
            for (let p of psuCandidates) {
              // Compatibility check Power
              let reqPower = 100 + c.specs.power;
              if (v) reqPower += v.specs.power;
              if (p.specs.wattage < reqPower) continue;

              for (let s of ssdCandidates) {
                for (let cs of caseCandidates) {
                  const totalPrice = c.price + m.price + r.price + (v ? v.price : 0) + p.price + s.price + cs.price;
                  if (totalPrice <= budget && totalPrice > maxPriceFound) {
                    maxPriceFound = totalPrice;
                    bestBuild = {
                      components: {
                        cpu: c,
                        mainboard: m,
                        ram: r,
                        vga: v,
                        psu: p,
                        ssd: s,
                        case: cs
                      },
                      totalPrice,
                      budget
                    };
                  }
                }
              }
            }
          }
        }
      }
    }

    return bestBuild;
  }
};
