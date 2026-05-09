import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation } from "wouter";
import PeticaoDocument from "@/components/PetitionSTJDocument";
import { usePDFExport, generatePDFFilename } from "@/lib/pdfExport";
import { toast } from "sonner";
import { 
  ArrowLeft, Download, Edit2, Save, X, Phone, User, FileText, 
  CheckCircle, ExternalLink, Info, Search, Gavel, Scale, Clock, 
  MessageSquare, Copy, Sparkles, AlertCircle
} from "lucide-react";

/**
 * JudicialDetails.tsx — Detalhes do Processo e Edição de Alvará
 * Integrado com API Real Datajud
 */

// ─── Ícones Locais ──────────────────────────────────────────────────────────
const CheckBadgeIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 12 2 2 4-4"/><path d="M12 3c-1.2 0-2.4.6-3 1.7A3.6 3.6 0 0 0 4.6 9c-1 .6-1.7 1.8-1.7 3s.7 2.4 1.7 3c-.3 1.2 0 2.5 1 3.4.8.8 2.1 1.2 3.3 1 .6 1 1.8 1.6 3 1.6s2.4-.6 3-1.7c1.2.3 2.5 0 3.4-1 .8-.8 1.2-2 1-3.3 1-.6 1.6-1.8 1.6-3s-.6-2.4-1.7-3c.3-1.2 0-2.5-1-3.4a3.7 3.7 0 0 0-3.3-1c-.6-1-1.8-1.6-3-1.6Z"/>
  </svg>
);

const WhatsAppIcon = ({ size = 20 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7 8.38 8.38 0 0 1 3.8.9L21 3z"/>
  </svg>
);

const GavelIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m14 13-5 5 2 2 5-5-2-2z"/><path d="m6 16 1.5 1.5"/><path d="M12.5 9.5 18 4l2.5 2.5L15 12l-2.5-2.5z"/><path d="m10 5 1.5 1.5"/><path d="m7 8 1.5 1.5"/>
  </svg>
);

export default function JudicialDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [process, setProcess] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const [isVerifyingWA, setIsVerifyingWA] = useState<Record<string, boolean>>({});
  const [waStatus, setWaStatus] = useState<Record<string, string>>({});
  const [isCPFLoading, setIsCPFLoading] = useState(false);
  const [telefonesEncontrados, setTelefonesEncontrados] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isExporting } = usePDFExport();

  const fetchProcess = useCallback(async () => {
    const id = params.id;
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      // Busca real usando o parâmetro ?processo= (API Real Datajud no Backend)
      const res = await fetch(`/api/bot-adv?processo=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Processo não encontrado no Datajud");
      const json = await res.json();
      setProcess(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProcess();
    document.title = "Consulta Judicial - DocMaster";
  }, [fetchProcess]);

  const handleCPFQuery = async (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return;

    setIsCPFLoading(true);
    try {
      const res = await fetch(`/api/bot-adv?action=consultar_cpf_automatico&cpf=${cleanCPF}`);
      const data = await res.json();
      if (data.success) {
        setTelefonesEncontrados(data.telefones || []);
        const nomeCredor = data.NOME || data.dados?.nome;
        if (nomeCredor) setProcess((p: any) => ({ ...p, credor_nome: nomeCredor }));
        toast.info("Dados vinculados ao CPF localizados.");
      }
    } catch (e) { toast.error("Erro ao consultar CPF."); }
    finally { setIsCPFLoading(false); }
  };

  const handleVerifyWA = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    setIsVerifyingWA(prev => ({ ...prev, [phone]: true }));
    try {
      const res = await fetch(`/api/bot-adv?action=verificar_whatsapp&telefone=${cleanPhone}`);
      const data = await res.json();
      if (data.success) setWaStatus(prev => ({ ...prev, [phone]: data.status }));
    } catch (e) { toast.error("Erro na verificação."); }
    finally { setIsVerifyingWA(prev => ({ ...prev, [phone]: false })); }
  };

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || !process) return;
    try {
      const docData = {
        processo: process.processo,
        credor: process.credor_nome || process.credores?.[0]?.nome,
        cpf_cnpj: process.credor_cpf || process.credores?.[0]?.cpf,
        advogado: process.advogado_nome || process.advogado || "Dr. Advogado",
        contra: process.parte_contraria,
        valor: process.valor_limpo || process.valor || (process.valor_numerico ? process.valor_numerico.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"),
        data: new Date().toLocaleDateString("pt-BR"),
        alvara_numero: Math.floor(1000000 + Math.random() * 9000000).toString()
      };

      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(docData.credor || "PETICAO", "peticaocria"),
        docType: "peticaocria",
        customWidth: 826,
        customHeight: 1180,
      });
      toast.success("Documento gerado com sucesso!");
    } catch (err) { toast.error("Erro ao gerar PDF."); }
  }, [exportPDF, process]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 px-6 text-center">
       <div className="w-16 h-16 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin mb-6" />
       <h2 className="text-lg md:text-xl font-black text-[#1a237e] uppercase italic tracking-tight">Consultando Datajud (CNJ)...</h2>
       <p className="text-gray-400 text-xs mt-2 uppercase font-bold tracking-widest">Sincronizando com Base Nacional</p>
    </div>
  );

  if (error) return (
    <div className="container" style={{ textAlign: 'center', marginTop: 100, padding: 20 }}>
      <AlertCircle size={60} color="#ef4444" className="mx-auto mb-6" />
      <h1 className="text-2xl md:text-3xl font-black text-gray-900">Erro na Consulta</h1>
      <p className="text-gray-500 mt-2">{error}</p>
      <button onClick={() => setLocation("/bot-adv")} className="mt-8 bg-[#1a237e] text-white px-8 py-3 rounded-xl font-bold active:scale-95 transition-all">VOLTAR</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
      <header className="h-16 md:h-20 bg-[#1a237e] text-white flex items-center px-4 md:px-8 shadow-lg sticky top-0 z-50">
        <button onClick={() => setLocation("/bot-adv")} className="flex items-center gap-1.5 md:gap-2 hover:bg-white/10 px-2 md:px-4 py-2 rounded-xl transition-all text-xs md:text-sm font-bold">
           <ArrowLeft size={18} /> <span className="hidden xs:inline">BUSCA</span>
        </button>
        <div className="h-6 md:h-8 w-px bg-white/20 mx-2 md:mx-4" />
        <div className="flex flex-col min-w-0">
           <span className="text-[8px] md:text-[10px] font-black opacity-60 uppercase tracking-widest truncate">Processo nº</span>
           <h1 className="text-xs md:text-sm font-bold tracking-tight truncate">{process?.processo}</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-2 md:gap-4">
           <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-500/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-emerald-500/30">
              <CheckBadgeIcon size={14} className="md:w-4" />
              <span className="text-[8px] md:text-[10px] font-black uppercase">Verificado</span>
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
           <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-gray-50">
                 <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2 uppercase">
                    <Scale size={20} className="text-[#1a237e]" /> Informações do Processo
                 </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-8 md:gap-x-12">
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Classe</label>
                    <div className="text-sm md:text-base font-bold text-gray-900 truncate">{process?.classe}</div>
                 </div>
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Assunto</label>
                    <div className="text-sm md:text-base font-bold text-gray-900 truncate">{process?.assunto}</div>
                 </div>
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor da Causa</label>
                    <div className="text-xl md:text-2xl font-black text-emerald-600">{process?.valor || `R$ ${process?.valor_numerico?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}</div>
                 </div>
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Distribuição</label>
                    <div className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2 truncate">
                      <Clock size={16} className="text-gray-400" /> 
                      {process?.data_distribuicao ? new Date(process.data_distribuicao).toLocaleDateString("pt-BR") : "—"}
                    </div>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
                 <h3 className="text-xs md:text-sm font-black text-gray-900 mb-4 md:mb-6 flex items-center gap-2 uppercase italic tracking-tight">
                    <User size={16} className="text-indigo-600" /> Polo Ativo (Autor)
                 </h3>
                 <div className="space-y-3">
                    {process?.credores?.map((p: any, i: number) => (
                        <div key={i} className="bg-indigo-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-indigo-100">
                          <div className="font-black text-[#1a237e] uppercase text-[10px] md:text-xs">{p.nome}</div>
                          <div className="text-[8px] md:text-[10px] font-bold text-indigo-400 mt-1">Doc: {p.cpf || "—"}</div>
                        </div>
                    ))}
                 </div>
              </div>
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
                 <h3 className="text-xs md:text-sm font-black text-gray-900 mb-4 md:mb-6 flex items-center gap-2 uppercase italic tracking-tight">
                    <GavelIcon size={16} /> Polo Passivo (Réu)
                 </h3>
                 <div className="bg-red-50/30 p-3 md:p-4 rounded-xl md:rounded-2xl border border-red-100">
                    <div className="font-black text-red-900 uppercase text-[10px] md:text-xs truncate">{process?.parte_contraria}</div>
                    <div className="text-[8px] md:text-[10px] font-bold text-red-400 mt-1 uppercase">Devedor</div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xs md:text-sm font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-2 uppercase tracking-widest">
                 <Clock size={18} className="text-[#1a237e]" /> Movimentações Recentes
              </h2>
              <div className="space-y-5 md:space-y-6 relative before:absolute before:left-2.5 md:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                 {process?.movimentacoes?.map((m: any, i: number) => (
                    <div key={i} className="pl-8 md:pl-10 relative">
                       <div className="absolute left-1 md:left-1.5 top-1.5 w-3 md:w-3.5 h-3 md:h-3.5 bg-[#1a237e] rounded-full border-2 md:border-4 border-white ring-1 ring-[#1a237e]/20 shadow-sm" />
                       <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-0.5 md:mb-1">
                          {new Date(m.data).toLocaleDateString("pt-BR")}
                       </div>
                       <div className="text-xs md:text-sm font-bold text-gray-700 leading-tight">{m.texto}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-4 md:space-y-6">
           <button onClick={() => setIsEditing(!isEditing)} className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm tracking-widest transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${isEditing ? "bg-red-50 text-red-600" : "bg-[#FF9800] text-white"}`}>
              {isEditing ? <><X size={18} /> CANCELAR</> : <><Edit2 size={18} /> CONFIGURAR ALVARÁ</>}
           </button>

           {isEditing && (
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl border-2 border-[#FF9800] space-y-4 animate-in slide-in-from-top-4 duration-300">
                 <input className="w-full bg-gray-50 border p-2.5 rounded-lg text-xs font-bold" value={process.credor_cpf || ""} onChange={e => handleCPFQuery(e.target.value)} placeholder="CPF do Credor" />
                 <input className="w-full bg-gray-50 border p-2.5 rounded-lg text-xs font-bold" value={process.credor_nome || ""} onChange={e => setProcess((p:any)=>({...p, credor_nome: e.target.value}))} placeholder="Nome do Credor" />
                 <input className="w-full bg-gray-50 border p-2.5 rounded-lg text-xs font-bold" value={process.advogado_nome || ""} onChange={e => setProcess((p:any)=>({...p, advogado_nome: e.target.value}))} placeholder="Nome do Advogado" />
                 <input className="w-full bg-gray-50 border p-2.5 rounded-lg text-xs font-bold" value={process.valor_limpo || ""} onChange={e => setProcess((p:any)=>({...p, valor_limpo: e.target.value}))} placeholder="Valor de Liberação" />
                 <button onClick={handleExportPDF} className="w-full py-3 bg-[#1a237e] text-white rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-2">
                    <Download size={18} /> GERAR ALVARÁ FINAL
                 </button>
              </div>
           )}

           <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
              <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-4 uppercase flex items-center gap-2"><Phone size={14} /> Contatos Identificados</h3>
              <div className="space-y-2.5">
                 {telefonesEncontrados.map((tel, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg border">
                       <div className="flex-1 font-bold text-gray-700 text-xs truncate">{tel}</div>
                       <button onClick={() => handleVerifyWA(tel)} className="px-2 py-1 bg-gray-200 rounded text-[8px] font-black">V. WA</button>
                    </div>
                 ))}
                 <a href={`https://wa.me/55${(telefonesEncontrados[0] || "").replace(/\D/g,"")}?text=Olá, vi seu processo ${process?.processo}.`} target="_blank" className="w-full bg-[#25D366] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] shadow-lg">
                    <WhatsAppIcon size={18} /> FALAR COM PAGAMENTOS
                 </a>
              </div>
           </div>
        </div>
      </main>

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={previewRef} style={{ width: 826 }}>
          <PeticaoDocument data={{
             processo: process?.processo,
             credor: process?.credor_nome || process?.credores?.[0]?.nome,
             cpf_cnpj: process?.credor_cpf || process?.credores?.[0]?.cpf,
             advogado: process?.advogado_nome || process?.advogado,
             contra: process?.parte_contraria,
             valor: process?.valor_limpo || process?.valor || (process?.valor_numerico?.toLocaleString('pt-BR')),
             data: new Date().toLocaleDateString("pt-BR"),
             alvara_numero: "9136187"
          }} />
        </div>
      </div>
    </div>
  );
}
