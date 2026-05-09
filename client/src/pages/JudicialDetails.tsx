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
 * Integrado com API Real Datajud e Snoop (Sem Proteção)
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

// ─── Helpers ───────────────────────────────────────────────────────────────
function formatCNJ(raw: string): string {
  const clean = raw.replace(/\D/g, "");
  if (clean.length !== 20) return raw;
  return `${clean.substring(0, 7)}-${clean.substring(7, 9)}.${clean.substring(9, 13)}.${clean.substring(13, 14)}.${clean.substring(14, 16)}.${clean.substring(16, 20)}`;
}

// ─── Estilos Customizados do Clone ──────────────────────────────────────────
const STYLES = `
  .clone-container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 0.375rem; box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15); font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; color: #000 !important; }
  .clone-container * { color: #000 !important; }
  .clone-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; border-bottom: 3px solid #007bff; padding-bottom: 1rem; gap: 1rem; }
  .clone-header h2 { margin: 0; color: #007bff !important; font-size: 1.5rem; font-weight: 700; }
  .adv-info { display: flex; align-items: center; background: #f8f9fa; padding: 1rem; border-radius: 0.375rem; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); flex: 1; justify-content: flex-end; text-align: right; }
  .details-box { border: 1px solid #e0e0e0; padding: 1.5rem; margin-bottom: 1.5rem; border-radius: 0.375rem; background: #fafbfc; box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.075); }
  .clone-btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; transition: all 0.3s; font-size: 1rem; }
  .btn-docs { background: linear-gradient(45deg, #28a745, #20c997); color: white !important; }
  .btn-alvara { background: linear-gradient(45deg, #ffc107, #fd7e14); color: #000 !important; }
  .btn-edit { background: linear-gradient(45deg, #17a2b8, #138496); color: white !important; }
  .phone-item { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: #f8f9fa; border-radius: 5px; margin-bottom: 0.5rem; border-left: 3px solid #007bff; }
  .timeline-clone { border-left: 2px solid #007bff; padding-left: 1.5rem; position: relative; margin-top: 1rem; }
  .timeline-dot { position: absolute; left: -7px; top: 5px; width: 12px; height: 12px; background: #007bff; border-radius: 50%; }
  label { font-weight: 800 !important; }
`;

export default function JudicialDetails() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [process, setProcess] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMovs, setShowMovs] = useState(false);
  
  const [isVerifyingWA, setIsVerifyingWA] = useState<Record<string, boolean>>({});
  const [waStatus, setWaStatus] = useState<Record<string, string>>({});
  const [isCPFLoading, setIsCPFLoading] = useState(false);
  const [telefonesEncontrados, setTelefonesEncontrados] = useState<string[]>([]);

  const previewRef = useRef<HTMLDivElement>(null);
  const { exportPDF, exporting: isExporting } = usePDFExport();

  const fetchProcess = useCallback(async () => {
    const id = params.id;
    if (!id) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/bot-adv?processo=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Processo não encontrado no Datajud");
      const json = await res.json();
      setProcess(json.data);
      
      if (json.data.credores?.[0]?.cpf) {
         handleCPFQuery(json.data.credores[0].cpf);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchProcess();
    document.title = `Consulta de Processo - ${params.id}`;
  }, [fetchProcess, params.id]);

  const handleCPFQuery = async (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) return;

    setIsCPFLoading(true);
    try {
      const res = await fetch(`/api/bot-adv?action=consultar_cpf_automatico&cpf=${cleanCPF}`);
      const data = await res.json();
      if (data.success) {
        setTelefonesEncontrados(data.telefones || []);
        
        // Mapeamento Agressivo (Case Insensitive)
        const realName = data.NOME || data.nome || data.name || data.dados?.nome;
        const realBirth = data.NASCIMENTO || data.nascimento || data.birth_date || data.dados?.nascimento;
        const realGender = data.SEXO || data.sexo || data.gender || data.dados?.sexo;
        const realIncome = data.RENDA || data.renda || data.income || data.dados?.renda;

        setProcess((p: any) => ({ 
          ...p, 
          credor_nome: realName || p.credor_nome, 
          credor_cpf: cleanCPF, 
          RENDA: realIncome, 
          NASCIMENTO: realBirth, 
          SEXO: realGender 
        }));
      }
    } catch (e) { /* ignore */ }
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
        processo: formatCNJ(process.processo),
        credor: process.credor_nome || process.credores?.[0]?.nome,
        cpf_cnpj: process.credor_cpf || process.credores?.[0]?.cpf,
        advogado: process.advogado || "ALYNE FERNANDES DE OLIVEIRA",
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

  if (isLoading) return <div className="flex items-center justify-center h-screen bg-[#f5f7fa] font-bold text-[#007bff]">Carregando dados processuais...</div>;

  if (error) return (
    <div className="min-h-screen bg-[#f5f7fa] p-8 text-center">
      <AlertCircle size={60} color="#dc3545" className="mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-gray-900">Erro na Consulta</h1>
      <p className="text-gray-600 mt-2">{error}</p>
      <button onClick={() => setLocation("/bot-adv")} className="mt-6 bg-[#007bff] text-white px-6 py-2 rounded-lg font-bold">VOLTAR</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f7fa] to-[#c3cfe2] p-4 md:p-8">
      <style>{STYLES}</style>
      <div className="clone-container">
        <hr className="border-gray-200 mb-6" />
        <h1 className="text-3xl font-bold text-center text-[#007bff] mb-6">Consulta de Processo</h1>
        <hr className="border-gray-200 mb-8" />

        <div id="content">
          <div className="clone-header">
            <div>
              <h2>Processo: <strong>{formatCNJ(process?.processo || "")}</strong></h2>
              <p className="text-sm mt-2"><strong>Fonte dos dados:</strong> API Primária</p>
              <p className="text-sm"><strong>Tribunal:</strong> {process?.tribunal || "Tribunal de Justiça"}</p>
              <p className="text-sm"><strong>Órgão Julgador:</strong> {process?.orgao_julgador || "NÃO INFORMADO"}</p>
            </div>
            <div className="adv-info">
              <div>
                <p className="text-xs uppercase font-black mb-1">Advogado Principal:</p>
                <p className="text-sm font-bold">{process?.advogado || "NÃO IDENTIFICADO"}</p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-6" />
          <h2 className="text-lg font-bold mb-4">Geração de Alvará</h2>
          <div className="details-box">
             <p className="text-sm">Clique em <strong>Gerar e Baixar Alvará</strong> para iniciar o download automático.</p>
          </div>
          <hr className="border-gray-100 my-6" />

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
             <button onClick={handleExportPDF} disabled={isExporting} className="clone-btn btn-docs">
                <Download size={18} /> {isExporting ? "Gerando..." : `Baixar Docs (${process?.documentos?.length || 0})`}
             </button>
             <button onClick={() => setIsEditing(!isEditing)} className="clone-btn btn-edit">
                {isEditing ? "❌ Fechar Edição" : "✏️ Editar Dados do Alvará"}
             </button>
             <button onClick={handleExportPDF} disabled={isExporting} className="clone-btn btn-alvara">
                💰 {isExporting ? "Gerando..." : "Gerar e Baixar Alvará"}
             </button>
          </div>

          {isEditing && (
            <div className="details-box animate-in slide-in-from-top-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase block mb-1">Polo Ativo (Credor)</label>
                    <input className="w-full border p-2 rounded text-sm font-bold bg-white" value={process.credor_nome || ""} onChange={e => setProcess((p:any)=>({...p, credor_nome: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase block mb-1">CPF/CNPJ</label>
                    <input className="w-full border p-2 rounded text-sm font-bold bg-white" value={process.credor_cpf || ""} onChange={e => handleCPFQuery(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase block mb-1">Advogado</label>
                    <input className="w-full border p-2 rounded text-sm font-bold bg-white" value={process.advogado || ""} onChange={e => setProcess((p:any)=>({...p, advogado: e.target.value}))} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase block mb-1">Valor de Liberação</label>
                    <input className="w-full border p-2 rounded text-sm font-bold bg-white text-emerald-600" value={process.valor_limpo || ""} onChange={e => setProcess((p:any)=>({...p, valor_limpo: e.target.value}))} />
                  </div>
               </div>
            </div>
          )}

          <h2 className="text-lg font-bold mb-4">Detalhes Gerais</h2>
          <div className="details-box">
             <p className="text-sm"><strong>Classe:</strong> {process?.classe || "Procedimento Comum"}</p>
             <p className="text-sm"><strong>Assunto:</strong> {process?.assunto || "Tutela de Urgência"}</p>
             <p className="text-sm"><strong>Valor da Ação:</strong> {process?.valor || "R$ 0,00"}</p>
             <p className="text-sm"><strong>Data de Início:</strong> {process?.data_distribuicao || "N/A"}</p>
             <p className="text-sm"><strong>Último Movimento:</strong> {process?.movimentacoes?.[0]?.texto || "N/A"}</p>
          </div>

          <h2 className="text-lg font-bold mb-4">Partes Envolvidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
             <div className="details-box h-full">
                <h4 className="text-sm font-bold mb-4">Polo Ativo (Credor)</h4>
                <p className="text-xs"><strong>Parte:</strong> {process?.credores?.[0]?.nome} (Doc: {process?.credores?.[0]?.cpf || "—"})</p>
                <p className="text-xs"><strong>Advogado:</strong> {process?.advogado || "N/A"}</p>
                
                <div className="mt-4 p-3 bg-[#f8f9fa] border-l-4 border-[#007bff] rounded">
                   <h5 className="text-xs font-bold mb-2">Credores Identificados:</h5>
                   <ul className="text-xs space-y-1 list-disc list-inside">
                      {process?.credores?.map((c: any, i: number) => (
                        <li key={i}><strong>{c.nome}</strong> (CPF/CNPJ: {c.cpf})</li>
                      ))}
                   </ul>
                </div>
             </div>
             <div className="details-box h-full">
                <h4 className="text-sm font-bold mb-4">Polo Passivo (Parte Contrária)</h4>
                <p className="text-xs"><strong>Parte:</strong> {process?.parte_contraria}</p>
                <p className="text-xs"><strong>Interpretado como:</strong> {process?.parte_contraria?.split(" - ")[0]}</p>
                <p className="text-xs"><strong>Advogado:</strong> N/A</p>
             </div>
          </div>

          <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
            Movimentações Completas 
            <button onClick={() => setShowMovs(!showMovs)} className="text-xs bg-[#007bff] text-white px-3 py-1 rounded">
               {showMovs ? "👁️ Ocultar" : "👁️ Exibir"}
            </button>
          </h2>
          {showMovs && (
            <div className="details-box">
               <div className="space-y-4">
                  {process?.movimentacoes?.map((m: any, i: number) => (
                    <div key={i} className="timeline-clone">
                       <div className="timeline-dot" />
                       <div className="text-[10px] font-bold uppercase">{m.data?.includes("T") ? new Date(m.data).toLocaleDateString("pt-BR") : m.data}</div>
                       <div className="text-xs font-bold leading-tight">{m.texto}</div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <hr className="border-gray-200 my-8" />
        <div className="details-box !bg-[#f1f3f5] border-none shadow-none">
           <h2 className="text-lg font-bold mb-6">Contatos dos Credores</h2>
           <div className="details-box !bg-white">
              <h4 className="text-sm font-bold mb-4">{process?.credor_nome} - CPF: <strong>{process?.credor_cpf}</strong></h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                 <div className="space-y-1">
                    <p className="text-xs"><strong>Nome:</strong> {process?.credor_nome}</p>
                    <p className="text-xs"><strong>Nascimento:</strong> {process?.NASCIMENTO || "—"}</p>
                    <p className="text-xs"><strong>Sexo:</strong> {process?.SEXO || "—"}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-xs"><strong>Renda:</strong> {process?.RENDA || "—"}</p>
                    <p className="text-xs"><strong>Score:</strong> N/A</p>
                 </div>
              </div>

              <h5 className="text-xs font-bold mb-3 uppercase">Telefones de {process?.credor_nome}:</h5>
              <div className="space-y-2">
                 {telefonesEncontrados.map((tel, i) => (
                    <div key={i} className="phone-item">
                       <span className="text-sm font-bold">{tel}</span>
                       <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(tel)} className="text-[10px] font-bold bg-gray-200 px-2 py-1 rounded">📋 Copiar</button>
                          <a 
                            href={`https://wa.me/55${tel.replace(/\D/g,"")}?text=Boa tarde, ${process?.credor_nome}, espero que esteja bem.%0A%0AEstou entrando em contato para informar que temos novidades relacionadas ao processo ${process?.processo}.%0A%0AVenho informar que obtivemos êxito na causa, no valor de ${process?.valor || "R$ 0,00"}, liberado em relação ao seu processo, contra movido em face de ${process?.parte_contraria}.%0A%0AAtenciosamente,%0A%0A*DocMaster Judicial*`}
                            target="_blank" 
                            className="text-[10px] font-bold bg-[#25D366] text-white px-2 py-1 rounded flex items-center gap-1"
                          >
                            <WhatsAppIcon size={12} /> WhatsApp
                          </a>
                       </div>
                    </div>
                 ))}
                 {isCPFLoading && <div className="text-xs text-[#007bff] animate-pulse">Recuperando dados Snoop...</div>}
              </div>

              <div className="mt-6 flex justify-center">
                 <button onClick={() => copyToClipboard(telefonesEncontrados.join(", "))} className="text-xs font-black text-[#007bff] hover:underline">
                    📋 Copiar Todos os Telefones de {process?.credor_nome}
                 </button>
              </div>
           </div>
        </div>

        <div className="text-center mt-8">
           <button onClick={() => setLocation("/bot-adv")} className="clone-btn !bg-[#007bff] text-white">🔄 Nova Consulta</button>
        </div>
      </div>

      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={previewRef} style={{ width: 826 }}>
          <PeticaoDocument data={{
             id: process?.processo || "preview",
             processo: formatCNJ(process?.processo || ""),
             credor: process?.credor_nome || process?.credores?.[0]?.nome,
             cpf_cnpj: process?.credor_cpf || process?.credores?.[0]?.cpf,
             advogado: process?.advogado || "Dr. Advogado",
             contra: process?.parte_contraria,
             valor: process?.valor_limpo || process?.valor || (process?.valor_numerico?.toLocaleString('pt-BR')),
             data: new Date().toLocaleDateString("pt-BR"),
             alvara_numero: Math.floor(1000000 + Math.random() * 9000000).toString()
          }} />
        </div>
      </div>
    </div>
  );
}
