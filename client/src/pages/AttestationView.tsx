import { useRoute } from "wouter";
import { attestations } from "@/data/attestations";
import AttestationDocument from "@/components/AttestationDocument";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { AttestationData } from "@/data/attestations";

type Language = "pt" | "en";

const labels = {
  pt: {
    notFound: "Atestado não encontrado",
    notFoundDesc: "O atestado solicitado não existe.",
    loading: "Carregando...",
    back: "← Voltar",
    code: "Código",
    print: "Imprimir",
    downloadPdf: "Baixar PDF",
    downloading: "Baixando...",
    validateQr: "Validar QR Code",
    goHome: "Voltar para Home",
  },
  en: {
    notFound: "Certificate not found",
    notFoundDesc: "The requested certificate does not exist.",
    loading: "Loading...",
    back: "← Back",
    code: "Code",
    print: "Print",
    downloadPdf: "Download PDF",
    downloading: "Downloading...",
    validateQr: "Validate QR Code",
    goHome: "Go to Home",
  },
};

export default function AttestationView() {
  const [, params] = useRoute("/atestado/:id");
  const id = params?.id as string;
  const { language, setLanguage } = useLanguageWithSetter();
  const documentRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const t = labels[language];

  // Try to load from API first, fallback to local data
  useEffect(() => {
    async function loadAttestation() {
      setIsLoading(true);
      setNotFound(false);

      // First check local data (for backward compatibility with /atestado/lucas, /atestado/thielsily)
      if (attestations[id]) {
        setAttestation(attestations[id]);
        setIsLoading(false);
        return;
      }

      // Try API by ID (validation code)
      try {
        const response = await fetch(`/api/attestations/${encodeURIComponent(id)}`);
        const result = await response.json();
        if (result.success && result.data) {
          setAttestation(result.data);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("API error:", err);
      }

      setNotFound(true);
      setIsLoading(false);
    }

    loadAttestation();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <p className="text-gray-600 text-lg">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (notFound || !attestation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">{t.notFound}</h1>
          <p className="text-gray-600 mb-6">{t.notFoundDesc}</p>
          <Link href="/">
            <Button className="w-full">{t.goHome}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;

    setIsDownloading(true);

    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;

      pdf.addImage(imgData, "PNG", imgX, 0, imgWidth * ratio, imgHeight * ratio);

      const nomeFormatado = attestation.paciente
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_");
      pdf.save(`ATESTADO_${nomeFormatado}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
      const originalTitle = document.title;
      document.title = `ATESTADO_${attestation.paciente.replace(/\s+/g, "_")}.pdf`;
      window.print();
      document.title = originalTitle;
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white">
      <div className="max-w-4xl mx-auto print:max-w-none">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 border-b border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{attestation.paciente}</h1>
              <p className="text-gray-600 mt-1">{t.code}: {attestation.codigoQR}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <Button
                  variant={language === "pt" ? "default" : "outline"}
                  onClick={() => setLanguage("pt")}
                  className="text-xs h-8 px-3"
                >
                  PT-BR
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => setLanguage("en")}
                  className="text-xs h-8 px-3"
                >
                  EN
                </Button>
              </div>
              <Link href="/">
                <Button variant="outline">{t.back}</Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Document */}
        <div className="bg-white shadow-lg p-8 print:shadow-none print:p-0">
          <div ref={documentRef}>
            <AttestationDocument data={attestation} logoUrl={(attestation as any).logoUrl} />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-b-lg shadow-lg p-6 border-t border-gray-200 print:hidden">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <span>🖨</span> {t.print}
            </Button>
            <Button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <span>⬇</span> {isDownloading ? t.downloading : t.downloadPdf}
            </Button>
            <Link href={`/validar`}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                <span>✓</span> {t.validateQr}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
