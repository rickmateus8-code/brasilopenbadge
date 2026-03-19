import { useRoute } from "wouter";
import { attestations } from "@/data/attestations";
import AttestationDocument from "@/components/AttestationDocument";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useRef } from "react";

export default function AttestationView() {
  const [, params] = useRoute("/atestado/:id");
  const id = params?.id as string;
  const { language, setLanguage } = useLanguageWithSetter();
  const documentRef = useRef<HTMLDivElement>(null);

  const attestation = attestations[id];

  if (!attestation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Atestado não encontrado</h1>
          <p className="text-gray-600 mb-6">O atestado solicitado não existe.</p>
          <Link href="/">
            <Button className="w-full">Voltar para Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = () => {
    const originalTitle = document.title;
    document.title = `ATESTADO_${attestation.paciente.replace(/\s+/g, "_")}.pdf`;
    window.print();
    document.title = originalTitle;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto print:max-w-none">
        {/* Header - Hidden on print */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 border-b border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{attestation.paciente}</h1>
              <p className="text-gray-600 mt-1">Código: {attestation.codigoQR}</p>
            </div>
            <Link href="/">
              <Button variant="outline">← Voltar</Button>
            </Link>
          </div>
        </div>

        {/* Document - Visible on print */}
        <div className="bg-white shadow-lg p-8 print:shadow-none print:p-0">
          <AttestationDocument ref={documentRef} data={attestation} logoUrl={attestation.logoUrl} />
        </div>

        {/* Language Selector - Hidden on print */}
        <div className="bg-white shadow-lg p-4 border-t border-gray-200 flex justify-end gap-2 print:hidden">
          <Button
            variant={language === "pt" ? "default" : "outline"}
            onClick={() => setLanguage("pt")}
            className="text-sm"
          >
            PT-BR
          </Button>
          <Button
            variant={language === "en" ? "default" : "outline"}
            onClick={() => setLanguage("en")}
            className="text-sm"
          >
            EN
          </Button>
        </div>

        {/* Actions - Hidden on print */}
        <div className="bg-white rounded-b-lg shadow-lg p-6 border-t border-gray-200 flex gap-4 justify-center print:hidden">
          <Button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <span>🖨</span> Imprimir
          </Button>
          <Button
            onClick={handleDownloadPDF}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
          >
            <span>⬇</span> Baixar PDF
          </Button>
          <Link href={`/validar?codigo=${attestation.codigoQR}&data=2026-03-16`}>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
              <span>✓</span> Validar QR Code
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
