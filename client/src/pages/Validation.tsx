import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attestations } from "@/data/attestations";
import AttestationDocument from "@/components/AttestationDocument";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { useParams } from "wouter";

type Language = "pt" | "en";

const labels = {
  pt: {
    title: "Validador Oficial",
    queryDocument: "Consultar Documento",
    authenticationCode: "Código de Autenticação",
    issueDate: "Data de Emissão",
    validateDocument: "VALIDAR DOCUMENTO",
    verifying: "Verificando...",
    clear: "LIMPAR",
    validAndAuthentic: "VÁLIDO E AUTÊNTICO",
    documentValid: "Documento é válido e autêntico",
    invalid: "INVÁLIDO",
    documentNotFound: "Documento não encontrado ou dados inválidos",
    downloadPdf: "BAIXAR PDF",
    officialValidation: "Validação Oficial de Atestados Médicos",
    patient: "Paciente",
  },
  en: {
    title: "Official Validator",
    queryDocument: "Query Document",
    authenticationCode: "Authentication Code",
    issueDate: "Issue Date",
    validateDocument: "VALIDATE DOCUMENT",
    verifying: "Verifying...",
    clear: "CLEAR",
    validAndAuthentic: "VALID AND AUTHENTIC",
    documentValid: "Document is valid and authentic",
    invalid: "INVALID",
    documentNotFound: "Document not found or invalid data",
    downloadPdf: "DOWNLOAD PDF",
    officialValidation: "Official Validation of Medical Certificates",
    patient: "Patient",
  },
};

export default function Validation() {
  const params = useParams();
  const [codigo, setCodigo] = useState(params.id || "");
  const [data, setData] = useState(params.id ? "2026-03-16" : "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    attestation?: any;
  } | null>(null);
  const { language, setLanguage } = useLanguageWithSetter();

  const t = labels[language];

  const handleValidate = async (codeToUse = codigo, dateToUse = data) => {
    setIsValidating(true);
    setValidationResult(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const attestation = Object.values(attestations).find((a) => a.codigoQR === codeToUse);

    if (attestation && dateToUse === "2026-03-16") {
      setValidationResult({
        valid: true,
        message: t.documentValid,
        attestation,
      });
    } else {
      setValidationResult({
        valid: false,
        message: t.documentNotFound,
      });
    }

    setIsValidating(false);
  };

  useEffect(() => {
    if (params.id) {
      handleValidate(params.id, "2026-03-16");
    }
  }, [params.id]);

  const handleClear = () => {
    setCodigo("");
    setData("");
    setValidationResult(null);
  };

  const handleDownloadPDF = () => {
    if (validationResult?.attestation) {
      const originalTitle = document.title;
      document.title = `ATESTADO_${validationResult.attestation.paciente.replace(/\s+/g, "_")}.pdf`;
      window.print();
      document.title = originalTitle;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Header - Centralizado e Responsivo */}
      <div className="bg-blue-600 text-white py-4 sm:py-6 px-4 sm:px-6 rounded-t-lg max-w-4xl mx-auto print:hidden">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Logo + Title - Centralizado */}
          <div className="flex items-center justify-center gap-2">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 font-bold text-sm">✓</span>
            </div>
            <span className="font-bold text-lg text-center">{t.title}</span>
          </div>

          {/* Language Buttons */}
          <div className="flex gap-2 sm:absolute sm:right-8">
            <Button
              variant={language === "pt" ? "default" : "outline"}
              onClick={() => setLanguage("pt")}
              className={`text-xs h-8 px-3 border-white ${language === "pt" ? "bg-white text-blue-600" : "bg-transparent hover:bg-white/20"}`}
            >
              PT-BR
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              onClick={() => setLanguage("en")}
              className={`text-xs h-8 px-3 border-white ${language === "en" ? "bg-white text-blue-600" : "bg-transparent hover:bg-white/20"}`}
            >
              EN
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white max-w-4xl mx-auto p-4 sm:p-8 shadow-lg print:shadow-none print:p-0 relative">
        {!validationResult ? (
          <div className="space-y-6 print:hidden">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">{t.queryDocument}</h2>

            <div className="space-y-4 max-w-lg mx-auto">
              <div>
                <label className="block text-sm font-semibold mb-2">{t.authenticationCode}</label>
                <Input
                  id="codigo"
                  placeholder="XXXX.XXXX"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  className="text-center font-mono text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{t.issueDate}</label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="text-center text-sm sm:text-base"
                />
              </div>

              <Button
                onClick={() => handleValidate()}
                disabled={!codigo || !data || isValidating}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 font-semibold text-sm sm:text-base"
              >
                {isValidating ? t.verifying : t.validateDocument}
              </Button>

              <Button
                onClick={handleClear}
                variant="outline"
                className="w-full py-3 text-sm sm:text-base"
              >
                {t.clear}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Validation Result Box */}
            <div className="print:hidden">
              {validationResult.valid ? (
                <div className="bg-green-50 border-2 border-green-600 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✓</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-green-700">{t.validAndAuthentic}</h3>
                  </div>
                  <p className="text-green-800 text-sm sm:text-base">{validationResult.message}</p>
                  {validationResult.attestation && (
                    <p className="mt-2 font-semibold text-green-900 text-sm sm:text-base">
                      {t.patient}: {validationResult.attestation.paciente}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border-2 border-red-600 rounded-lg p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">✕</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-red-700">{t.invalid}</h3>
                  </div>
                  <p className="text-red-800 text-sm sm:text-base">{validationResult.message}</p>
                </div>
              )}
            </div>

            {/* Document Preview / Print Area */}
            {validationResult.attestation && (
              <div className="border-2 border-gray-300 rounded-lg p-2 sm:p-4 max-h-[600px] sm:max-h-[700px] overflow-y-auto bg-gray-50 print:border-none print:p-0 print:max-h-none print:overflow-visible print:bg-white">
                <div className="transform scale-[0.65] sm:scale-[0.85] lg:scale-100 origin-top print:scale-100">
                  <AttestationDocument data={validationResult.attestation} logoUrl={validationResult.attestation.logoUrl} />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 print:hidden">
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 py-3 text-sm sm:text-base"
              >
                {t.clear}
              </Button>
              {validationResult.valid && (
                <Button
                  onClick={handleDownloadPDF}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <span>⬇</span> {t.downloadPdf}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-b-lg max-w-4xl mx-auto mt-0 print:hidden">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs sm:text-sm text-center">{t.officialValidation}</span>
        </div>
      </div>
    </div>
  );
}
