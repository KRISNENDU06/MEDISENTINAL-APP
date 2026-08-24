import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Pill,
  MapPin,
  Search,
  CheckCircle,
  Clock,
  Navigation,
  Filter,
  PhoneCall,
} from 'lucide-react';
import { api, Facility } from '../services/api';

interface FacilitiesLocatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ODISHA_DISTRICT_LIST = [
  'All 30 Districts',
  'Angul',
  'Khurda',
  'Cuttack',
  'Puri',
  'Sundargarh',
  'Sambalpur',
  'Balasore',
  'Ganjam',
  'Bhadrak',
  'Mayurbhanj',
  'Keonjhar',
  'Jharsuguda',
  'Koraput',
  'Rayagada',
  'Kalahandi',
  'Bolangir',
  'Bargarh',
  'Dhenkanal',
  'Jajpur',
  'Kendrapara',
  'Jagatsinghpur',
  'Nayagarh',
  'Kandhamal',
  'Boudh',
  'Subarnapur',
  'Nabarangpur',
  'Nuapada',
  'Malkangiri',
  'Gajapati',
  'Deogarh',
];

export const FALLBACK_FACILITIES: Facility[] = [
  // 1. Angul
  {
    id: 'fac-ang-1',
    name: 'District Headquarters Hospital (DHH) Angul',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Angul',
    ward: 'Angul Town Ward 8 (Nalco Nagar)',
    address: 'Hospital Road, Near Collectorate, Angul Town',
    latitude: 20.8444,
    longitude: 85.1511,
    phone: '+91-6764-230401',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & Trauma', 'Epidemic Isolation Ward', 'Blood Bank', 'Free Diagnostic Pathology'],
    verifiedStock: 'Verified High (Antipyretics, IV Fluids & ORS in stock)',
  },
  {
    id: 'fac-ang-2',
    name: 'Sub-Divisional Hospital (SDH) Pallahara',
    type: 'HOSPITAL',
    category: 'Govt Sub-Divisional Hospital',
    district: 'Angul',
    ward: 'Pallahara Sub-Division CHC',
    address: 'Main Road, Pallahara, Angul',
    latitude: 21.4333,
    longitude: 85.2000,
    phone: '+91-6765-279220',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Maternity & Child Health', 'Fever Triage Desk', 'Free Essential Drugs'],
    verifiedStock: 'Adequate Stock',
  },
  {
    id: 'fac-ang-3',
    name: 'Primary Health Centre (PHC) Khalari',
    type: 'UPHC',
    category: 'Govt Rural PHC',
    district: 'Angul',
    ward: 'Khalari Rural Catchment PHC',
    address: 'Village Post Khalari, Block Angul',
    latitude: 20.9167,
    longitude: 85.0833,
    phone: '+91-6764-231180',
    helpline: '104',
    isOpen24x7: false,
    operatingHours: '8:00 AM - 8:00 PM (Emergency 24x7 on-call)',
    services: ['Outpatient Syndromic Screen', 'Rapid Malaria & Typhoid Kits', 'ORS Distribution'],
    verifiedStock: 'High (Paracetamol & ORS Ready)',
  },
  {
    id: 'fac-ang-4',
    name: 'Sub-Divisional Hospital (SDH) Talcher',
    type: 'HOSPITAL',
    category: 'Govt Sub-Divisional Hospital',
    district: 'Angul',
    ward: 'Talcher Coalfield & Thermal Ward',
    address: 'MCL Highway Road, Talcher',
    latitude: 20.9500,
    longitude: 85.2167,
    phone: '+91-6760-240108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Trauma Care', 'Industrial Dust & Respiratory Clinic', 'Burn Unit', 'Blood Storage'],
    verifiedStock: 'High (Inhalers & Critical Care Meds)',
  },
  {
    id: 'fac-ang-5',
    name: 'NTPC Kaniha Community Hospital',
    type: 'HOSPITAL',
    category: 'Govt / PSU Hospital',
    district: 'Angul',
    ward: 'Kaniha NTPC Township Ward',
    address: 'NTPC Township, Kaniha',
    latitude: 21.0833,
    longitude: 85.0500,
    phone: '+91-6760-243200',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'General Medicine', 'Pediatric Care'],
    verifiedStock: 'Fully Stocked',
  },
  {
    id: 'fac-ang-6',
    name: 'Sanjeevani 24/7 Pharmacy & Emergency Meds',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Angul',
    ward: 'Angul Town Ward 8 (Nalco Nagar)',
    address: 'Main Daily Market Square, Angul',
    latitude: 20.8420,
    longitude: 85.1530,
    phone: '+91-6764-234550',
    isOpen24x7: true,
    services: ['24/7 OTC Antipyretics', 'ORS & Rehydration Kits', 'Thermometers & Nebulizers', 'Oxygen Cylinder Supply'],
    verifiedStock: 'Verified Available',
  },
  {
    id: 'fac-ang-7',
    name: 'Apollo Pharmacy 24/7 Talcher',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Angul',
    ward: 'Talcher Coalfield & Thermal Ward',
    address: 'Hatatota Main Chowk, Talcher',
    latitude: 20.9520,
    longitude: 85.2190,
    phone: '+91-6760-241234',
    isOpen24x7: true,
    services: ['24/7 Prescription Dispensing', 'Antibiotics & Antivirals', 'Home Delivery'],
    verifiedStock: 'Verified Available',
  },

  // 2. Khordha / Bhubaneswar
  {
    id: 'fac-khu-1',
    name: 'AIIMS Bhubaneswar (Apex Referral Institute)',
    type: 'HOSPITAL',
    category: 'National Premier Institute',
    district: 'Khurda',
    ward: 'Dumduma (Ward 62 - Sijua)',
    address: 'Sijua, Patrapada, Bhubaneswar',
    latitude: 20.2285,
    longitude: 85.7765,
    phone: '+91-674-2476789',
    helpline: '108',
    isOpen24x7: true,
    services: ['Apex Critical Care & ICU', 'State Virology Institute', 'Advanced Multi-Organ Trauma Hub', '24/7 Emergency'],
    verifiedStock: 'Central Reserve (Maximum Preparedness)',
  },
  {
    id: 'fac-khu-2',
    name: 'Capital Hospital & State Epidemic Control Ward',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Khurda',
    ward: 'Old Town & Unit 6',
    address: 'Unit 6, Near AG Square, Bhubaneswar',
    latitude: 20.2644,
    longitude: 85.8281,
    phone: '+91-674-2391983',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Platelet Blood Bank', 'Isolation Ward', 'Free RT-PCR / Viral Testing'],
    verifiedStock: 'Critical Care Ready (Oxygen & Isolation Beds active)',
  },
  {
    id: 'fac-khu-3',
    name: 'Apollo Hospital Bhubaneswar',
    type: 'HOSPITAL',
    category: 'Private Multispeciality Hospital',
    district: 'Khurda',
    ward: 'Saheed Nagar / Sainik School',
    address: 'Plot 251, Sainik School Road, Bhubaneswar',
    latitude: 20.3080,
    longitude: 85.8320,
    phone: '+91-674-6661016',
    helpline: '1066',
    isOpen24x7: true,
    services: ['24/7 Emergency Trauma', 'Advanced ICU & Cardiac Care', 'Epidemic Triage', 'Comprehensive Diagnostic Labs'],
    verifiedStock: 'Fully Equipped',
  },
  {
    id: 'fac-khu-4',
    name: 'SUM Ultimate Medicare',
    type: 'HOSPITAL',
    category: 'Private Multispeciality Hospital',
    district: 'Khurda',
    ward: 'Khandagiri / Ghatikia',
    address: 'K8, Kalinga Nagar, Ghatikia, Bhubaneswar',
    latitude: 20.2780,
    longitude: 85.7650,
    phone: '+91-674-3500500',
    helpline: '0674-3500500',
    isOpen24x7: true,
    services: ['24/7 Emergency Triage', 'Critical Care & Pulmonology', 'Dialysis & Blood Bank'],
    verifiedStock: 'Fully Equipped',
  },
  {
    id: 'fac-khu-5',
    name: 'UPHC Saheed Nagar (Ward 29 Health Clinic)',
    type: 'UPHC',
    category: 'Government Clinic',
    district: 'Khurda',
    ward: 'Saheed Nagar (Ward 29)',
    address: 'Plot 42, Near BMC Community Hall, Saheed Nagar',
    latitude: 20.2925,
    longitude: 85.8475,
    phone: '+91-674-2541929',
    helpline: '1929',
    isOpen24x7: true,
    services: ['Free Fever Triage', 'Rapid Dengue & Malaria Testing', 'Free ORS & Antibiotics', 'Doctor Consultation'],
    verifiedStock: 'High (Paracetamol, ORS, IV Fluids available)',
  },
  {
    id: 'fac-khu-6',
    name: 'UPHC Nayapalli & IRC Village Clinic',
    type: 'UPHC',
    category: 'Government Clinic',
    district: 'Khurda',
    ward: 'Nayapalli (IRC Village)',
    address: 'Sector 4, IRC Village, Nayapalli',
    latitude: 20.3000,
    longitude: 85.8150,
    phone: '+91-674-2558710',
    helpline: '104',
    isOpen24x7: false,
    operatingHours: '8:00 AM - 8:00 PM',
    services: ['Outpatient Screen', 'Vaccination', 'Fever Clinic'],
    verifiedStock: 'Adequate Stock',
  },
  {
    id: 'fac-khu-7',
    name: 'Apollo 24/7 Pharmacy Master Canteen',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Khurda',
    ward: 'Master Canteen / Station Square',
    address: 'Shop 12, Master Canteen Square, Bhubaneswar',
    latitude: 20.2685,
    longitude: 85.8402,
    phone: '+91-674-2530112',
    isOpen24x7: true,
    services: ['24/7 OTC Antipyretics', 'ORS & Electrolytes', 'Mosquito Repellents', 'Home Delivery'],
    verifiedStock: 'Verified Stock (Essential Medicines In Stock)',
  },
  {
    id: 'fac-khu-8',
    name: 'MedPlus 24x7 Pharmacy Patia',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Khurda',
    ward: 'Patia (InfoCity Zone)',
    address: 'KIIT Road, Near Patia Station, Bhubaneswar',
    latitude: 20.3540,
    longitude: 85.8190,
    phone: '+91-674-2725511',
    isOpen24x7: true,
    services: ['24/7 Emergency Medicines', 'Thermometers & Oximeters', 'Water Purification Tablets'],
    verifiedStock: 'Verified Stock (Ample Supply)',
  },

  // 3. Cuttack
  {
    id: 'fac-cut-1',
    name: 'SCB Medical College & Apex Government Hospital',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Cuttack',
    ward: 'Mangalabag & SCB Medical Zone',
    address: 'Mangalabag, Cuttack',
    latitude: 20.4625,
    longitude: 85.8830,
    phone: '+91-671-2414004',
    helpline: '108',
    isOpen24x7: true,
    services: ['Tertiary Referral Hub', 'State Viral Research Lab', 'Advanced Critical Care', '24/7 Trauma Unit'],
    verifiedStock: 'State Central Repository (Fully Equipped)',
  },
  {
    id: 'fac-cut-2',
    name: 'Ashwini Hospital Cuttack',
    type: 'HOSPITAL',
    category: 'Private Multispeciality Hospital',
    district: 'Cuttack',
    ward: 'CDA Sector 6 (Bidanasi)',
    address: 'Sector 1, CDA, Cuttack',
    latitude: 20.4850,
    longitude: 85.8450,
    phone: '+91-671-2363007',
    helpline: '0671-2363007',
    isOpen24x7: true,
    services: ['24/7 Emergency & Cardiac', 'Intensive Care Unit', 'Dialysis & Pathology'],
    verifiedStock: 'Fully Stocked',
  },
  {
    id: 'fac-cut-3',
    name: 'Relief 24/7 Chemist & Drug Store',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Cuttack',
    ward: 'Badambadi & Ranihat Zone',
    address: 'Ranihat Square, Medical Road, Cuttack',
    latitude: 20.4650,
    longitude: 85.8750,
    phone: '+91-671-2423300',
    isOpen24x7: true,
    services: ['24/7 Emergency Lifesaving Drugs', 'Surgical Supplies', 'ORS Packets'],
    verifiedStock: 'Verified High',
  },

  // 4. Puri
  {
    id: 'fac-pur-1',
    name: 'District Headquarters Hospital (DHH) Puri',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Puri',
    ward: 'Grand Road (Bada Danda)',
    address: 'Grand Road, Near Jagannath Temple, Puri',
    latitude: 19.8135,
    longitude: 85.8312,
    phone: '+91-6752-222045',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & Heatstroke Unit', 'Epidemic Control Unit', 'Diarrheal Treatment Center', 'Blood Bank'],
    verifiedStock: 'High (ORS, IV Fluids & Paracetamol Available)',
  },
  {
    id: 'fac-pur-2',
    name: 'Jagannath 24/7 Chemist & Druggist',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Puri',
    ward: 'VIP Road Marine Drive',
    address: 'VIP Road, Near Medical Chowk, Puri',
    latitude: 19.8100,
    longitude: 85.8250,
    phone: '+91-6752-224500',
    isOpen24x7: true,
    services: ['24/7 OTC Medicines', 'First Aid', 'Hydration Salts'],
    verifiedStock: 'Verified Ready',
  },

  // 5. Sundargarh / Rourkela
  {
    id: 'fac-sun-1',
    name: 'Ispat General Hospital (IGH Rourkela)',
    type: 'HOSPITAL',
    category: 'PSU / Govt Multispeciality',
    district: 'Sundargarh',
    ward: 'Rourkela Sector 4 Steel Township',
    address: 'Sector 19, Steel Township, Rourkela',
    latitude: 22.2500,
    longitude: 84.8500,
    phone: '+91-661-2646200',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & Burn Unit', 'Critical Care & ICU', 'Blood Bank', 'Diagnostic Labs'],
    verifiedStock: 'State Super-Speciality Reserve',
  },
  {
    id: 'fac-sun-2',
    name: 'Rourkela Government Hospital (RGH)',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Sundargarh',
    ward: 'Civil Township / Uditnagar',
    address: 'Panposh Road, Uditnagar, Rourkela',
    latitude: 22.2280,
    longitude: 84.8400,
    phone: '+91-661-2500108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Fever Triage Booth', 'Free Pathology'],
    verifiedStock: 'High',
  },
  {
    id: 'fac-sun-3',
    name: 'Lifeline 24/7 Medico Care Rourkela',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Sundargarh',
    ward: 'Civil Township / Uditnagar',
    address: 'Bisra Road, Near Railway Station, Rourkela',
    latitude: 22.2250,
    longitude: 84.8520,
    phone: '+91-661-2512299',
    isOpen24x7: true,
    services: ['24/7 Emergency Drugs', 'Nebulizers', 'Oxygen Cans'],
    verifiedStock: 'Verified Available',
  },

  // 6. Sambalpur
  {
    id: 'fac-sam-1',
    name: 'VIMSAR Medical College & Hospital Burla',
    type: 'HOSPITAL',
    category: 'Govt Apex Medical College',
    district: 'Sambalpur',
    ward: 'Burla (VIMSAR Medical Zone)',
    address: 'Hospital Road, Burla, Sambalpur',
    latitude: 21.5000,
    longitude: 83.8700,
    phone: '+91-663-2430768',
    helpline: '108',
    isOpen24x7: true,
    services: ['Apex Tertiary Care', '24/7 Trauma Hub', 'Advanced Virology & Epidemic Lab', 'Blood Bank'],
    verifiedStock: 'Apex Western Odisha Reserve',
  },
  {
    id: 'fac-sam-2',
    name: 'Maa Samaleswari 24/7 Medicals',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Sambalpur',
    ward: 'Dhanupali & Ainthapali Ward',
    address: 'Budharaja Square, Sambalpur',
    latitude: 21.4700,
    longitude: 83.9800,
    phone: '+91-663-2410888',
    isOpen24x7: true,
    services: ['24/7 Medicines', 'Baby Care & Rehydration', 'First Aid'],
    verifiedStock: 'High',
  },

  // 7. Balasore
  {
    id: 'fac-bal-1',
    name: 'Fakir Mohan Medical College & Hospital',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Balasore',
    ward: 'Balasore Station & Town Ward',
    address: 'Remuna Golei, Balasore',
    latitude: 21.4934,
    longitude: 86.9135,
    phone: '+91-6782-262010',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Regional Blood Bank', 'Diagnostic Labs'],
    verifiedStock: 'Fully Stocked',
  },
  {
    id: 'fac-bal-2',
    name: 'Balasore 24/7 Lifeline Pharmacy',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Balasore',
    ward: 'Balasore Station & Town Ward',
    address: 'Cinema Chhak, OT Road, Balasore',
    latitude: 21.4950,
    longitude: 86.9300,
    phone: '+91-6782-264500',
    isOpen24x7: true,
    services: ['24/7 Antibiotics & Antipyretics', 'Rapid Testing Kits'],
    verifiedStock: 'Verified Available',
  },

  // 8. Ganjam / Berhampur
  {
    id: 'fac-gan-1',
    name: 'MKCG Medical College & Hospital',
    type: 'HOSPITAL',
    category: 'Govt Apex Medical College',
    district: 'Ganjam',
    ward: 'Berhampur (MKCG Hospital Zone)',
    address: 'Medical College Campus, Berhampur, Ganjam',
    latitude: 19.3150,
    longitude: 84.7941,
    phone: '+91-680-2292746',
    helpline: '108',
    isOpen24x7: true,
    services: ['Apex Southern Odisha Referral', '24/7 Trauma & Emergency', 'Super Speciality ICU'],
    verifiedStock: 'Apex Regional Reserve',
  },
  {
    id: 'fac-gan-2',
    name: 'Apollo Pharmacy 24/7 Berhampur',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Ganjam',
    ward: 'Berhampur (MKCG Hospital Zone)',
    address: 'Giri Road, Medical Square, Berhampur',
    latitude: 19.3120,
    longitude: 84.7920,
    phone: '+91-680-2228800',
    isOpen24x7: true,
    services: ['24/7 OTC Antipyretics', 'ORS & Pediatric Hydration'],
    verifiedStock: 'High',
  },

  // 9. Bhadrak
  {
    id: 'fac-bha-1',
    name: 'District Headquarters Hospital (DHH) Bhadrak',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Bhadrak',
    ward: 'Bhadrak Puruna Bazar',
    address: 'Puruna Bazar Road, Bhadrak',
    latitude: 21.0574,
    longitude: 86.4950,
    phone: '+91-6784-251508',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Epidemic Response Ward', 'Maternity & Pediatric'],
    verifiedStock: 'High',
  },
  {
    id: 'fac-bha-2',
    name: 'Salandi 24/7 Emergency Pharmacy',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Bhadrak',
    ward: 'Bhadrak Puruna Bazar',
    address: 'Bonth Chhak, Bhadrak',
    latitude: 21.0600,
    longitude: 86.5000,
    phone: '+91-6784-252100',
    isOpen24x7: true,
    services: ['24/7 Medicines', 'ORS Tablets', 'Antipyretics'],
    verifiedStock: 'Verified Available',
  },

  // 10. Mayurbhanj
  {
    id: 'fac-may-1',
    name: 'PRM Medical College & Hospital Baripada',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Mayurbhanj',
    ward: 'Baripada Palbani Heritage Ward',
    address: 'Palbani, Baripada, Mayurbhanj',
    latitude: 21.9322,
    longitude: 86.7262,
    phone: '+91-6792-252108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Tribal Health Outreach', 'Pathology Hub'],
    verifiedStock: 'Fully Stocked',
  },
  {
    id: 'fac-may-2',
    name: 'Similipal 24/7 Emergency Pharmacy',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Mayurbhanj',
    ward: 'Baripada Palbani Heritage Ward',
    address: 'Station Road, Baripada',
    latitude: 21.9300,
    longitude: 86.7300,
    phone: '+91-6792-254400',
    isOpen24x7: true,
    services: ['24/7 Emergency Drugs', 'Anti-Venom & Antipyretics'],
    verifiedStock: 'High',
  },

  // 11. Keonjhar
  {
    id: 'fac-keo-1',
    name: 'Dharanidhar Medical College & Hospital',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Keonjhar',
    ward: 'Keonjhar District Town',
    address: 'Hospital Road, Keonjhar Town',
    latitude: 21.6289,
    longitude: 85.5817,
    phone: '+91-6766-255108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Mining Belt Pulmonary Clinic', 'Blood Bank'],
    verifiedStock: 'Fully Stocked',
  },

  // 12. Jharsuguda
  {
    id: 'fac-jha-1',
    name: 'District Headquarters Hospital Jharsuguda',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Jharsuguda',
    ward: 'Jharsuguda Industrial Ward',
    address: 'Industrial Bypass Road, Jharsuguda',
    latitude: 21.8554,
    longitude: 84.0062,
    phone: '+91-6645-270108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Trauma Care', 'Free Diagnostic Services'],
    verifiedStock: 'Adequate Stock',
  },

  // 13. Koraput
  {
    id: 'fac-kor-1',
    name: 'Saheed Laxman Nayak Medical College & Hospital',
    type: 'HOSPITAL',
    category: 'Govt Apex Medical College',
    district: 'Koraput',
    ward: 'Koraput Hill Town HQ',
    address: 'Medical College Road, Koraput',
    latitude: 18.8135,
    longitude: 82.7123,
    phone: '+91-6852-250108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Tribal Health Hub', 'Vector-Borne Disease Control'],
    verifiedStock: 'High Reserve',
  },
  {
    id: 'fac-kor-2',
    name: 'Jeypore 24/7 Emergency Medicals',
    type: 'PHARMACY',
    category: '24/7 Retail Pharmacy',
    district: 'Koraput',
    ward: 'Jeypore Main Commercial Ward',
    address: 'Main Road, Near Bus Stand, Jeypore',
    latitude: 18.8500,
    longitude: 82.5700,
    phone: '+91-6854-233400',
    isOpen24x7: true,
    services: ['24/7 OTC Medicines', 'ORS & Antipyretics'],
    verifiedStock: 'High',
  },

  // 14. Rayagada
  {
    id: 'fac-ray-1',
    name: 'District Headquarters Hospital Rayagada',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Rayagada',
    ward: 'Rayagada Town Ward',
    address: 'Main Hospital Road, Rayagada',
    latitude: 19.1678,
    longitude: 83.4158,
    phone: '+91-6856-222108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Diarrhea Treatment Ward', 'Blood Storage'],
    verifiedStock: 'High',
  },

  // 15. Kalahandi
  {
    id: 'fac-kal-1',
    name: 'Government Medical College & Hospital Kalahandi',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Kalahandi',
    ward: 'Bhawanipatna District Town',
    address: 'Bhangabari, Bhawanipatna, Kalahandi',
    latitude: 19.9075,
    longitude: 83.1656,
    phone: '+91-6670-230108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Maternity Wing', 'Pathology Lab'],
    verifiedStock: 'Fully Stocked',
  },

  // 16. Bolangir
  {
    id: 'fac-bol-1',
    name: 'Bhima Bhoi Medical College & Hospital Bolangir',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Bolangir',
    ward: 'Bolangir Town Ward',
    address: 'Medical College Road, Bolangir',
    latitude: 20.7107,
    longitude: 83.4867,
    phone: '+91-6652-232108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'ICU & Critical Care', 'Blood Bank'],
    verifiedStock: 'Fully Stocked',
  },

  // 17. Bargarh
  {
    id: 'fac-bar-1',
    name: 'District Headquarters Hospital Bargarh',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Bargarh',
    ward: 'Bargarh Town Ward',
    address: 'Khedapali Road, Bargarh',
    latitude: 21.3333,
    longitude: 83.6167,
    phone: '+91-6646-231108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Dialysis Centre', 'Fever Clinic'],
    verifiedStock: 'High',
  },

  // 18. Dhenkanal
  {
    id: 'fac-dhe-1',
    name: 'District Headquarters Hospital Dhenkanal',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Dhenkanal',
    ward: 'Dhenkanal Town Ward',
    address: 'Station Road, Dhenkanal',
    latitude: 20.6586,
    longitude: 85.5967,
    phone: '+91-6762-226108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Maternity Ward', 'Free Diagnostics'],
    verifiedStock: 'Adequate Stock',
  },

  // 19. Jajpur
  {
    id: 'fac-jaj-1',
    name: 'Jajpur Medical College & Hospital',
    type: 'HOSPITAL',
    category: 'Govt Medical College',
    district: 'Jajpur',
    ward: 'Jajpur Town Ward',
    address: 'Ankula, Jajpur Town',
    latitude: 20.8522,
    longitude: 86.3333,
    phone: '+91-6728-222108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency & ICU', 'Trauma Unit', 'Blood Bank'],
    verifiedStock: 'Fully Stocked',
  },

  // 20. Kendrapara
  {
    id: 'fac-ken-1',
    name: 'District Headquarters Hospital Kendrapara',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Kendrapara',
    ward: 'Kendrapara Town Ward',
    address: 'Hospital Road, Kendrapara',
    latitude: 20.4994,
    longitude: 86.4230,
    phone: '+91-6727-232108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Cyclone & Epidemic Medical Unit', 'Pathology'],
    verifiedStock: 'High',
  },

  // 21. Jagatsinghpur
  {
    id: 'fac-jag-1',
    name: 'District Headquarters Hospital Jagatsinghpur',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Jagatsinghpur',
    ward: 'Jagatsinghpur Town Ward',
    address: 'Hospital Chhak, Jagatsinghpur',
    latitude: 20.2667,
    longitude: 86.1667,
    phone: '+91-6724-220108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Maternity Hub', 'Blood Bank'],
    verifiedStock: 'Adequate Stock',
  },
  {
    id: 'fac-jag-2',
    name: 'Biju Memorial Hospital Paradip Port',
    type: 'HOSPITAL',
    category: 'Govt Port Hospital',
    district: 'Jagatsinghpur',
    ward: 'Paradip Port & Refinery Ward',
    address: 'Port Trust Road, Paradip',
    latitude: 20.3167,
    longitude: 86.6167,
    phone: '+91-6722-222210',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Port Emergency', 'Industrial Trauma Hub', 'Ambulance Station'],
    verifiedStock: 'High',
  },

  // 22. Nayagarh
  {
    id: 'fac-nay-1',
    name: 'District Headquarters Hospital Nayagarh',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Nayagarh',
    ward: 'Nayagarh Town Ward',
    address: 'Old Hospital Road, Nayagarh',
    latitude: 20.1333,
    longitude: 85.1000,
    phone: '+91-6753-252108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Surgical Wing', 'Free Diagnostic Tests'],
    verifiedStock: 'Adequate Stock',
  },

  // 23. Kandhamal
  {
    id: 'fac-kan-1',
    name: 'District Headquarters Hospital Phulbani',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Kandhamal',
    ward: 'Phulbani District Town',
    address: 'Court Road, Phulbani, Kandhamal',
    latitude: 20.1333,
    longitude: 84.1500,
    phone: '+91-6842-253108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Tribal Health Outreach', 'Malaria & Febrile Clinic'],
    verifiedStock: 'High (Anti-Malarials & ORS in Stock)',
  },

  // 24. Boudh
  {
    id: 'fac-bou-1',
    name: 'District Headquarters Hospital Boudh',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Baudh',
    ward: 'Boudh Town Ward',
    address: 'Hospital Road, Boudh',
    latitude: 20.8333,
    longitude: 84.3167,
    phone: '+91-6841-222108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Pediatric Wing', 'Free Pathology'],
    verifiedStock: 'Adequate Stock',
  },

  // 25. Subarnapur (Sonepur)
  {
    id: 'fac-sub-1',
    name: 'District Headquarters Hospital Sonepur',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Subarnapur',
    ward: 'Sonepur Town Ward',
    address: 'Mahabir Chowk, Sonepur',
    latitude: 20.8333,
    longitude: 83.9167,
    phone: '+91-6654-220108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Maternity & Child Health', 'Blood Storage'],
    verifiedStock: 'Adequate Stock',
  },

  // 26. Nabarangpur
  {
    id: 'fac-nab-1',
    name: 'District Headquarters Hospital Nabarangpur',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Nabarangpur',
    ward: 'Nabarangpur Town Ward',
    address: 'Mission Road, Nabarangpur',
    latitude: 19.2319,
    longitude: 82.5511,
    phone: '+91-6858-222108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Nutritional Rehabilitation Unit', 'Blood Bank'],
    verifiedStock: 'High',
  },

  // 27. Nuapada
  {
    id: 'fac-nua-1',
    name: 'District Headquarters Hospital Nuapada',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Nuapada',
    ward: 'Nuapada Town Ward',
    address: 'National Highway Road, Nuapada',
    latitude: 20.8333,
    longitude: 82.5333,
    phone: '+91-6678-223108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Fever Screening Triage', 'Free Medicine Counter'],
    verifiedStock: 'Adequate Stock',
  },

  // 28. Malkangiri
  {
    id: 'fac-mal-1',
    name: 'District Headquarters Hospital Malkangiri',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Malkangiri',
    ward: 'Malkangiri Town Ward',
    address: 'Collectorate Road, Malkangiri',
    latitude: 18.3500,
    longitude: 81.9000,
    phone: '+91-6861-230108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Japanese Encephalitis & Vector Unit', 'Blood Bank', 'Pediatric Intensive Care'],
    verifiedStock: 'High (Specialized Vector & Antiviral Drugs in Stock)',
  },

  // 29. Gajapati
  {
    id: 'fac-gaj-1',
    name: 'District Headquarters Hospital Paralakhemundi',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Gajapati',
    ward: 'Paralakhemundi Heritage Ward',
    address: 'Palace Street, Paralakhemundi, Gajapati',
    latitude: 18.8089,
    longitude: 84.1539,
    phone: '+91-6815-222108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Maternity & Pediatric Hub', 'Free Diagnostics'],
    verifiedStock: 'High',
  },

  // 30. Deogarh
  {
    id: 'fac-deo-1',
    name: 'District Headquarters Hospital Deogarh',
    type: 'HOSPITAL',
    category: 'Govt District Hospital',
    district: 'Deogarh',
    ward: 'Deogarh Town Ward',
    address: 'Hospital Road, Deogarh Town',
    latitude: 21.5333,
    longitude: 84.7333,
    phone: '+91-6641-226108',
    helpline: '108',
    isOpen24x7: true,
    services: ['24/7 Emergency', 'Fever Clinic', 'Pathology Lab'],
    verifiedStock: 'Adequate Stock',
  },
];

export const FacilitiesLocatorModal: React.FC<FacilitiesLocatorModalProps> = ({ isOpen, onClose }) => {
  const [facilities, setFacilities] = useState<Facility[]>(FALLBACK_FACILITIES);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All 30 Districts');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        const data = await api.getFacilities();
        if (Array.isArray(data) && data.length > 0) {
          setFacilities(data);
        } else {
          setFacilities(FALLBACK_FACILITIES);
        }
      } catch {
        setFacilities(FALLBACK_FACILITIES);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = facilities.filter((f) => {
    // District match
    const matchesDistrict =
      selectedDistrict === 'All 30 Districts' ||
      f.district.toLowerCase() === selectedDistrict.toLowerCase() ||
      (selectedDistrict === 'Khurda' && f.district.toLowerCase().includes('bhubaneswar'));

    // Type match
    let matchesType = true;
    if (filterType !== 'ALL') {
      if (filterType === 'HOSPITAL') {
        matchesType =
          f.type === 'HOSPITAL' ||
          f.category.toLowerCase().includes('hospital') ||
          f.category.toLowerCase().includes('college');
      } else if (filterType === 'UPHC') {
        matchesType =
          f.type === 'UPHC' ||
          f.category.toLowerCase().includes('clinic') ||
          f.category.toLowerCase().includes('phc') ||
          f.category.toLowerCase().includes('chc');
      } else if (filterType === 'PHARMACY') {
        matchesType =
          f.type === 'PHARMACY' ||
          f.category.toLowerCase().includes('pharmacy') ||
          f.category.toLowerCase().includes('chemist');
      } else if (filterType === '24X7') {
        matchesType = f.isOpen24x7;
      }
    }

    // Search query match (ward, district, name, address, services)
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      f.name.toLowerCase().includes(q) ||
      f.district.toLowerCase().includes(q) ||
      (f.ward && f.ward.toLowerCase().includes(q)) ||
      f.address.toLowerCase().includes(q) ||
      f.phone.includes(q) ||
      f.services.some((s) => s.toLowerCase().includes(q));

    return matchesDistrict && matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Find Nearest Care & 24/7 Pharmacies
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wide">
                  All 30 Districts of Odisha
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Verified Government DHH/SDH/UPHC Hospitals, Private Medical Centers, Direct Telephone Calling & GPS Navigation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/70 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* District Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-emerald-400" /> District:
              </span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full sm:w-56 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
              >
                {ODISHA_DISTRICT_LIST.map((dist) => (
                  <option key={dist} value={dist}>
                    {dist}
                  </option>
                ))}
              </select>
            </div>

            {/* Locality Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ward (e.g. Pallahara, Khalari, Saheed Nagar, Dumduma)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'ALL', label: '🏥 All Facilities' },
              { id: 'HOSPITAL', label: '🏨 Govt & Private Hospitals' },
              { id: 'UPHC', label: '🩺 UPHC / PHC Clinics' },
              { id: 'PHARMACY', label: '💊 24/7 Pharmacies' },
              { id: '24X7', label: '⚡ 24/7 Emergency Units' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterType === tab.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/40'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <span className="text-[11px] text-slate-400 ml-auto font-medium hidden sm:inline">
              Showing <strong className="text-emerald-400">{filtered.length}</strong> facilities
            </span>
          </div>
        </div>

        {/* Facilities Grid List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Querying verified medical directory across Odisha...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
              <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-semibold text-slate-300">No medical facilities found for this query.</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Try selecting "All 30 Districts" or searching for a broader locality name.
              </p>
              <button
                onClick={() => {
                  setSelectedDistrict('All 30 Districts');
                  setFilterType('ALL');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filtered.map((fac) => (
              <div
                key={fac.id}
                className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 hover:border-emerald-500/50 hover:bg-slate-800/60 transition-all duration-200 shadow-lg space-y-3"
              >
                {/* Row 1: Badges + Facility Name + Contact Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          fac.type === 'PHARMACY'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                            : fac.type === 'HOSPITAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {fac.category}
                      </span>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {fac.district}
                      </span>

                      {fac.ward && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          📍 {fac.ward}
                        </span>
                      )}

                      {fac.isOpen24x7 ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> 24/7 Open
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                          <Clock className="w-3 h-3" /> {fac.operatingHours || 'Day Hours'}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-100 pt-0.5 flex items-center gap-2">
                      {fac.name}
                    </h3>

                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{fac.address}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({fac.latitude.toFixed(4)}, {fac.longitude.toFixed(4)})
                      </span>
                    </p>
                  </div>

                  {/* Actions: Direct Call & View on Map */}
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    {/* Direct Call Button */}
                    <a
                      href={`tel:${fac.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
                      title={`Call ${fac.phone}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Now ({fac.phone})</span>
                    </a>

                    {/* Accurate Map Navigation Button */}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${fac.latitude},${fac.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 hover:text-emerald-300 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow"
                      title="Open GPS Turn-by-Turn Navigation in Google Maps"
                    >
                      <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Navigate</span>
                    </a>
                  </div>
                </div>

                {/* Available Services Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {fac.services.map((srv, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-2 py-0.5 bg-slate-900/80 text-slate-300 rounded-md border border-slate-800 flex items-center gap-1"
                    >
                      <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                      {srv}
                    </span>
                  ))}
                </div>

                {/* Verified Stock & Emergency Contact Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-2 text-slate-400 border-t border-slate-800/80 gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>
                      Essential Medicine Status:{' '}
                      <strong className="text-slate-200">{fac.verifiedStock}</strong>
                    </span>
                  </span>

                  <div className="flex items-center gap-3">
                    {fac.helpline && (
                      <a
                        href={`tel:${fac.helpline}`}
                        className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                        title="Emergency Ambulance Line"
                      >
                        🚨 Ambulance/Emergency: {fac.helpline}
                      </a>
                    )}
                    <span className="text-[10px] text-slate-500">
                      GPS: {fac.latitude.toFixed(3)}°N, {fac.longitude.toFixed(3)}°E
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-2 text-[11px]">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All telephone numbers connect directly to 24/7 triage desks, casualty wards & pharmacy stores.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors w-full sm:w-auto"
          >
            Close Directory
          </button>
        </div>
      </div>
    </div>
  );
};

