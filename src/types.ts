export enum UniformType {
  SeragamPesta = "Seragam Pesta",
  SeragamPengajian = "Seragam Pengajian",
  SeragamReuni = "Seragam Reuni",
  SeragamKantor = "Seragam Kantor",
  SeragamKerja = "Seragam Kerja",
  CoupleSuamiIstri = "Couple Suami Istri",
  FamilySet = "Family Set",
  Bridesmaid = "Bridesmaid",
  Gamis = "Gamis",
  Dress = "Dress",
  Kaos = "Kaos",
  Kemeja = "Kemeja",
  Lainnya = "Lainnya"
}

export enum SleeveModel {
  LenganPanjang = "Lengan Panjang",
  LenganPendek = "Lengan Pendek",
  LenganTigaPerEmpat = "Lengan 3/4",
  LenganBalon = "Lengan Balon",
  LenganLonceng = "Lengan Lonceng",
  TanpaLengan = "Tanpa Lengan"
}

export enum CollarModel {
  KerahKemeja = "Kerah Kemeja",
  KerahSanghai = "Kerah Sanghai",
  KerahV = "Kerah V",
  KerahBulat = "Kerah Bulat",
  KerahRebah = "Kerah Rebah"
}

export enum FabricType {
  Wolfis = "Wolfis",
  Ceruty = "Ceruty",
  ArmaniSilk = "Armani Silk",
  Balotelli = "Balotelli",
  Toyobo = "Toyobo",
  Drill = "Drill",
  Katun = "Katun",
  Jersey = "Jersey",
  Lainnya = "Lainnya"
}

export enum ShippingMethod {
  AmbilLangsung = "Ambil Langsung",
  Dikirim = "Dikirim"
}

export enum PaymentStatus {
  DP = "DP",
  Lunas = "Lunas"
}

export enum PaymentMethod {
  TransferBank = "Transfer Bank",
  QRIS = "QRIS",
  GoPay = "GoPay",
  Dana = "Dana",
  Cash = "Cash"
}

export interface CustomSize {
  name: string;
  lingkarDada: string;
  lingkarPinggang: string;
  lingkarPinggul: string;
  lebarBahu: string;
  panjangTangan: string;
  panjangBaju: string;
  tinggiBadan: string;
  beratBadan: string;
}

export interface FormData {
  // Section 1
  namaPemesan: string;
  namaGrup: string;
  whatsapp: string;
  email: string;
  alamatLengkap: string;
  kotaKabupaten: string;
  tanggalPemesanan: string;

  // Section 2
  jenisSeragam: UniformType[];
  jenisSeragamLainnya: string;

  // Section 3
  temaModel: string;
  modelLengan: SleeveModel;
  modelKerah: CollarModel;
  modelRokCelana: string;
  catatanTambahan: string;
  fiturTambahan: string[]; // Bordir Nama, etc.
  referensiFoto: string[]; // Base64 or URLs

  // Section 4
  warnaUtama: string;
  warnaKombinasi: string;
  kodeWarna: string;
  bahan: FabricType;
  bahanLainnya: string;

  // Section 5
  jumlahDewasa: number;
  jumlahAnak: number;
  hargaDewasa: number;
  hargaAnak: number;
  hargaCustom: number;

  // Section 6
  pilihanUkuran: "Size Chart" | "Custom";
  dataUkuranCustom: CustomSize[];

  // Section 7
  tanggalDipakai: string;
  deadlineAcara: string;
  estimasiSelesai: string;

  // Section 8
  pengiriman: ShippingMethod;
  alamatPengiriman: string;
  ekspedisi: string;
  catatanKurir: string;

  // Section 9
  statusPembayaran: PaymentStatus;
  nominalPembayaran: number;
  metodePembayaran: PaymentMethod;

  // Section 10
  persetujuan: {
    ukuranBenar: boolean;
    warnaBerbeda: boolean;
    produksiSetelahDP: boolean;
    biayaPerubahan: boolean;
  };
}
