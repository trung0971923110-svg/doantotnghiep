import Inventory from '../models/Inventory.js';

export const cameraService = {
  calculateSetup: async (config) => {
    const { numRooms, numFloors, areaSqM, recordingDays, quality, type } = config;
    const inventory = await Inventory.find().lean();

    // Step 1: Suggest number of cameras
    // Recommendation: 1 camera per room + 1 camera for outdoor/gate
    const indoorQty = parseInt(numRooms) || 2;
    const outdoorQty = parseInt(numFloors) || 1;
    const totalCams = indoorQty + outdoorQty;

    // Step 2: Suggest Camera items from inventory
    const cameraItems = inventory.filter(item => item.category === 'camera' && item.specs?.type === type);
    
    // Choose appropriate cameras
    const indoorCam = cameraItems.find(item => item.specs?.environment === 'indoor' && item.specs?.resolution === quality) || cameraItems.find(item => item.specs?.environment === 'indoor') || cameraItems[0];
    const outdoorCam = cameraItems.find(item => item.specs?.environment === 'outdoor' && item.specs?.resolution === quality) || cameraItems.find(item => item.specs?.environment === 'outdoor') || cameraItems[0];

    // Step 3: Suggest DVR/NVR
    const dvrItems = inventory.filter(item => item.category === 'dvr' && item.specs?.type === type);
    // Find dvr with channels >= totalCams
    dvrItems.sort((a, b) => (a.specs?.channels || 4) - (b.specs?.channels || 4));
    const selectedDvr = dvrItems.find(d => (d.specs?.channels || 4) >= totalCams) || dvrItems[dvrItems.length - 1];

    // Step 4: Storage Calculation (in GB)
    let gbPerDayPerCam = 20; // 1080p default
    if (quality === '2K') gbPerDayPerCam = 40;
    if (quality === '4K') gbPerDayPerCam = 80;

    const totalGbRequired = totalCams * recordingDays * gbPerDayPerCam;
    const tbRequired = totalGbRequired / 1000;

    // Suggest HDD
    const hddItems = inventory.filter(item => item.category === 'hdd');
    // Parse HDD capacity to numbers (e.g. "1TB" -> 1000, "2TB" -> 2000, "4TB" -> 4000)
    const getHddCapacity = (name) => {
      if (name.includes('1TB')) return 1000;
      if (name.includes('2TB')) return 2000;
      if (name.includes('4TB')) return 4000;
      return 1000;
    };

    hddItems.sort((a, b) => getHddCapacity(a.name) - getHddCapacity(b.name));
    const selectedHdd = hddItems.find(h => getHddCapacity(h.name) >= totalGbRequired) || hddItems[hddItems.length - 1];

    // Step 5: Cables & Accessories
    const cableItems = inventory.filter(item => item.category === 'cable');
    // If IP, use CAT6, if Analog, use Coaxial
    const selectedCable = type === 'IP' 
      ? (cableItems.find(c => c.name.includes('CAT6') || c.name.includes('Cáp mạng')) || cableItems[0])
      : (cableItems.find(c => c.name.includes('đồng trục') || c.name.includes('RG59')) || cableItems[0]);

    // Assume 20m cable per camera
    const estCableLength = totalCams * 20;
    const cableRolls = Math.ceil(estCableLength / 100);

    // Baluns / RJ45 / BNC connectors
    const connectorItem = type === 'IP'
      ? inventory.find(i => i.name.includes('RJ45') || i.name.includes('Hạt mạng')) // RJ45
      : inventory.find(i => i.name.includes('BNC') || i.name.includes('Jack BNC')); // BNC

    const connectorsQty = totalCams * 2; // 2 connectors per camera

    // Step 6: Pricing
    const listItems = [];
    let subtotal = 0;

    // Add Indoor Cams
    if (indoorCam) {
      const price = indoorCam.price;
      const total = price * indoorQty;
      listItems.push({ item: indoorCam, qty: indoorQty, total });
      subtotal += total;
    }

    // Add Outdoor Cams
    if (outdoorCam) {
      const price = outdoorCam.price;
      const total = price * outdoorQty;
      listItems.push({ item: outdoorCam, qty: outdoorQty, total });
      subtotal += total;
    }

    // Add DVR
    if (selectedDvr) {
      listItems.push({ item: selectedDvr, qty: 1, total: selectedDvr.price });
      subtotal += selectedDvr.price;
    }

    // Add HDD
    if (selectedHdd) {
      listItems.push({ item: selectedHdd, qty: 1, total: selectedHdd.price });
      subtotal += selectedHdd.price;
    }

    // Add Cable
    if (selectedCable) {
      const total = selectedCable.price * cableRolls;
      listItems.push({ item: selectedCable, qty: cableRolls, total });
      subtotal += total;
    }

    // Add Connectors
    if (connectorItem) {
      const isRJ45 = connectorItem.name.includes('RJ45') || connectorItem.name.includes('Hạt mạng');
      const qty = Math.ceil(connectorsQty / (isRJ45 ? 100 : 10)); // assume boxes or packs
      const total = connectorItem.price * qty;
      listItems.push({ item: connectorItem, qty, total });
      subtotal += total;
    }

    // Labor fee: 200,000 VND per camera
    const installationFee = totalCams * 200000;
    const grandTotal = subtotal + installationFee;

    return {
      indoorQty,
      outdoorQty,
      totalCams,
      gbRequired: totalGbRequired,
      tbRequired,
      suggestedItems: listItems,
      installationFee,
      grandTotal,
      layoutGrid: {
        numRooms,
        numFloors,
        cameras: [
          ...Array(indoorQty).fill(null).map((_, i) => ({ type: 'Indoor', room: `Phòng ${i + 1}`, status: 'active' })),
          ...Array(outdoorQty).fill(null).map((_, i) => ({ type: 'Outdoor', room: `Cổng/Sân ${i + 1}`, status: 'active' }))
        ]
      }
    };
  }
};
