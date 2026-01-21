export interface Product {
  id?: string;
  code13?: string | null;
  name: string; // "name" is common
  quantity?: string | number | null;
  expirationDate?: string | null;
  lot?: string | null; // Used in raw AI extraction
  lotNumber?: string | null; // Used in DB
  rotation_mensuelle?: string | null;
  prix_sans_remise?: string | null;
  remise?: string | null;
  prix_remisee?: string | null;
  prix_remisee?: string | null;
  createdAt?: string | Date;
}

export interface ExtractedData {
  products: Product[];
}

export interface Invoice {
  id: string;
  filename: string;
  uploadDate: string | Date;
  products: Product[];
}
