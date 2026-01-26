'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function CatalogPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
      setStatus('idle');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage('Traitement en cours...');
    setStatus('idle');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/catalog/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message);
        setFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setStatus('error');
        setMessage(data.message || 'Une erreur est survenue.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Erreur technique lors de l\'envoi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto w-full animate-fade-in space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">Import Catalogue</h1>
          <p className="text-muted-foreground">Mettez à jour les stocks et rotations via CSV.</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="border-border text-muted-foreground hover:text-foreground">
            ← Accueil
          </Button>
        </Link>
      </header>
      
      <Card className="p-8 border-indigo-500/20 bg-muted/10">
        <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">Fichier CSV</label>
                <div className="flex items-center justify-center w-full">
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-gray-600 bg-background/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            <p className="mb-2 text-sm text-gray-400">
                                {file ? (
                                    <span className="font-semibold text-indigo-400">{file.name}</span>
                                ) : (
                                    <><span className="font-semibold">Cliquez pour upload</span></>
                                )}
                            </p>
                            <p className="text-xs text-gray-500">CSV uniquement (EAN, Nom, Stock, Rotation)</p>
                        </div>
                        <input id="dropzone-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                    </label>
                </div> 
            </div>

            {message && (
                <div className={`p-4 rounded-lg text-sm ${
                    status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                    status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                }`}>
                    {message}
                </div>
            )}

            <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
                disabled={!file || uploading}
            >
                {uploading ? 'Importation en cours...' : 'Importer le catalogue'}
            </Button>
        </form>
      </Card>

      <div className="bg-muted/30 p-4 rounded-lg text-sm text-muted-foreground">
          <h3 className="font-semibold mb-2 text-foreground">Format attendu (CSV) :</h3>
          <ul className="list-disc pl-5 space-y-1">
              <li>Colonnes : EAN, Nom, Stock, Rotation</li>
              <li>Séparateur : Virgule (,) ou Point-virgule (;)</li>
              <li>Rotation "N/A" sera converti en 0</li>
              <li>Le nom du fichier n'a pas d'importance</li>
          </ul>
      </div>
    </div>
  );
}
