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
 */

const THEME = {
  primary: "#1a237e",
  accent: "#FF9800",
  bg: "#f4f6f9",
  card: "#ffffff",
  text: "#333333",
  muted: "#666666",
  success: "#28a745",
  border: "#e0e0e0"
};

export default function JudicialDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [process, setProcess] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para funcionalidades do TODO
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
      const res = await fetch(`/api/judicial/process/search?number=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Processo não encontrado");
      const json = await res.json();
      setProcess(json.data);
      
      // Parse JSON fields if they are strings
      if (typeof json.data.polo_ativo === 'string') json.data.polo_ativo = JSON.parse(json.data.polo_ativo);
      if (typeof json.data.polo_passivo === 'string') json.data.polo_passivo = JSON.parse(json.data.polo_passivo);
      if (typeof json.data.movimentacoes === 'string') json.data.movimentacoes = JSON.parse(json.data.movimentacoes);
      if (typeof json.data.documentos === 'string') json.data.documentos = JSON.parse(json.data.documentos);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProcess();
    document.title = "Detalhes do Processo - DocMaster";
  }, [fetchProcess]);

  // Consulta Automática de CPF
  const handleCPFQuery = async (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return;

    setIsCPFLoading(true);
    try {
      const res = await fetch(`/api/judicial/cpf/query?cpf=${cleanCPF}`);
      const data = await res.json();
      if (data.success) {
        setTelefonesEncontrados(data.telefones || []);
        if (data.dados?.nome) {
          setProcess((p: any) => ({ ...p, credor_nome: data.dados.nome }));
        }
        toast.info("Dados vinculados ao CPF localizados.");
      }
    } catch (e) {
      toast.error("Erro ao consultar CPF.");
    } finally {
      setIsCPFLoading(false);
    }
  };

  const handleVerifyWA = async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    // Detectar fixo (2,3,4,5 após DDD)
    const thirdDigit = cleanPhone.length >= 3 ? parseInt(cleanPhone[2]) : 0;
    if (thirdDigit >= 2 && thirdDigit <= 5) {
       toast.warning("Números fixos não suportam verificação de WhatsApp.");
       return;
    }

    setIsVerifyingWA(prev => ({ ...prev, [phone]: true }));
    try {
      const res = await fetch(`/api/judicial/whatsapp/verify?phone=${cleanPhone}`);
      const data = await res.json();
      if (data.success) {
        setWaStatus(prev => ({ ...prev, [phone]: data.status }));
      }
    } catch (e) {
      toast.error("Erro na verificação.");
    } finally {
      setIsVerifyingWA(prev => ({ ...prev, [phone]: false }));
    }
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/judicial/llm/suggest", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setProcess((p: any) => ({
          ...p,
          valor: data.suggestions.valor,
          advogado_nome: data.suggestions.advogado,
          credor_nome: data.suggestions.credor
        }));
        toast.success("Sugestões aplicadas com sucesso!");
      }
    } catch (e) {
      toast.error("Erro ao obter sugestões.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSaveAlvara = async () => {
    try {
      const payload = {
        process_id: process.id,
        process_number: process.process_number,
        credor_nome: process.credor_nome || process.polo_ativo?.[0]?.nome,
        credor_cpf: process.credor_cpf || process.polo_ativo?.[0]?.cpf,
        advogado_nome: process.advogado_nome,
        parte_contraria: process.parte_contraria || process.polo_passivo?.[0]?.nome,
        valor: process.valor,
        data_emissao: new Date().toLocaleDateString("pt-BR")
      };
      
      const res = await fetch("/api/judicial/alvara/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Alvará salvo no histórico.");
        setIsEditing(false);
      }
    } catch (e) {
      toast.error("Erro ao salvar alvará.");
    }
  };

  const handleExportPDF = useCallback(async () => {
    if (!previewRef.current || !process) return;
    try {
      // Prepara os dados para o PeticaoDocument
      const docData = {
        processo: process.process_number,
        credor: process.credor_nome || process.polo_ativo?.[0]?.nome,
        cpf_cnpj: process.credor_cpf || process.polo_ativo?.[0]?.cpf,
        advogado: process.advogado_nome || "KEVIN PEREIRA BARCELOS",
        contra: process.parte_contraria || process.polo_passivo?.[0]?.nome,
        valor: process.valor || (process.valor_causa ? process.valor_causa.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"),
        data: new Date().toLocaleDateString("pt-BR"),
        alvara_numero: Math.floor(1000000 + Math.random() * 9000000).toString()
      };

      await exportPDF(previewRef.current, {
        filename: generatePDFFilename(docData.credor || "PETICAO", "peticaocria"),
        docType: "peticaocria",
        customWidth: 826,
        customHeight: 1180,
      });
      
      // Salva no banco após download bem sucedido
      handleSaveAlvara();
      
      toast.success("Documento gerado com sucesso!");
    } catch (err) { 
      toast.error("Erro ao gerar PDF."); 
    }
  }, [exportPDF, process]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
       <div className="w-16 h-16 border-4 border-[#1a237e] border-t-transparent rounded-full animate-spin mb-6" />
       <h2 className="text-xl font-black text-[#1a237e] uppercase italic">Sincronizando com Tribunal...</h2>
    </div>
  );

  if (error) return (
    <div className="container" style={{ textAlign: 'center', marginTop: 100 }}>
      <AlertCircle size={60} color="#ef4444" className="mx-auto mb-6" />
      <h1 className="text-3xl font-black text-gray-900">Processo não localizado</h1>
      <p className="text-gray-500 mt-2">O número {params.id} não retornou resultados na base unificada.</p>
      <button onClick={() => setLocation("/bot-adv")} className="mt-8 bg-[#1a237e] text-white px-8 py-3 rounded-xl font-bold">TENTAR NOVAMENTE</button>
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
           <h1 className="text-xs md:text-sm font-bold tracking-tight truncate">{process?.process_number}</h1>
        </div>
        
        <div className="ml-auto flex items-center gap-2 md:gap-4">
           <div className="flex items-center gap-1.5 md:gap-2 bg-emerald-500/20 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-emerald-500/30">
              <CheckBadgeIcon size={14} className="md:w-4" />
              <span className="text-[8px] md:text-[10px] font-black uppercase">Verificado</span>
           </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        
        {/* Coluna Esquerda: Dados do Processo */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
           
           {/* Card Detalhes */}
           <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6 md:mb-8 pb-4 border-b border-gray-50">
                 <h2 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
                    <Scale size={20} className="text-[#1a237e] md:w-6 md:h-6" /> INFORMAÇÕES
                 </h2>
                 <span className="text-[9px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest">Justiça Estadual</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 md:gap-y-8 gap-x-8 md:gap-x-12">
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Classe Processual</label>
                    <div className="text-sm md:text-base font-bold text-gray-900">{process?.classe}</div>
                 </div>
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Assunto Principal</label>
                    <div className="text-sm md:text-base font-bold text-gray-900">{process?.assunto}</div>
                 </div>
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Valor da Causa</label>
                    <div className="text-xl md:text-2xl font-black text-emerald-600">R$ {process?.valor_causa?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                 </div>
                 <div>
                    <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Distribuição</label>
                    <div className="text-sm md:text-base font-bold text-gray-900 flex items-center gap-2"><Clock size={16} className="text-gray-400" /> {new Date(process?.data_distribuicao).toLocaleDateString("pt-BR")}</div>
                 </div>
              </div>
           </div>

           {/* Card Partes */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
                 <h3 className="text-xs md:text-sm font-black text-gray-900 mb-4 md:mb-6 flex items-center gap-2 uppercase italic tracking-tight">
                    <User size={16} className="text-indigo-600 md:w-[18px]" /> Polo Ativo (Autor)
                 </h3>
                 <div className="space-y-3">
                    {process?.polo_ativo?.map((p: any, i: number) => (
                        <div key={i} className="bg-indigo-50/50 p-3 md:p-4 rounded-xl md:rounded-2xl border border-indigo-100">
                        <div className="font-black text-[#1a237e] uppercase text-[10px] md:text-xs">{p.nome}</div>
                        <div className="text-[8px] md:text-[10px] font-bold text-indigo-400 mt-1">CPF/CNPJ: {p.cpf}</div>
                        </div>
                    ))}
                 </div>
              </div>
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
                 <h3 className="text-xs md:text-sm font-black text-gray-900 mb-4 md:mb-6 flex items-center gap-2 uppercase italic tracking-tight">
                    <Gavel size={16} className="text-red-600 md:w-[18px]" /> Polo Passivo (Réu)
                 </h3>
                 <div className="space-y-3">
                    {process?.polo_passivo?.map((p: any, i: number) => (
                        <div key={i} className="bg-red-50/30 p-3 md:p-4 rounded-xl md:rounded-2xl border border-red-100">
                        <div className="font-black text-red-900 uppercase text-[10px] md:text-xs">{p.nome}</div>
                        <div className="text-[8px] md:text-[10px] font-bold text-red-400 mt-1">CNPJ: {p.cnpj || "—"}</div>
                        </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Movimentações */}
           <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xs md:text-sm font-black text-gray-900 mb-6 md:mb-8 flex items-center gap-2 uppercase tracking-widest">
                 <Clock size={18} className="text-[#1a237e] md:w-5" /> MOVIMENTAÇÕES
              </h2>
              <div className="space-y-5 md:space-y-6 relative before:absolute before:left-2.5 md:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                 {process?.movimentacoes?.map((m: any, i: number) => (
                    <div key={i} className="pl-8 md:pl-10 relative">
                       <div className="absolute left-1 md:left-1.5 top-1.5 w-3 md:w-3.5 h-3 md:h-3.5 bg-[#1a237e] rounded-full border-2 md:border-4 border-white ring-1 ring-[#1a237e]/20 shadow-sm" />
                       <div className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-0.5 md:mb-1">{new Date(m.data).toLocaleDateString("pt-BR")}</div>
                       <div className="text-xs md:text-sm font-bold text-gray-700 leading-tight">{m.texto}</div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Coluna Direita: Ações e Edição */}
        <div className="space-y-4 md:space-y-6">
           
           {/* Botão de Edição Principal */}
           <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`w-full py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm tracking-widest transition-all shadow-lg md:shadow-xl active:scale-95 flex items-center justify-center gap-2 md:gap-3 ${
                isEditing ? "bg-red-50 text-red-600 border border-red-200" : "bg-[#FF9800] text-white shadow-orange-500/20 border-b-2 md:border-b-4 border-orange-700"
              }`}
           >
              {isEditing ? <><X size={18} /> CANCELAR EDICÃO</> : <><Edit2 size={18} /> CONFIGURAR ALVARÁ</>}
           </button>

           {isEditing && (
              <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-2xl border-2 border-[#FF9800] space-y-4 md:space-y-5 animate-in slide-in-from-top-4 duration-300">
                 <div className="flex items-center justify-between mb-1 md:mb-2">
                    <h3 className="text-[10px] md:text-xs font-black text-orange-600 uppercase tracking-widest">Edição</h3>
                    <button 
                      onClick={handleSuggest}
                      disabled={isSuggesting}
                      className="text-[8px] md:text-[10px] font-black bg-indigo-50 text-[#1a237e] px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-indigo-100 flex items-center gap-1.5 md:gap-2 hover:bg-indigo-100 disabled:opacity-50"
                    >
                       <Sparkles size={12} className="md:w-3.5" /> {isSuggesting ? "..." : "AUTO-FILL AI"}
                    </button>
                 </div>

                 <div className="space-y-3 md:space-y-4">
                    <div>
                       <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-1 block">CPF do Credor</label>
                       <div className="relative">
                          <input 
                             className="w-full bg-gray-50 border border-gray-200 p-2.5 md:p-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold focus:border-orange-500 outline-none"
                             value={process.credor_cpf || ""}
                             onChange={e => {
                                const val = e.target.value;
                                setProcess((p:any)=>({...p, credor_cpf: val}));
                                if (val.replace(/\D/g,"").length === 11) handleCPFQuery(val);
                             }}
                             placeholder="000.000.000-00"
                          />
                          {isCPFLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />}
                       </div>
                    </div>

                    <div>
                       <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-1 block">Nome do Credor</label>
                       <input 
                          className="w-full bg-gray-50 border border-gray-200 p-2.5 md:p-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold focus:border-orange-500 outline-none"
                          value={process.credor_nome || ""}
                          onChange={e => setProcess((p:any)=>({...p, credor_nome: e.target.value}))}
                          placeholder="Nome Completo"
                       />
                    </div>

                    <div>
                       <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-1 block">Nome do Advogado</label>
                       <input 
                          className="w-full bg-gray-50 border border-gray-200 p-2.5 md:p-3 rounded-lg md:rounded-xl text-xs md:text-sm font-bold focus:border-orange-500 outline-none"
                          value={process.advogado_nome || ""}
                          onChange={e => setProcess((p:any)=>({...p, advogado_nome: e.target.value}))}
                          placeholder="Dr. Nome do Advogado"
                       />
                    </div>

                    <div>
                       <label className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase mb-1 block">Valor de Liberação</label>
                       <input 
                          className="w-full bg-gray-50 border border-gray-200 p-2.5 md:p-3 rounded-lg md:rounded-xl text-xs md:text-sm font-black text-emerald-600 focus:border-orange-500 outline-none"
                          value={process.valor || ""}
                          onChange={e => setProcess((p:any)=>({...p, valor: e.target.value}))}
                          placeholder="R$ 0,00"
                       />
                    </div>

                    <button 
                       onClick={handleExportPDF}
                       disabled={isExporting}
                       className="w-full py-3 md:py-4 bg-[#1a237e] text-white rounded-xl md:rounded-2xl font-black text-xs md:text-sm shadow-lg shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                       <Download size={18} className="md:w-5" /> {isExporting ? "GERANDO..." : "GERAR ALVARÁ FINAL"}
                    </button>
                 </div>
              </div>
           )}

           {/* Card de Contatos e Telefones */}
           <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
              <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                 <Phone size={14} className="text-indigo-600 md:w-4" /> Telefones Identificados
              </h3>
              
              <div className="space-y-2.5 md:space-y-3">
                 {telefonesEncontrados.length > 0 ? (
                    telefonesEncontrados.map((tel, i) => (
                       <div key={i} className="flex items-center gap-2 p-2.5 md:p-3 bg-gray-50 rounded-lg md:rounded-xl border border-gray-100 group">
                          <div className="flex-1 font-bold text-gray-700 text-xs md:text-sm truncate">{tel}</div>
                          <button onClick={() => copyToClipboard(tel)} className="p-1 md:p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600 transition-all shrink-0"><Copy size={12} className="md:w-3.5"/></button>
                          <button 
                             onClick={() => handleVerifyWA(tel)}
                             disabled={isVerifyingWA[tel]}
                             className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[8px] md:text-[10px] font-black uppercase transition-all flex items-center gap-1 shrink-0 ${
                                waStatus[tel] === "existe" ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                             }`}
                          >
                             {isVerifyingWA[tel] ? "..." : waStatus[tel] === "existe" ? <><CheckCircle size={10} className="md:w-3"/> EXISTE</> : "V. WA"}
                          </button>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-4 md:py-6 opacity-40">
                       <Search size={20} className="mx-auto mb-2 text-gray-300 md:w-6" />
                       <p className="text-[8px] md:text-[10px] font-bold uppercase">Consulte um CPF</p>
                    </div>
                 )}
              </div>

              <div className="mt-5 md:mt-6 pt-5 md:pt-6 border-t border-gray-50">
                 <a 
                    href={`https://wa.me/55${(telefonesEncontrados[0] || "21999999999").replace(/\D/g,"")}?text=Olá, sou do setor de pagamentos e vi seu processo ${process?.process_number}.`}
                    target="_blank"
                    className="w-full bg-[#25D366] text-white py-3 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] md:text-xs shadow-lg shadow-green-500/20 hover:scale-[1.01] active:scale-95 transition-all text-center leading-tight"
                 >
                    <WhatsAppIcon size={18} className="md:w-5" /> FALAR COM SETOR DE PAGAMENTOS
                 </a>
              </div>
           </div>

           {/* Documentos Anexos */}
           <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
              <h3 className="text-[10px] md:text-xs font-black text-gray-900 mb-4 uppercase tracking-widest flex items-center gap-2">
                 <FileText size={14} className="text-indigo-600 md:w-4" /> DOCUMENTOS
              </h3>
              <div className="grid grid-cols-2 gap-2.5 md:gap-3">
                 {process?.documentos?.map((doc: any) => (
                    <button key={doc.id} className="p-2.5 md:p-3 bg-gray-50 border border-gray-100 rounded-lg md:rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all group flex flex-col items-center gap-1.5 md:gap-2 min-w-0">
                       <FileText size={20} className="text-gray-400 group-hover:text-indigo-600 md:w-6" />
                       <span className="text-[8px] md:text-[10px] font-bold text-gray-500 group-hover:text-indigo-900 uppercase truncate w-full text-center">{doc.nome}</span>
                    </button>
                 ))}
              </div>
           </div>

        </div>
      </main>

      {/* Renderizador Invisível para o PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={previewRef} style={{ width: 826 }}>
          <PeticaoDocument data={{
             processo: process?.process_number,
             credor: process?.credor_nome || process?.polo_ativo?.[0]?.nome,
             cpf_cnpj: process?.credor_cpf || process?.polo_ativo?.[0]?.cpf,
             advogado: process?.advogado_nome || "KEVIN PEREIRA BARCELOS",
             contra: process?.parte_contraria || process?.polo_passivo?.[0]?.nome,
             valor: process?.valor || (process?.valor_causa ? process?.valor_causa.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "0,00"),
             data: new Date().toLocaleDateString("pt-BR"),
             alvara_numero: Math.floor(1000000 + Math.random() * 9000000).toString()
          }} />
        </div>
      </div>
    </div>
  );
}
