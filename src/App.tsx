import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Users, 
  MapPin, 
  Calendar, 
  Scissors, 
  Info, 
  Camera, 
  Palette, 
  Truck, 
  CreditCard, 
  CheckCircle2,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Send,
  Download,
  Printer,
  Edit2,
  AlertTriangle,
  Mail,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays } from 'date-fns';
import { id } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} from 'docx';
import { saveAs } from 'file-saver';

import { 
  UniformType, 
  SleeveModel, 
  CollarModel, 
  FabricType, 
  ShippingMethod, 
  PaymentStatus, 
  PaymentMethod,
  FormData,
  CustomSize
} from './types';

import { 
  ADMIN_WHATSAPP, 
  UNIFORM_OPTIONS, 
  EXTRA_FEATURE_OPTIONS, 
  COLOR_OPTIONS,
  FABRIC_OPTIONS, 
  PAYMENT_METHODS,
  EXPEDITION_OPTIONS
} from './constants';

import { cn } from './lib/utils';

const INITIAL_DATA: FormData = {
  namaPemesan: '',
  namaGrup: '',
  whatsapp: '',
  email: '',
  alamatLengkap: '',
  kotaKabupaten: '',
  tanggalPemesanan: format(new Date(), 'yyyy-MM-dd'),
  jenisSeragam: [],
  jenisSeragamLainnya: '',
  temaModel: '',
  modelLengan: SleeveModel.LenganPanjang,
  modelKerah: CollarModel.KerahSanghai,
  modelRokCelana: '',
  catatanTambahan: '',
  fiturTambahan: [],
  referensiFoto: [],
  warnaUtama: '#000000',
  warnaKombinasi: '#D4AF37',
  kodeWarna: '',
  bahan: FabricType.Wolfis,
  bahanLainnya: '',
  jumlahDewasa: 0,
  jumlahAnak: 0,
  hargaDewasa: 0,
  hargaAnak: 0,
  hargaCustom: 0,
  pilihanUkuran: 'Size Chart',
  dataUkuranCustom: [],
  tanggalDipakai: '',
  deadlineAcara: '',
  estimasiSelesai: '',
  pengiriman: ShippingMethod.AmbilLangsung,
  alamatPengiriman: '',
  ekspedisi: '',
  catatanKurir: '',
  statusPembayaran: PaymentStatus.DP,
  nominalPembayaran: 0,
  metodePembayaran: PaymentMethod.TransferBank,
  persetujuan: {
    ukuranBenar: false,
    warnaBerbeda: false,
    produksiSetelahDP: false,
    biayaPerubahan: false,
  }
};

export default function App() {
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);
  const finalSummaryRef = useRef<HTMLDivElement>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  // Visibility states for click-to-show inputs in Detail Model
  const [showInputs, setShowInputs] = useState({
    tema: false,
    lengan: false,
    kerah: false,
    bawah: false
  });

  // Auto calculate estimasi selesai
  useEffect(() => {
    if (!formData.estimasiSelesai) {
      setFormData(prev => ({ 
        ...prev, 
        estimasiSelesai: format(addDays(new Date(), 14), 'yyyy-MM-dd') 
      }));
    }
  }, []);

  const totalPesanan = formData.jumlahDewasa + formData.jumlahAnak;
  const subtotalDewasa = formData.jumlahDewasa * formData.hargaDewasa;
  const subtotalAnak = formData.jumlahAnak * formData.hargaAnak;
  const subtotalCustom = formData.dataUkuranCustom.length * formData.hargaCustom;
  const grandTotal = subtotalDewasa + subtotalAnak + subtotalCustom;
  const sisaPembayaran = grandTotal - formData.nominalPembayaran;

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxGroup = (field: 'jenisSeragam' | 'fiturTambahan', value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(i => i !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            referensiFoto: [...prev.referensiFoto, reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      referensiFoto: prev.referensiFoto.filter((_, i) => i !== index)
    }));
  };

  const addCustomSize = () => {
    const newSize: CustomSize = {
      name: '',
      lingkarDada: '',
      lingkarPinggang: '',
      lingkarPinggul: '',
      lebarBahu: '',
      panjangTangan: '',
      panjangBaju: '',
      tinggiBadan: '',
      beratBadan: '',
    };
    setFormData(prev => ({
      ...prev,
      dataUkuranCustom: [...prev.dataUkuranCustom, newSize]
    }));
  };

  const updateCustomSize = (index: number, field: keyof CustomSize, value: string) => {
    setFormData(prev => {
      const newList = [...prev.dataUkuranCustom];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, dataUkuranCustom: newList };
    });
  };

  const removeCustomSize = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dataUkuranCustom: prev.dataUkuranCustom.filter((_, i) => i !== index)
    }));
  };

  const formatNominalInput = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    return numeric ? parseInt(numeric).toLocaleString('id-ID') : '';
  };

  const handleNominalChange = (val: string) => {
    const numeric = val.replace(/\D/g, '');
    handleInputChange('nominalPembayaran', parseInt(numeric) || 0);
  };

  const exportJPEG = async () => {
    const element = isPreviewMode ? finalSummaryRef.current : summaryRef.current;
    if (!element) return;
    const canvas = await html2canvas(element);
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, `Order_Zalemika_${formData.namaPemesan}.jpg`);
    }, 'image/jpeg', 0.9);
  };

  const exportWord = async () => {
    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ text: "Kategori", bold: true })], shading: { fill: "000000" } }),
          new TableCell({ children: [new Paragraph({ text: "Jumlah", bold: true, alignment: AlignmentType.CENTER })], shading: { fill: "000000" } }),
          new TableCell({ children: [new Paragraph({ text: "Harga Satuan", bold: true, alignment: AlignmentType.RIGHT })], shading: { fill: "000000" } }),
          new TableCell({ children: [new Paragraph({ text: "Subtotal", bold: true, alignment: AlignmentType.RIGHT })], shading: { fill: "000000" } }),
        ],
      }),
    ];

    if (formData.jumlahDewasa > 0) {
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Dewasa")] }),
          new TableCell({ children: [new Paragraph({ text: `${formData.jumlahDewasa} Pcs`, alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: `Rp ${formData.hargaDewasa.toLocaleString()}`, alignment: AlignmentType.RIGHT })] }),
          new TableCell({ children: [new Paragraph({ text: `Rp ${(formData.jumlahDewasa * formData.hargaDewasa).toLocaleString()}`, alignment: AlignmentType.RIGHT })] }),
        ],
      }));
    }

    if (formData.jumlahAnak > 0) {
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Anak-Anak")] }),
          new TableCell({ children: [new Paragraph({ text: `${formData.jumlahAnak} Pcs`, alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: `Rp ${formData.hargaAnak.toLocaleString()}`, alignment: AlignmentType.RIGHT })] }),
          new TableCell({ children: [new Paragraph({ text: `Rp ${(formData.jumlahAnak * formData.hargaAnak).toLocaleString()}`, alignment: AlignmentType.RIGHT })] }),
        ],
      }));
    }

    if (formData.dataUkuranCustom.length > 0) {
      tableRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Custom Size")] }),
          new TableCell({ children: [new Paragraph({ text: `${formData.dataUkuranCustom.length} Orang`, alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ text: `Rp ${formData.hargaCustom.toLocaleString()}`, alignment: AlignmentType.RIGHT })] }),
          new TableCell({ children: [new Paragraph({ text: `Rp ${(formData.dataUkuranCustom.length * formData.hargaCustom).toLocaleString()}`, alignment: AlignmentType.RIGHT })] }),
        ],
      }));
    }

    tableRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: "Total Tagihan", bold: true })], columnSpan: 3 }),
        new TableCell({ children: [new Paragraph({ text: `Rp ${grandTotal.toLocaleString()}`, bold: true, alignment: AlignmentType.RIGHT })] }),
      ],
    }));

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            size: {
              width: 11906, // A4 width in twips
              height: 16838, // A4 height in twips
            }
          }
        },
        children: [
          new Paragraph({
            text: "ZALEMIKA FASHION - FORM PESANAN",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "DATA PEMESAN", bold: true }),
            ],
          }),
          new Paragraph({ text: `Nama Pemesan: ${formData.namaPemesan}` }),
          new Paragraph({ text: `Nama Grup: ${formData.namaGrup || '-'}` }),
          new Paragraph({ text: `No. WhatsApp: ${formData.whatsapp}` }),
          new Paragraph({ text: `Alamat Lengkap: ${formData.alamatLengkap}, ${formData.kotaKabupaten}` }),
          new Paragraph({ text: "" }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "SPESIFIKASI MODEL", bold: true }),
            ],
          }),
          new Paragraph({ text: `Jenis Seragam: ${formData.jenisSeragam.join(", ")}` }),
          new Paragraph({ text: `Tema Model: ${formData.temaModel}` }),
          new Paragraph({ text: `Model Lengan: ${formData.modelLengan}` }),
          new Paragraph({ text: `Model Kerah: ${formData.modelKerah}` }),
          new Paragraph({ text: `Bahan: ${formData.bahan}` }),
          new Paragraph({ text: `Warna: ${formData.warnaUtama}` }),
          new Paragraph({ text: `Fitur Tambahan: ${formData.fiturTambahan.join(", ") || '-'}` }),
          new Paragraph({ text: "" }),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),

          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "WAKTU & PENGIRIMAN", bold: true }),
            ],
          }),
          new Paragraph({ text: `Target Dijemput: ${formData.tanggalDipakai}` }),
          new Paragraph({ text: `Deadline Acara: ${formData.deadlineAcara}` }),
          new Paragraph({ text: `Metode Pengiriman: ${formData.pengiriman}` }),
          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: `Status Pembayaran: ${formData.statusPembayaran}`, bold: true }),
            ],
          }),
          new Paragraph({ text: `Metode: ${formData.metodePembayaran}` }),
          new Paragraph({ text: `Nominal Terbayar: Rp ${formData.nominalPembayaran.toLocaleString()}` }),
          ...(formData.statusPembayaran === PaymentStatus.DP ? [
            new Paragraph({
              children: [
                new TextRun({ text: `SISA TAGIHAN: Rp ${sisaPembayaran.toLocaleString()}`, bold: true }),
              ],
            })
          ] : []),
          
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: `${formData.kotaKabupaten}, ${format(new Date(), 'dd MMMM yyyy')}` }),
            ],
            alignment: AlignmentType.RIGHT
          }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({
            children: [
              new TextRun({ text: "(........................................)" }),
            ],
            alignment: AlignmentType.RIGHT
          }),
          new Paragraph({
             children: [
               new TextRun({ text: `Tanda Tangan ${formData.namaPemesan}` }),
             ],
             alignment: AlignmentType.RIGHT
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Order_Zalemika_${formData.namaPemesan}.docx`);
  };

  const generateWhatsAppMessage = async () => {
    // Attempt to download JPEG first as requested "whatsapp yang terkirim bentuk jpeg"
    // Though API can't send it, downloading it makes it easy for user to attach
    await exportJPEG();

    const { 
      namaPemesan, namaGrup, whatsapp, alamatLengkap, kotaKabupaten,
      jenisSeragam, jenisSeragamLainnya, temaModel, modelLengan, modelKerah,
      warnaUtama, bahan, jumlahDewasa, jumlahAnak,
      tanggalDipakai, deadlineAcara, pengiriman, alamatPengiriman, ekspedisi,
      statusPembayaran, nominalPembayaran, metodePembayaran
    } = formData;

    const items = [...jenisSeragam, ...(jenisSeragamLainnya ? [jenisSeragamLainnya] : [])].join(", ");

    const text = `*FORM PEMESANAN ZALEMIKA FASHION*
-------------------------------------------
*DATA PEMESAN*
Nama: ${namaPemesan}
Grup: ${namaGrup}
WA: ${whatsapp}
Alamat: ${alamatLengkap}, ${kotaKabupaten}

*DETAIL PESANAN*
Jenis: ${items}
Model: ${temaModel}
Lengan: ${modelLengan}
Kerah: ${modelKerah}
Bahan: ${bahan}
Warna: ${warnaUtama}

*UKURAN & JUMLAH*
Dewasa: ${jumlahDewasa} @ Rp ${formData.hargaDewasa.toLocaleString()}
Anak: ${jumlahAnak} @ Rp ${formData.hargaAnak.toLocaleString()}
Total: ${jumlahDewasa + jumlahAnak} Pcs
Grand Total Tagihan: Rp ${grandTotal.toLocaleString()}

*WAKTU*
Dijemput: ${tanggalDipakai}
Deadline: ${deadlineAcara}

*PENGIRIMAN*
Metode: ${pengiriman}
${pengiriman === ShippingMethod.Dikirim ? `Alamat: ${alamatPengiriman}\nKurir: ${ekspedisi}` : ''}

*PEMBAYARAN*
Metode: ${metodePembayaran}
Status: ${statusPembayaran}
Nominal: Rp ${nominalPembayaran.toLocaleString()}
${statusPembayaran === PaymentStatus.DP ? `*Sisa Tagihan: Rp ${sisaPembayaran.toLocaleString()}*` : ''}
-------------------------------------------
_Dikirim via Zalemika App_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encoded}`, '_blank');
  };

  const downloadPDF = async () => {
    if (!summaryRef.current) return;
    const canvas = await html2canvas(summaryRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Order_Zalemika_${formData.namaPemesan}.pdf`);
  };

  const isMepet = () => {
    if (!formData.deadlineAcara || !formData.estimasiSelesai) return false;
    const dl = new Date(formData.deadlineAcara);
    const est = new Date(formData.estimasiSelesai);
    return dl <= est;
  };

  return (
    <div className="min-h-screen pb-24 bg-brand-cream-dark scroll-smooth">
      {/* Header */}
      <header className="relative bg-brand-black min-h-[350px] flex items-center justify-center overflow-hidden border-b-2 border-brand-gold">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2000")',
            filter: 'brightness(0.4) contrast(1.1)'
          }}
        ></div>
        
        <div className="absolute inset-0 opacity-25 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-brand-black/30 via-transparent to-brand-black/80"></div>
        
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="mb-4"
          >
            <span className="text-brand-gold text-[8px] font-bold uppercase tracking-[0.5em]">Professional Uniform Service</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-2"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-[0.2em] leading-none drop-shadow-2xl">
              ZALEMIKA
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-8 bg-brand-gold/40"></div>
              <h2 className="text-xl md:text-2xl font-serif italic text-brand-gold tracking-widest uppercase">
                Fashion
              </h2>
              <div className="h-[1px] w-8 bg-brand-gold/40"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-8 flex flex-col items-center"
          >
             <button 
              onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
              className="group flex flex-col items-center gap-3 transition-all"
            >
              <span className="text-brand-cream/40 text-[8px] font-bold uppercase tracking-[0.3em] group-hover:text-brand-gold transition-colors italic">Scroll to Order</span>
              <motion.div 
                animate={{ y: [0, 8, 0] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-full border border-brand-gold/20 group-hover:border-brand-gold transition-all flex items-center justify-center -rotate-90"
              >
                <ChevronLeft className="text-brand-gold" size={18} />
              </motion.div>
            </button>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-brand-cream-dark to-transparent"></div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-12 space-y-12 relative z-20">
        {!isPreviewMode && (
          <>
        {/* SECTION 1: DATA PEMESAN */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6 border-b border-brand-cream pb-4">
            <User className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 1 — DATA PEMESAN</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputWrapper label="Nama Pemesan" icon={<User size={14} />}>
              <input type="text" className="form-input" value={formData.namaPemesan} onChange={(e) => handleInputChange('namaPemesan', e.target.value)} />
            </InputWrapper>
            <InputWrapper label="Nama Grup/Instansi" icon={<Users size={14} />}>
              <input type="text" className="form-input" value={formData.namaGrup} onChange={(e) => handleInputChange('namaGrup', e.target.value)} />
            </InputWrapper>
            <InputWrapper label="WhatsApp" icon={<Smartphone size={14} />}>
              <input type="tel" className="form-input" value={formData.whatsapp} onChange={(e) => handleInputChange('whatsapp', e.target.value)} />
            </InputWrapper>
            <InputWrapper label="Kota/Kabupaten" icon={<MapPin size={14} />}>
              <input type="text" className="form-input" value={formData.kotaKabupaten} onChange={(e) => handleInputChange('kotaKabupaten', e.target.value)} />
            </InputWrapper>
            <div className="md:col-span-2">
              <InputWrapper label="Alamat Lengkap" icon={<MapPin size={14} />}>
                <textarea rows={2} className="form-input" value={formData.alamatLengkap} onChange={(e) => handleInputChange('alamatLengkap', e.target.value)} />
              </InputWrapper>
            </div>
          </div>
        </div>

        {/* SECTION 2: JENIS & PILIHAN HOVER */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <Scissors className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 2 — ORDER OPTIONS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* JENIS SERAGAM HOVER BOX */}
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Jenis Seragam</label>
              <div className="p-6 border-2 border-dashed border-brand-gold/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-default hover:bg-brand-gold/5 transition-all group-hover:border-brand-gold">
                <Scissors className="text-brand-gold/40 mb-2" size={24} />
                <span className="text-sm font-serif font-bold italic tracking-wide">
                  {formData.jenisSeragam.length > 0 ? formData.jenisSeragam.join(", ") : "Hover & Pilih Jenis..."}
                </span>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 z-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100 duration-300">
                <div className="bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-brand-gold grid grid-cols-1 gap-1">
                  {UNIFORM_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-3 hover:bg-brand-gold/5 rounded-xl transition-all cursor-pointer boutique-choice">
                      <input type="checkbox" className="form-checkbox" checked={formData.jenisSeragam.includes(opt as UniformType)} onChange={() => handleCheckboxGroup('jenisSeragam', opt)} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* DETAIL MODEL HOVER BOX */}
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Detail Model</label>
              <div className="p-6 border-2 border-dashed border-brand-gold/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-default hover:bg-brand-gold/5 transition-all group-hover:border-brand-gold">
                <Edit2 className="text-brand-gold/40 mb-2" size={24} />
                <span className="text-sm font-serif font-bold italic tracking-wide">Hover & Klik Komponen</span>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 z-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100 duration-300">
                <div className="bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-brand-gold grid grid-cols-1 gap-2">
                  <button onClick={() => setShowInputs(p => ({ ...p, tema: !p.tema }))} className="text-left p-3 hover:bg-brand-gold/5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex justify-between items-center transition-all">
                    Tema Model <ChevronRight size={12} />
                  </button>
                  <button onClick={() => setShowInputs(p => ({ ...p, lengan: !p.lengan }))} className="text-left p-3 hover:bg-brand-gold/5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex justify-between items-center transition-all">
                    Detail Lengan <ChevronRight size={12} />
                  </button>
                  <button onClick={() => setShowInputs(p => ({ ...p, kerah: !p.kerah }))} className="text-left p-3 hover:bg-brand-gold/5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex justify-between items-center transition-all">
                    Detail Kerah <ChevronRight size={12} />
                  </button>
                  <button onClick={() => setShowInputs(p => ({ ...p, bawah: !p.bawah }))} className="text-left p-3 hover:bg-brand-gold/5 rounded-xl text-[10px] font-bold uppercase tracking-widest flex justify-between items-center transition-all">
                    Rok/Celana <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC INPUTS FOR MODEL */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
             <AnimatePresence>
                {showInputs.tema && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <InputWrapper label="Nama/Tema Model" icon={<Palette size={14} />}>
                      <input type="text" className="form-input-sm" value={formData.temaModel} onChange={(e) => handleInputChange('temaModel', e.target.value)} placeholder="Contoh: Abaya Turkish" />
                    </InputWrapper>
                  </motion.div>
                )}
                {showInputs.lengan && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <InputWrapper label="Model Lengan" icon={<Info size={14} />}>
                      <select className="form-select text-[10px] h-10 py-1" value={formData.modelLengan} onChange={(e) => handleInputChange('modelLengan', e.target.value)}>
                        {Object.values(SleeveModel).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </InputWrapper>
                  </motion.div>
                )}
                {showInputs.kerah && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <InputWrapper label="Model Kerah" icon={<Info size={14} />}>
                      <select className="form-select text-[10px] h-10 py-1" value={formData.modelKerah} onChange={(e) => handleInputChange('modelKerah', e.target.value)}>
                        {Object.values(CollarModel).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </InputWrapper>
                  </motion.div>
                )}
                {showInputs.bawah && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <InputWrapper label="Model Rok/Celana" icon={<Info size={14} />}>
                      <input type="text" className="form-input-sm" value={formData.modelRokCelana} onChange={(e) => handleInputChange('modelRokCelana', e.target.value)} placeholder="A-Line / Plisket" />
                    </InputWrapper>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>

        {/* SECTION: WARNA & BAHAN */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <Palette className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 3 — COLORS & FABRIC</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputWrapper label="Pilih Nama Warna" icon={<Palette size={14} />}>
              <select className="form-select h-14" value={formData.warnaUtama} onChange={(e) => handleInputChange('warnaUtama', e.target.value)}>
                <option value="">Pilih Warna</option>
                {COLOR_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </InputWrapper>

            <InputWrapper label="Pilih Bahan (Tetap)" icon={<Scissors size={14} />}>
              <select className="form-select h-14" value={formData.bahan} onChange={(e) => handleInputChange('bahan', e.target.value)}>
                {FABRIC_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </InputWrapper>
          </div>
        </div>

        {/* SECTION: DETIL TAMBAHAN & REFERENSI HOVER */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <Plus className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 4 — ADD-ONS & PHOTOS</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* ADD-ONS HOVER BOX */}
            <div className="relative group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Detil Tambahan</label>
              <div className="p-8 border-2 border-dashed border-brand-gold/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-default hover:bg-brand-gold/5 transition-all group-hover:border-brand-gold">
                <Plus className="text-brand-gold/40 mb-2" size={24} />
                <span className="text-xs font-bold uppercase tracking-widest text-brand-black/60">
                  {formData.fiturTambahan.length > 0 ? formData.fiturTambahan.join(", ") : "Hover & Pilih Fitur"}
                </span>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 z-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100 duration-300">
                <div className="bg-white p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-brand-gold space-y-2">
                   {EXTRA_FEATURE_OPTIONS.map(opt => (
                     <label key={opt} className="flex items-center gap-3 p-3 hover:bg-brand-gold/5 rounded-xl cursor-pointer boutique-choice">
                       <input type="checkbox" className="form-checkbox" checked={formData.fiturTambahan.includes(opt)} onChange={() => handleCheckboxGroup('fiturTambahan', opt)} />
                       <span className="text-[10px] font-bold uppercase tracking-widest">{opt}</span>
                     </label>
                   ))}
                </div>
              </div>
            </div>

            <InputWrapper label="Catatan Tambahan (Khusus)" icon={<Edit2 size={14} />}>
              <textarea rows={4} className="form-input text-sm p-4" value={formData.catatanTambahan} onChange={(e) => handleInputChange('catatanTambahan', e.target.value)} placeholder="Tulis catatan khusus Anda di sini..." />
            </InputWrapper>
          </div>

          <div className="pt-8 border-t border-brand-cream">
            <label className="block text-[10px] font-bold text-brand-gold uppercase tracking-[0.3em] mb-4 italic">Upload Foto Referensi Model (Opsional)</label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {formData.referensiFoto.map((foto, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-brand-gold group">
                  <img src={foto} className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(idx)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <label className="aspect-square border-2 border-dashed border-brand-gold/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-gold hover:bg-brand-gold/5 transition-all group">
                <Camera className="text-brand-gold/40 group-hover:text-brand-gold mb-1" size={24} />
                <span className="text-[9px] font-semibold text-brand-gold uppercase tracking-tighter">Add Photo</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* SECTION: JUMLAH & UKURAN */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <Users className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 5 — QUANTITY & SIZE</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Jumlah Pesanan</label>
              <div className="grid grid-cols-2 gap-4">
                <InputWrapper label="Dewasa" icon={<User size={14} />}>
                  <div className="space-y-2">
                    <input type="number" min="0" className="form-input" value={formData.jumlahDewasa || ''} onChange={(e) => handleInputChange('jumlahDewasa', parseInt(e.target.value) || 0)} placeholder="Jumlah" />
                    <input 
                      type="text" 
                      className="form-input-sm !text-[10px]" 
                      value={formatNominalInput(formData.hargaDewasa.toString())} 
                      onChange={(e) => handleInputChange('hargaDewasa', parseInt(e.target.value.replace(/\D/g, '')) || 0)} 
                      placeholder="Harga Satuan"
                    />
                    <p className="text-[9px] font-bold text-brand-gold/60 text-right">Sub: Rp {subtotalDewasa.toLocaleString('id-ID')}</p>
                  </div>
                </InputWrapper>
                <InputWrapper label="Anak" icon={<User size={14} />}>
                  <div className="space-y-2">
                    <input type="number" min="0" className="form-input" value={formData.jumlahAnak || ''} onChange={(e) => handleInputChange('jumlahAnak', parseInt(e.target.value) || 0)} placeholder="Jumlah" />
                    <input 
                      type="text" 
                      className="form-input-sm !text-[10px]" 
                      value={formatNominalInput(formData.hargaAnak.toString())} 
                      onChange={(e) => handleInputChange('hargaAnak', parseInt(e.target.value.replace(/\D/g, '')) || 0)} 
                      placeholder="Harga Satuan"
                    />
                    <p className="text-[9px] font-bold text-brand-gold/60 text-right">Sub: Rp {subtotalAnak.toLocaleString('id-ID')}</p>
                  </div>
                </InputWrapper>
              </div>
              
              <div className="p-6 bg-brand-black text-brand-gold rounded-3xl border-2 border-brand-gold/50 shadow-xl space-y-2 mt-4">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                   <span>Total Quantity</span>
                   <span>{totalPesanan} Pcs</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold uppercase tracking-widest">Total Tagihan</span>
                   <span className="text-2xl font-mono font-bold">Rp {grandTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Pilihan Ukuran</label>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleInputChange('pilihanUkuran', 'Size Chart')}
                  className={cn(
                    "flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-bold text-xs tracking-widest uppercase boutique-choice",
                    formData.pilihanUkuran === 'Size Chart' 
                      ? "bg-brand-black text-brand-gold border-brand-black shadow-lg" 
                      : "border-brand-cream hover:border-brand-gold text-brand-black/40"
                  )}
                >
                  Size Chart
                </button>
                <button 
                  onClick={() => handleInputChange('pilihanUkuran', 'Custom')}
                  className={cn(
                    "flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-bold text-xs tracking-widest uppercase boutique-choice",
                    formData.pilihanUkuran === 'Custom' 
                      ? "bg-brand-black text-brand-gold border-brand-black shadow-lg" 
                      : "border-brand-cream hover:border-brand-gold text-brand-black/40"
                  )}
                >
                  Custom
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {formData.pilihanUkuran === 'Custom' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="pt-8 border-t border-brand-cream"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-serif font-bold italic tracking-wide">Data Ukuran Custom</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-brand-black/40">Biaya Custom / Orang</span>
                      <input 
                        type="text" 
                        className="form-input-sm !w-32 !text-[10px] h-8 text-right font-bold" 
                        value={formatNominalInput(formData.hargaCustom.toString())} 
                        onChange={(e) => handleInputChange('hargaCustom', parseInt(e.target.value.replace(/\D/g, '')) || 0)} 
                      />
                    </div>
                    <button onClick={addCustomSize} className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                      <Plus size={14} /> Tambah Orang
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-brand-cream">
                        <th className="py-4 px-2 text-[9px] font-bold uppercase tracking-widest text-brand-gold">Nama</th>
                        <th className="py-4 px-2 text-[9px] font-bold uppercase tracking-widest text-brand-gold">LD</th>
                        <th className="py-4 px-2 text-[9px] font-bold uppercase tracking-widest text-brand-gold">LP</th>
                        <th className="py-4 px-2 text-[9px] font-bold uppercase tracking-widest text-brand-gold">HT</th>
                        <th className="py-4 px-2 text-[9px] font-bold uppercase tracking-widest text-brand-gold">PB</th>
                        <th className="py-4 px-2 text-[9px] font-bold uppercase tracking-widest text-brand-gold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.dataUkuranCustom.map((item, idx) => (
                        <tr key={idx} className="border-b border-brand-cream/30">
                          <td className="py-3 px-1"><input type="text" className="form-input-sm !text-xs p-2 h-9" value={item.name} onChange={(e) => updateCustomSize(idx, 'name', e.target.value)} placeholder="Nama" /></td>
                          <td className="py-3 px-1"><input type="text" className="form-input-sm !text-xs p-2 h-9" value={item.lingkarDada} onChange={(e) => updateCustomSize(idx, 'lingkarDada', e.target.value)} placeholder="cm" /></td>
                          <td className="py-3 px-1"><input type="text" className="form-input-sm !text-xs p-2 h-9" value={item.lingkarPinggang} onChange={(e) => updateCustomSize(idx, 'lingkarPinggang', e.target.value)} placeholder="cm" /></td>
                          <td className="py-3 px-1"><input type="text" className="form-input-sm !text-xs p-2 h-9" value={item.panjangTangan} onChange={(e) => updateCustomSize(idx, 'panjangTangan', e.target.value)} placeholder="cm" /></td>
                          <td className="py-3 px-1"><input type="text" className="form-input-sm !text-xs p-2 h-9" value={item.panjangBaju} onChange={(e) => updateCustomSize(idx, 'panjangBaju', e.target.value)} placeholder="cm" /></td>
                          <td className="py-3 px-1"><button onClick={() => removeCustomSize(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {formData.dataUkuranCustom.length === 0 && (
                    <div className="py-12 text-center text-brand-black/20 italic font-serif">Belum ada data ukuran custom...</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION: TARGET WAKTU */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <Calendar className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 6 — TARGET TIME</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputWrapper label="Tanggal Dijemput" icon={<Calendar size={14} />}>
              <input type="date" className="form-input" value={formData.tanggalDipakai} onChange={(e) => handleInputChange('tanggalDipakai', e.target.value)} />
            </InputWrapper>
            <InputWrapper label="Deadline Acara" icon={<AlertTriangle size={14} />}>
              <input type="date" className="form-input" value={formData.deadlineAcara} onChange={(e) => handleInputChange('deadlineAcara', e.target.value)} />
            </InputWrapper>
          </div>

          {isMepet() && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 p-6 bg-red-50 border-2 border-red-100 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-red-500 text-white rounded-full shrink-0"><AlertTriangle size={20} /></div>
              <div>
                <h4 className="text-sm font-bold text-red-700 uppercase tracking-widest mb-1 italic">Waktu Sangat Mepet!</h4>
                <p className="text-xs text-red-600/80 leading-relaxed">Estimasi pengerjaan standar adalah 14 hari. Pesanan Anda mungkin dikenakan biaya percepatan atau prioritas.</p>
              </div>
            </motion.div>
          )}
        </div>

        {/* SECTION: PENGIRIMAN */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <Truck className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 7 — SHIPPING</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {Object.values(ShippingMethod).map(m => (
              <button 
                key={m}
                onClick={() => handleInputChange('pengiriman', m)}
                className={cn(
                  "py-4 px-6 rounded-2xl border-2 transition-all font-bold text-[10px] tracking-widest uppercase boutique-choice",
                  formData.pengiriman === m
                    ? "bg-brand-black text-brand-gold border-brand-black shadow-lg" 
                    : "border-brand-cream hover:border-brand-gold text-brand-black/40"
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {formData.pengiriman === ShippingMethod.Dikirim && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="space-y-6">
                <InputWrapper label="Alamat Pengiriman" icon={<MapPin size={14} />}>
                  <textarea rows={3} className="form-input" value={formData.alamatPengiriman} onChange={(e) => handleInputChange('alamatPengiriman', e.target.value)} placeholder="Jl. Raya No. 1..." />
                </InputWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputWrapper label="Ekspedisi" icon={<Truck size={14} />}>
                    <select className="form-select" value={formData.ekspedisi} onChange={(e) => handleInputChange('ekspedisi', e.target.value)}>
                      <option value="">Pilih Ekspedisi</option>
                      {EXPEDITION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </InputWrapper>
                  <InputWrapper label="Catatan Kurir" icon={<Info size={14} />}>
                    <input type="text" className="form-input" value={formData.catatanKurir} onChange={(e) => handleInputChange('catatanKurir', e.target.value)} placeholder="Warna pagar, dll..." />
                  </InputWrapper>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SECTION: PEMBAYARAN */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-8 border-b border-brand-cream pb-4">
            <CreditCard className="text-brand-gold" size={20} />
            <h2 className="text-xl font-serif font-bold italic">SECTION 8 — PAYMENT</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Status Pembayaran</label>
              <div className="flex gap-4">
                {Object.values(PaymentStatus).map(s => (
                  <button 
                    key={s}
                    onClick={() => handleInputChange('statusPembayaran', s)}
                    className={cn(
                      "flex-1 py-4 px-6 rounded-2xl border-2 transition-all font-bold text-[10px] tracking-widest uppercase boutique-choice",
                      formData.statusPembayaran === s
                        ? "bg-brand-black text-brand-gold border-brand-black shadow-lg" 
                        : "border-brand-cream hover:border-brand-gold text-brand-black/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <InputWrapper label="Nominal Pembayaran (Rp)" icon={<Plus size={14} />}>
                <input 
                  type="text" 
                  className="form-input text-lg font-bold" 
                  value={formatNominalInput(formData.nominalPembayaran.toString())} 
                  onChange={(e) => handleNominalChange(e.target.value)}
                  placeholder="Contoh: 500.000"
                />
              </InputWrapper>
              {formData.statusPembayaran === PaymentStatus.DP && (
                <p className="text-[10px] font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 italic">
                  Sisa yang harus dibayar: Rp {sisaPembayaran.toLocaleString('id-ID')}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-2 block">Metode Pembayaran</label>
              <div className="relative group">
                <div className="p-8 border-2 border-dashed border-brand-gold/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-default hover:bg-brand-gold/5 transition-all group-hover:border-brand-gold shadow-sm">
                  <CreditCard className="text-brand-gold/40 mb-2" size={32} />
                  <span className="text-sm font-serif font-bold italic tracking-wide">
                    {formData.metodePembayaran || "Hover & Pilih Metode"}
                  </span>
                  {formData.metodePembayaran && (
                    <span className="text-[10px] text-brand-black/40 mt-1 uppercase tracking-tighter">Selected</span>
                  )}
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all scale-95 group-hover:scale-100 duration-300">
                  <div className="bg-white p-4 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.25)] border-2 border-brand-gold space-y-2">
                    {PAYMENT_METHODS.map(m => (
                      <button 
                        key={m.label} 
                        onClick={() => handleInputChange('metodePembayaran', m.label)}
                        className={cn(
                          "w-full text-left p-3 hover:bg-brand-gold/10 rounded-2xl transition-all cursor-pointer boutique-choice flex flex-col border border-transparent",
                          formData.metodePembayaran === m.label ? "bg-brand-gold/10 border-brand-gold/20" : ""
                        )}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">{m.label}</span>
                        <span className="text-[8px] text-brand-black/40">{m.info}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )}

        {/* SECTION: SUMMARY & SUBMIT */}
        {!isPreviewMode ? (
          <div className="premium-card space-y-8">
             <div className="space-y-4">
                <h3 className="text-xs font-black text-brand-gold uppercase tracking-[0.3em]">Konfirmasi Pesanan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <label className="flex items-center gap-3 cursor-pointer group p-4 border border-brand-cream rounded-xl hover:bg-brand-gold/5 transition-all">
                     <input type="checkbox" className="form-checkbox" checked={formData.persetujuan.ukuranBenar} onChange={(e) => setFormData(p => ({ ...p, persetujuan: { ...p.persetujuan, ukuranBenar: e.target.checked } }))} />
                     <span className="text-[10px] font-bold uppercase text-brand-black/60 group-hover:text-brand-gold">Ukuran data sudah benar</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group p-4 border border-brand-cream rounded-xl hover:bg-brand-gold/5 transition-all">
                     <input type="checkbox" className="form-checkbox" checked={formData.persetujuan.warnaBerbeda} onChange={(e) => setFormData(p => ({ ...p, persetujuan: { ...p.persetujuan, warnaBerbeda: e.target.checked } }))} />
                     <span className="text-[10px] font-bold uppercase text-brand-black/60 group-hover:text-brand-gold">Warna di foto bisa berbeda dikit dengan kain asli</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group p-4 border border-brand-cream rounded-xl hover:bg-brand-gold/5 transition-all">
                     <input type="checkbox" className="form-checkbox" checked={formData.persetujuan.produksiSetelahDP} onChange={(e) => setFormData(p => ({ ...p, persetujuan: { ...p.persetujuan, produksiSetelahDP: e.target.checked } }))} />
                     <span className="text-[10px] font-bold uppercase text-brand-black/60 group-hover:text-brand-gold">Produksi mulai setelah DP 50%</span>
                   </label>
                   <label className="flex items-center gap-3 cursor-pointer group p-4 border border-brand-cream rounded-xl hover:bg-brand-gold/5 transition-all">
                     <input type="checkbox" className="form-checkbox" checked={formData.persetujuan.biayaPerubahan} onChange={(e) => setFormData(p => ({ ...p, persetujuan: { ...p.persetujuan, biayaPerubahan: e.target.checked } }))} />
                     <span className="text-[10px] font-bold uppercase text-brand-black/60 group-hover:text-brand-gold">Perubahan model setelah potong kain dikenakan biaya tambahan</span>
                   </label>
                </div>
             </div>

             <div className="pt-6 border-t border-brand-cream">
                <button 
                  onClick={() => {
                    setIsPreviewMode(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  disabled={
                    !formData.persetujuan.ukuranBenar || 
                    !formData.persetujuan.produksiSetelahDP || 
                    !formData.persetujuan.warnaBerbeda || 
                    !formData.persetujuan.biayaPerubahan ||
                    !formData.namaPemesan ||
                    !formData.whatsapp
                  }
                  className="w-full py-5 bg-brand-black text-brand-gold rounded-2xl flex items-center justify-center gap-3 font-serif font-bold italic text-lg shadow-xl hover:scale-[1.01] active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
                >
                  <CheckCircle2 size={24} /> Submit & Lihat Hasil Akhir
                </button>
             </div>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card !p-0 border-4 border-brand-gold overflow-hidden bg-white shadow-[0_0_100px_rgba(212,175,55,0.2)]"
          >
             <div className="bg-brand-black text-white p-10 text-center border-b-4 border-brand-gold relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <h2 className="text-4xl font-serif font-bold italic tracking-[0.2em] uppercase relative z-10">PESANAN TERKONFIRMASI</h2>
                <div className="flex items-center justify-center gap-4 mt-2 relative z-10">
                   <div className="h-[1px] w-12 bg-brand-gold/40"></div>
                   <p className="text-[10px] font-mono tracking-[0.5em] text-brand-gold uppercase">OFFICIAL ZALEMIKA ORDER SHEET</p>
                   <div className="h-[1px] w-12 bg-brand-gold/40"></div>
                </div>
             </div>

             <div ref={finalSummaryRef} className="p-12 space-y-12 bg-white printable-area">
                <div className="flex justify-between items-start border-b-2 border-brand-cream pb-8">
                   <div>
                      <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-3">DATA PEMESAN</h4>
                      <div className="space-y-1">
                         <p className="text-2xl font-serif font-bold text-brand-black uppercase">{formData.namaPemesan}</p>
                         <p className="text-lg font-serif italic text-brand-black/60">{formData.namaGrup || 'Personal'}</p>
                         <p className="text-sm font-mono text-brand-gold">{formData.whatsapp}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-3">TANGGAL ORDER</h4>
                      <p className="text-xl font-mono font-bold">{format(new Date(), 'dd / MM / yyyy')}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-black/40 mt-1">CODE: ZLMK-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.4em] border-l-4 border-brand-gold pl-4">Spesifikasi Model</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <SummaryItem label="Jenis" value={formData.jenisSeragam.join(", ")} />
                         <SummaryItem label="Tema" value={formData.temaModel} />
                         <SummaryItem label="Lengan" value={formData.modelLengan} />
                         <SummaryItem label="Kerah" value={formData.modelKerah} />
                         <SummaryItem label="Bahan" value={formData.bahan} />
                         <SummaryItem label="Warna" value={formData.warnaUtama} />
                         <SummaryItem label="Rok/Celana" value={formData.modelRokCelana || '-'} />
                         <div className="col-span-2">
                            <SummaryItem label="Fitur" value={formData.fiturTambahan.join(", ") || '-'} />
                         </div>
                      </div>
                   </div>
                   <div className="space-y-6">
                      <h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.4em] border-l-4 border-brand-gold pl-4">Waktu & Pengiriman</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <SummaryItem label="Target Dijemput" value={formData.tanggalDipakai} />
                         <SummaryItem label="Deadline Acara" value={formData.deadlineAcara} />
                         <SummaryItem label="Metode Kirim" value={formData.pengiriman} />
                         <SummaryItem label="Alamat" value={`${formData.alamatLengkap}, ${formData.kotaKabupaten}`} />
                      </div>
                   </div>
                </div>

                {/* TABLE RINCIAN PESANAN */}
                <div className="space-y-6">
                   <h4 className="text-xs font-black text-brand-gold uppercase tracking-[0.4em] border-l-4 border-brand-gold pl-4">Rincian Pesanan & Pembayaran</h4>
                   <div className="overflow-hidden rounded-2xl border-2 border-brand-cream/50 bg-white">
                      <table className="w-full text-left border-collapse">
                         <thead>
                            <tr className="bg-brand-black text-brand-gold">
                               <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest">Kategori</th>
                               <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-center">Jumlah</th>
                               <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-right">Harga Satuan</th>
                               <th className="py-4 px-6 text-[10px] font-bold uppercase tracking-widest text-right">Subtotal</th>
                            </tr>
                         </thead>
                         <tbody className="text-brand-black">
                            {formData.jumlahDewasa > 0 && (
                               <tr className="border-b border-brand-cream">
                                  <td className="py-4 px-6 font-serif font-bold italic">Dewasa</td>
                                  <td className="py-4 px-6 text-center font-mono">{formData.jumlahDewasa} Pcs</td>
                                  <td className="py-4 px-6 text-right font-mono text-xs">Rp {formData.hargaDewasa.toLocaleString('id-ID')}</td>
                                  <td className="py-4 px-6 text-right font-mono font-bold">Rp {(formData.jumlahDewasa * formData.hargaDewasa).toLocaleString('id-ID')}</td>
                               </tr>
                            )}
                            {formData.jumlahAnak > 0 && (
                               <tr className="border-b border-brand-cream">
                                  <td className="py-4 px-6 font-serif font-bold italic">Anak-Anak</td>
                                  <td className="py-4 px-6 text-center font-mono">{formData.jumlahAnak} Pcs</td>
                                  <td className="py-4 px-6 text-right font-mono text-xs">Rp {formData.hargaAnak.toLocaleString('id-ID')}</td>
                                  <td className="py-4 px-6 text-right font-mono font-bold">Rp {(formData.jumlahAnak * formData.hargaAnak).toLocaleString('id-ID')}</td>
                               </tr>
                            )}
                            {formData.dataUkuranCustom.length > 0 && (
                               <tr className="border-b border-brand-cream">
                                  <td className="py-4 px-6 font-serif font-bold italic">Custom Size</td>
                                  <td className="py-4 px-6 text-center font-mono">{formData.dataUkuranCustom.length} Orang</td>
                                  <td className="py-4 px-6 text-right font-mono text-xs">Rp {formData.hargaCustom.toLocaleString('id-ID')}</td>
                                  <td className="py-4 px-6 text-right font-mono font-bold">Rp {(formData.dataUkuranCustom.length * formData.hargaCustom).toLocaleString('id-ID')}</td>
                               </tr>
                            )}
                            <tr className="bg-brand-gold/5">
                               <td colSpan={3} className="py-6 px-6 text-right text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">Total Tagihan</td>
                               <td className="py-6 px-6 text-right text-2xl font-mono font-black text-brand-black">Rp {grandTotal.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr className="border-t-2 border-brand-gold/20">
                               <td colSpan={3} className="py-4 px-6 text-right text-[10px] font-bold uppercase tracking-widest text-brand-black/40">Nominal Terbayar ({formData.statusPembayaran})</td>
                               <td className="py-4 px-6 text-right font-mono font-bold text-lg">Rp {formData.nominalPembayaran.toLocaleString('id-ID')}</td>
                            </tr>
                            {formData.statusPembayaran === PaymentStatus.DP && (
                               <tr className="bg-red-50">
                                  <td colSpan={3} className="py-4 px-6 text-right text-[10px] font-black uppercase tracking-widest text-red-600">Sisa Tagihan Pelunasan</td>
                                  <td className="py-4 px-6 text-right font-mono font-bold text-xl text-red-600 underline">Rp {sisaPembayaran.toLocaleString('id-ID')}</td>
                               </tr>
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-brand-cream">
                   <div className="space-y-2">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-brand-black/40 mb-3">Metode Pembayaran</p>
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-brand-black text-brand-gold rounded-xl"><CreditCard size={20} /></div>
                          <div>
                             <p className="text-lg font-serif font-bold italic">{formData.metodePembayaran}</p>
                             <p className="text-[9px] font-bold text-brand-gold uppercase tracking-widest">Konfirmasi via WA Zalemika</p>
                          </div>
                       </div>
                   </div>
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.3em] mb-2">CATATAN KHUSUS</h4>
                      <p className="text-xs italic leading-relaxed text-brand-black/80">{formData.catatanTambahan || '"Tidak ada catatan khusus"'}</p>
                   </div>
                </div>

                {/* SIGNATURE SECTION */}
                <div className="pt-20 grid grid-cols-2 gap-20">
                   <div className="text-center space-y-24">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-black/40">Admin Zalemika</p>
                      <div className="border-b border-brand-black/30 w-full mx-auto"></div>
                   </div>
                   <div className="text-center space-y-6">
                      <p className="text-[10px] font-bold italic text-brand-gold">{formData.kotaKabupaten}, {format(new Date(), 'dd MMMM yyyy')}</p>
                      <div className="space-y-24">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-black/40">Pemesan / Customer</p>
                        <div className="border-b border-brand-black/30 w-full mx-auto"></div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 bg-brand-black/5 flex flex-wrap gap-4 justify-center items-center">
                <button 
                  onClick={exportWord}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl"
                >
                  <FileText size={20} /> Simpan ke Word (A4)
                </button>
                
                <button 
                  onClick={exportJPEG}
                  className="px-8 py-4 bg-purple-600 text-white rounded-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-widest hover:bg-purple-700 transition-all shadow-xl"
                >
                  <Download size={20} /> Simpan sebagai Gambar (JPEG)
                </button>

                <button 
                  onClick={() => setIsPreviewMode(false)}
                  className="px-8 py-4 bg-white border-2 border-brand-cream text-brand-black/60 rounded-2xl flex items-center gap-3 font-bold text-xs uppercase tracking-widest hover:bg-brand-cream transition-all shadow-lg"
                >
                  <ChevronRight size={20} className="rotate-180" /> Kembali Edit
                </button>
             </div>

             <div className="p-12 flex flex-col items-center gap-6 bg-brand-gold/10 rounded-b-[40px]">
                <div className="text-center">
                  <h5 className="text-sm font-serif font-bold italic mb-2">Siap Kirim Pesanan?</h5>
                  <p className="text-[10px] text-brand-black/60 uppercase tracking-widest max-w-sm mx-auto">Data akan dikirimkan ke Admin Zalemika untuk proses produksi</p>
                </div>
                <button 
                  onClick={generateWhatsAppMessage}
                  className="px-12 py-5 bg-[#25D366] text-white rounded-2xl flex items-center gap-4 font-serif font-bold italic text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={28} /> Kirim ke WhatsApp
                </button>
             </div>
          </motion.div>
        )}

      </main>

      <footer className="mt-24 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="text-4xl font-serif font-bold italic text-brand-black/5 mb-2">Zalemika</div>
          <p className="text-[9px] font-bold tracking-[0.5em] uppercase text-brand-black/20">Excellence in Every Stitch</p>
        </div>
      </footer>

      {/* Floating Scroll Top Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 p-4 bg-brand-black text-brand-gold rounded-full shadow-2xl hover:bg-brand-gold hover:text-white transition-all z-50 border border-brand-gold/30"
      >
        <ChevronRight size={22} className="-rotate-90" />
      </button>
    </div>
  );
}

function InputWrapper({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-[10px] font-bold text-brand-black/60 uppercase tracking-[0.2em] ml-1">
        <span className="text-brand-gold">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 p-3 bg-brand-cream/5 rounded-xl border border-brand-cream/20">
       <h5 className="text-[8px] font-bold uppercase tracking-[0.2em] text-brand-gold/80">{label}</h5>
       <p className="text-[11px] font-bold text-brand-black leading-tight">{value || '-'}</p>
    </div>
  );
}
