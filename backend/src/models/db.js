/**
 * LegalCheck AI - Database Layer
 * Stores scans, violations, reports, and officer user data.
 */

const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../database_store.json');

const INITIAL_SEED_SCANS = [
  {
    id: 'LM-2026-00124',
    product_name: 'Britannica Crunchy Cream Biscuits',
    image_url: '/sample-images/01_compliant_biscuits.jpg',
    score: 100,
    status: 'COMPLIANT',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    extracted_data: {
      product_name: 'Britannica Crunchy Cream Biscuits',
      manufacturer: 'Britannica Foods Pvt Ltd, Industrial Area, Hyderabad',
      net_quantity: '100 g',
      mrp: 'MRP ₹50.00 (incl. of all taxes)',
      manufacturing_date: 'MFD 06/2026',
      consumer_care: '1800-425-1111 / care@britannica.com',
      country_of_origin: 'India',
      unit_sale_price: '₹0.50/g'
    },
    violations: []
  },
  {
    id: 'LM-2026-00123',
    product_name: 'Global Choice Imported Chocolates',
    image_url: '/sample-images/02_missing_country_origin.jpg',
    score: 82,
    status: 'NON-COMPLIANT',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    extracted_data: {
      product_name: 'Global Choice Imported Chocolates',
      manufacturer: 'Global Confectionery Ltd, London, UK',
      net_quantity: '200 g',
      mrp: 'MRP ₹250.00 incl. of all taxes',
      manufacturing_date: 'MFD 04/2026',
      consumer_care: 'care@globalchoice.com',
      country_of_origin: null,
      unit_sale_price: '₹1.25/g'
    },
    violations: [
      {
        id: 'VIO-001',
        rule_id: 'LM-007',
        field: 'country_of_origin',
        severity: 'HIGH',
        reason: 'Country of origin declaration missing for imported product (Rule 6).'
      },
      {
        id: 'VIO-002',
        rule_id: 'LM-013',
        field: 'ecommerce_origin_filter',
        severity: 'LOW',
        reason: 'Feb 2026 Amendment: Mandatory country-of-origin filter tag missing.'
      }
    ]
  },
  {
    id: 'LM-2026-00122',
    product_name: 'Sunrise Premium Whole Wheat Atta',
    image_url: '/sample-images/03_missing_unit_sale_price.jpg',
    score: 85,
    status: 'NON-COMPLIANT',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    extracted_data: {
      product_name: 'Sunrise Premium Whole Wheat Atta',
      manufacturer: 'Sunrise Agro Foods Pvt Ltd, Guntur',
      net_quantity: '5 kg',
      mrp: 'MRP ₹280.00 incl. of all taxes',
      manufacturing_date: 'PKD 05/2026',
      consumer_care: '1800-112-9900',
      country_of_origin: 'India',
      unit_sale_price: null
    },
    violations: [
      {
        id: 'VIO-003',
        rule_id: 'LM-009',
        field: 'unit_sale_price',
        severity: 'MEDIUM',
        reason: 'Unit Sale Price declaration missing under Rule 6(1)(11).'
      }
    ]
  },
  {
    id: 'LM-2026-00121',
    product_name: 'Sparkle Ultra Detergent Powder',
    image_url: '/sample-images/04_missing_mrp_format.jpg',
    score: 72,
    status: 'NON-COMPLIANT',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    extracted_data: {
      product_name: 'Sparkle Ultra Detergent Powder',
      manufacturer: 'Sparkle Home Care Ltd, Mumbai',
      net_quantity: '1 kg',
      mrp: 'Price ₹120',
      manufacturing_date: 'MFD 03/2026',
      consumer_care: null,
      country_of_origin: 'Made in India',
      unit_sale_price: '₹120/kg'
    },
    violations: [
      {
        id: 'VIO-004',
        rule_id: 'LM-011',
        field: 'mrp_format',
        severity: 'MEDIUM',
        reason: 'MRP does not specify "incl. of all taxes".'
      },
      {
        id: 'VIO-005',
        rule_id: 'LM-006',
        field: 'consumer_care',
        severity: 'HIGH',
        reason: 'Consumer care contact details missing.'
      }
    ]
  },
  {
    id: 'LM-2026-00120',
    product_name: 'NutriCrunch Almond Cookies',
    image_url: '/sample-images/05_font_readability_warning.jpg',
    score: 88,
    status: 'WARNING',
    created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
    extracted_data: {
      product_name: 'NutriCrunch Almond Cookies',
      manufacturer: 'NutriCrunch Bakers, Bangalore',
      net_quantity: '75g',
      mrp: 'MRP ₹40.00 incl. of all taxes',
      manufacturing_date: 'MFD 01/2026',
      consumer_care: '1800-445-8888',
      country_of_origin: 'India',
      unit_sale_price: '₹0.53/g'
    },
    violations: [
      {
        id: 'VIO-006',
        rule_id: 'LM-012',
        field: 'font_readability',
        severity: 'MEDIUM',
        reason: 'Potential font size / contrast readability issue under Rule 7/9.'
      }
    ]
  }
];

class Database {
  constructor() {
    this.data = {
      users: [
        {
          id: 'USR-001',
          name: 'Inspector Vijay Kumar',
          email: 'officer@dca.gov.in',
          password: 'admin',
          role: 'Enforcement Officer',
          badgeNumber: 'LM-INSP-2026-884'
        }
      ],
      scans: [...INITIAL_SEED_SCANS],
      totalInspectionsCount: 127,
      historicalCompliant: 78,
      historicalNonCompliant: 49
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Error loading DB file:', e);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Error saving DB file:', e);
    }
  }

  getAllScans() {
    return this.data.scans;
  }

  getScanById(id) {
    return this.data.scans.find(s => s.id === id) || null;
  }

  addScan(scanRecord) {
    this.data.scans.unshift(scanRecord);
    this.data.totalInspectionsCount++;
    if (scanRecord.status === 'COMPLIANT') {
      this.data.historicalCompliant++;
    } else {
      this.data.historicalNonCompliant++;
    }
    this.save();
    return scanRecord;
  }

  getStats() {
    const scans = this.data.scans;
    const totalScans = this.data.totalInspectionsCount;
    const compliantCount = this.data.historicalCompliant;
    const nonCompliantCount = this.data.historicalNonCompliant;

    const scoresSum = scans.reduce((acc, s) => acc + (s.score || 0), 0);
    const avgScore = scans.length > 0 ? Math.round(scoresSum / scans.length) : 81;

    // Calculate top violations count
    const violationCounts = {};
    scans.forEach(s => {
      (s.violations || []).forEach(v => {
        const key = v.field || v.rule_id;
        violationCounts[key] = (violationCounts[key] || 0) + 1;
      });
    });

    const topViolations = [
      { name: 'Missing Consumer Care Details', count: violationCounts['consumer_care'] || 28, rule: 'LM-006' },
      { name: 'Missing Unit Sale Price', count: violationCounts['unit_sale_price'] || 22, rule: 'LM-009' },
      { name: 'Missing Country of Origin', count: violationCounts['country_of_origin'] || 19, rule: 'LM-007' },
      { name: 'Non-Standard MRP Format', count: violationCounts['mrp_format'] || 14, rule: 'LM-011' },
      { name: 'Font Height / Readability Issue', count: violationCounts['font_readability'] || 9, rule: 'LM-012' }
    ];

    return {
      totalScans,
      compliantCount,
      nonCompliantCount,
      avgScore,
      topViolations,
      recentScans: scans.slice(0, 10)
    };
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email === email) || null;
  }
}

const db = new Database();

module.exports = db;
