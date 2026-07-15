import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import CertificadoFGVDocument from "@/components/CertificadoFGVDocument";
import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { toast } from "sonner";
import { Loader2, Award, Clock, ShieldCheck, CheckCircle2, Languages, Globe, Download } from "lucide-react";

export default function BrasilOpenBadgeValidation() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [validDoc, setValidDoc] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<"pt" | "en" | "es">("pt");

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    setErrorMessage(null);
    
    // Call the validation endpoint
    fetch(`/api/validate/${encodeURIComponent(params.id)}`)
      .then((res) => {
        if (res.ok) return res.json();
        if (res.status === 404) throw new Error("Documento não encontrado");
        throw new Error("Erro de conexão ao servidor");
      })
      .then((resData) => {
        if (resData.valid && resData.data) {
          setValidDoc(resData.data);
        } else {
          setErrorMessage(resData.message || "Documento inválido.");
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage(err.message || "Erro ao validar documento.");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleDownloadPdf = async () => {
    if (!certRef.current || !validDoc) return;
    setIsDownloading(true);
    try {
      await exportElementToPDF(certRef.current, {
        filename: generatePDFFilename(validDoc.nome_aluno || validDoc.nome || "aluno", "fgv"),
        docType: "fgv",
        orientation: "l",
        scale: 2,
      });
      toast.success("Certificado baixado com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#005CA9] animate-spin mb-4" />
        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Validando Conquista...</span>
      </div>
    );
  }

  if (errorMessage || !validDoc) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border-t-8 border-red-500">
          <Award className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Falha na Validação</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            {errorMessage || "Este código não corresponde a um badge ou certificado válido em nossa base."}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#005CA9] text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-colors hover:bg-blue-800"
          >
            Ir para Início
          </a>
        </div>
      </div>
    );
  }

  // Pre-fill labels by language
  const texts = {
    pt: {
      conquista: "O que é necessário para conquistar este badge",
      requisito: validDoc.requisitos || "Tem direito ao certificado digital e badge FGV o/a estudante que tiver participado, contribuindo de forma crítica nas atividades propostas e obtido nota mínima 7,0 (sete) no curso.",
      testemunho: "Testemunho deste badge",
      emissao: "Emissão",
      validade: "Validade",
      nao_expira: "Não Expira",
      codigo: "Código de Autenticidade",
      emitido_por: "Emitido por",
      ganhador: "Ganhador",
      certificado: "Certificado",
      baixar: "Baixar PDF do Certificado",
    },
    en: {
      conquista: "What is required to earn this badge",
      requisito: "The student who participated, contributed critically in the proposed activities and obtained a minimum grade of 7.0 (seven) in the course is entitled to the digital certificate and FGV badge.",
      testemunho: "Evidence of this badge",
      emissao: "Issued",
      validade: "Validity",
      nao_expira: "Never Expires",
      codigo: "Authentication Code",
      emitido_por: "Issued by",
      ganhador: "Recipient",
      certificado: "Certificate",
      baixar: "Download Certificate PDF",
    },
    es: {
      conquista: "Qué se requiere para ganar esta insignia",
      requisito: "El estudiante que participó, contribuyó críticamente en las actividades propuestas y obtuvo una calificación mínima de 7.0 (siete) en el curso tiene derecho al certificado digital y a la insignia de la FGV.",
      testemunho: "Testimonio de esta insignia",
      emissao: "Emisión",
      validade: "Validez",
      nao_expira: "No Expira",
      codigo: "Código de Autenticidad",
      emitido_por: "Emitido por",
      ganhador: "Ganador",
      certificado: "Certificado",
      baixar: "Descargar PDF del Certificado",
    }
  }[lang];

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 font-sans antialiased">
      {/* ── 1. Top Bar / Header ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm h-20 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center">
          <img
            src="https://img.brasilopenbadge.com.br/logo-novo-azul-horizontal.png"
            alt="Brasil Open Badge"
            className="h-10 md:h-12 object-contain"
            onError={(e) => {
              // Fallback logo in case external asset fails
              e.currentTarget.src = "/assets/logo-text.webp";
            }}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            CONQUISTA VERIFICADA
          </div>
        </div>
      </header>

      {/* ── 2. Conteúdo Principal ── */}
      <main className="max-w-7xl mx-auto py-8 px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ── Coluna Esquerda: Badge & Metadados ── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 text-center">
              {/* Badge Original */}
              <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                <img
                  src="/assets/fgv_selo.png"
                  alt="FGV Badge"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to text logo if image fails
                    e.currentTarget.src = "/assets/logo-icon.png";
                  }}
                />
              </div>

              {/* Detalhes */}
              <div className="space-y-4 text-left border-t border-gray-100 pt-6">
                <div>
                  <h5 className="text-[10px] uppercase font-black tracking-wider text-gray-400">{texts.emissao}</h5>
                  <p className="text-sm font-bold text-gray-800">{validDoc.data_emissao || validDoc.created_at ? new Date(validDoc.created_at).toLocaleDateString("pt-BR") : ""}</p>
                </div>
                <div>
                  <h5 className="text-[10px] uppercase font-black tracking-wider text-gray-400">{texts.validade}</h5>
                  <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {texts.nao_expira}
                  </p>
                </div>
                <div>
                  <h5 className="text-[10px] uppercase font-black tracking-wider text-gray-400">{texts.codigo}</h5>
                  <p className="text-sm font-bold text-gray-800 font-mono select-all bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {validDoc.codigo_autenticidade || validDoc.codigoQR}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h5 className="text-[10px] uppercase font-black tracking-wider text-gray-400 text-left mb-3">QR Code Validador</h5>
                <div className="bg-gray-50 p-3 rounded-2xl inline-block border border-gray-100">
                  <QRCodeSVG
                    value={window.location.href}
                    size={110}
                  />
                </div>
              </div>
            </div>

            {/* Seletor de Idiomas */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-200 flex justify-around items-center">
              <button 
                onClick={() => setLang("pt")} 
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${lang === "pt" ? "bg-blue-50 text-[#005CA9]" : "text-gray-500 hover:bg-gray-50"}`}
              >
                🇧🇷 PT
              </button>
              <button 
                onClick={() => setLang("en")} 
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${lang === "en" ? "bg-blue-50 text-[#005CA9]" : "text-gray-500 hover:bg-gray-50"}`}
              >
                🇺🇸 EN
              </button>
              <button 
                onClick={() => setLang("es")} 
                className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${lang === "es" ? "bg-blue-50 text-[#005CA9]" : "text-gray-500 hover:bg-gray-50"}`}
              >
                🇪🇸 ES
              </button>
            </div>
          </div>

          {/* ── Coluna Direita: Detalhes, Ementa & Certificado ── */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Informações da Conquista */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                {validDoc.curso || CURSO_DEFAULT}
              </h2>
              
              <div className="prose prose-sm text-gray-600 max-w-none leading-relaxed">
                <p>
                  Por meio de um processo supervisionado pela Coordenação Acadêmica da FGV, o portador deste badge completou os objetivos educacionais do curso <strong>{validDoc.curso || CURSO_DEFAULT}</strong>.
                </p>
                
                {validDoc.ementa && (
                  <>
                    <h4 className="text-sm font-bold text-gray-800 mt-6 uppercase tracking-wider">Ementa</h4>
                    <p>{validDoc.ementa}</p>
                  </>
                )}
                
                {validDoc.competencias && (
                  <>
                    <h4 className="text-sm font-bold text-gray-800 mt-6 uppercase tracking-wider">Competências</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {validDoc.competencias.split("\n").map((line: string, i: number) => (
                        <li key={i}>{line.replace(/^[-\s*;]+/, "").trim()}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="border-t border-gray-100 mt-6 pt-6">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{texts.conquista}</h4>
                <p className="text-sm text-gray-600 italic bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {texts.requisito}
                </p>
              </div>

              {validDoc.matricula && (
                <div className="border-t border-gray-100 mt-6 pt-6">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{texts.testemunho}</h4>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-sm text-blue-900 font-bold font-mono">
                      matricula: {validDoc.matricula} {validDoc.turma ? `– turma: ${validDoc.turma}` : ""}
                    </p>
                    <span className="text-[10px] text-blue-700 font-black uppercase tracking-wider">FUNDAÇÃO GETULIO VARGAS</span>
                  </div>
                </div>
              )}
            </div>

            {/* Certificado Embed 1:1 */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{texts.certificado}</h3>
                  <p className="text-xs text-gray-500">Visualização do certificado em alta definição</p>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  disabled={isDownloading}
                  className="px-5 py-2.5 bg-[#005CA9] text-white text-xs font-bold rounded-xl uppercase tracking-widest flex items-center gap-2 hover:bg-blue-800 transition-colors"
                >
                  {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {texts.baixar}
                </button>
              </div>

              {/* Certificado Scale Container */}
              <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-center overflow-x-auto border border-gray-200">
                <div style={{ width: "100%", maxWidth: 820, height: 580, overflow: "hidden", position: "relative" }}>
                  <div 
                    style={{ 
                      transform: "scale(0.73)", 
                      transformOrigin: "top left",
                      width: 1123,
                      height: 794,
                      borderRadius: 12,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                      overflow: "hidden"
                    }}
                  >
                    <CertificadoFGVDocument ref={certRef} data={validDoc} />
                  </div>
                </div>
              </div>
            </div>

            {/* Emitido por */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center p-3">
                <img
                  src="/assets/fgv_logo.png"
                  alt="Fundação Getulio Vargas"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="text-center sm:text-left flex-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{texts.emitido_por}</span>
                <h4 className="text-lg font-black text-gray-900 leading-tight mt-1">FUNDAÇÃO GETULIO VARGAS</h4>
                <a
                  href="https://educacao-executiva.fgv.br/cursos/curta-media-duracao"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 font-bold hover:underline inline-flex items-center gap-1 mt-1"
                >
                  https://educacao-executiva.fgv.br/cursos/curta-media-duracao
                  <Globe className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Recipient */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                <Award className="w-10 h-10" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{texts.ganhador}</span>
                <h4 className="text-xl font-black text-gray-900 leading-tight mt-1">{validDoc.nome_aluno || validDoc.nome || "Stela Teles da Silva"}</h4>
                <p className="text-xs text-gray-400 mt-1 uppercase font-bold">Identificação: CPF {validDoc.cpf || "—"}</p>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
