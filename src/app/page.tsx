'use client';

import { useState } from 'react';
import { ExtractedData, Product } from '@/types';
import SyncEmailButton from '@/components/SyncEmailButton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      resetState();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      resetState();
    }
  };

  const resetState = () => {
    setError(null);
    setUploadUrl(null);
    setExtractedData(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    resetState();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Une erreur est survenue');
      }

      setUploadUrl(data.url);
      setExtractedData(data.data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur inattendue est survenue');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 md:p-12 max-w-7xl mx-auto w-full animate-fade-in space-y-12">
      
      {/* Hero Section */}
      <section className="text-center space-y-6 pt-10">
        <Badge variant="default" className="mb-4">v2.0 • Nouvelle Architecture IA</Badge>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-2">
          Gérez vos <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-600">Péremptions</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Importez vos factures, laissez l&apos;IA extraire les données, et suivez vos stocks en temps réel. 
          Une solution moderne pour les pharmaciens exigeants.
        </p>

        <div className="flex items-center justify-center gap-4 pt-4">
           {/* Navigation removed */}
        </div>
      </section>

      {/* Upload Zone */}
      <Card className="w-full max-w-2xl mx-auto glass-card relative overflow-hidden group border-border/50 bg-background/50 dark:bg-zinc-900/50">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="flex justify-between items-center mb-8 border-b border-border/40 pb-4">
            <h2 className="text-xl font-semibold text-foreground">Zone d&apos;Extraction</h2>
            <SyncEmailButton />
        </div>
        
        <form onSubmit={handleUpload} className="space-y-6 relative z-10" onDragEnter={handleDrag}>
          <div 
             className={`
               relative flex flex-col items-center justify-center w-full h-48 
               border-2 border-dashed rounded-xl transition-all duration-300 ease-out
               ${dragActive 
                 ? "border-primary bg-primary/5 scale-[1.02]" 
                 : "border-border hover:border-primary/50 bg-muted/30 hover:bg-muted/50"
               }
             `}
             onDragEnter={handleDrag}
             onDragLeave={handleDrag}
             onDragOver={handleDrag}
             onDrop={handleDrop}
          >
            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                    {file ? (
                        <div className="flex flex-col items-center animate-fade-in">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="text-sm text-foreground font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 p-3 rounded-full bg-muted">
                              <svg className="w-6 h-6 text-muted-foreground" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-foreground">Cliquez pour déposer</span> ou glissez un fichier</p>
                            <p className="text-xs text-muted-foreground">PDF, Images (MAX. 10MB)</p>
                        </>
                    )}
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,image/*" />
            </label>
          </div> 

          <Button 
            type="submit" 
            disabled={!file || uploading} 
            className="w-full h-12 text-base font-semibold"
            variant="primary"
            isLoading={uploading}
          >
            {uploading ? 'Analyse IA en cours...' : 'Lancer l&apos;Extraction'}
          </Button>
        </form>

        {error && (
          <div className="mt-6 p-4 text-sm text-red-600 dark:text-red-200 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/20 flex items-center gap-3" role="alert">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </Card>

      {/* Results Section */}
      {extractedData && extractedData.products && (
          <div className="w-full animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Résultats d&apos;Extraction</h2>
                <Badge variant="success">Succès</Badge>
              </div>
              
              <div className="glass-panel rounded-xl overflow-hidden border border-border/50 bg-background/50 dark:bg-zinc-900/50">
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-muted-foreground">
                          <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                              <tr>
                                  <th scope="col" className="px-6 py-4 font-medium">Code 13</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Produit</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Quantité</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Rotation</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Prix HT</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Remise</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Prix Net</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Expiration</th>
                                  <th scope="col" className="px-6 py-4 font-medium">Lot</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-border/50">
                              {extractedData.products.map((product: Product, index: number) => (
                                  <tr key={index} className="hover:bg-muted/10 transition-colors">
                                      <td className="px-6 py-4 font-mono text-muted-foreground">{product.code13 || '-'}</td>
                                      <td className="px-6 py-4 text-foreground font-medium">{product.name}</td>
                                      <td className="px-6 py-4 text-foreground">{product.quantity}</td>
                                      <td className="px-6 py-4 text-muted-foreground">{product.rotation_mensuelle || '-'}</td>
                                      <td className="px-6 py-4 text-muted-foreground">{product.prix_sans_remise || '-'}</td>
                                      <td className="px-6 py-4 text-muted-foreground">{product.remise || '-'}</td>
                                      <td className="px-6 py-4 text-foreground font-medium">{product.prix_remisee || '-'}</td>
                                      <td className="px-6 py-4">
                                        {product.expirationDate ? (
                                          <Badge variant="warning">{product.expirationDate}</Badge>
                                        ) : '-'}
                                      </td>
                                      <td className="px-6 py-4 font-mono">{product.lot || '-'}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {uploadUrl && (
                  <div className="mt-6 flex justify-end">
                       <a href={uploadUrl} target="_blank" rel="noopener noreferrer">
                         <Button variant="outline" size="sm">
                             Voir le document source &rarr;
                         </Button>
                       </a>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}

