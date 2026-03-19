import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";
import AttestationDocument from "@/components/AttestationDocument";
import type { AttestationData } from "@/data/attestations";

import { exportElementToPDF, generatePDFFilename } from "@/lib/pdfExport";
import { createAttestation } from "@/lib/attestationStore";
import { createAttestationApi } from "@/lib/apiClient";
import { handleDateInput, formatDateToEnglish } from "@/lib/dateMask";

type Language = "pt" | "en";

const labels = {
  pt: {
    title: "Emitir Novo Atestado",
    subtitle: "Preencha os dados abaixo. O preview será atualizado em tempo real.",
    patientData: "Dados do Paciente",
    medicalData: "Dados Médicos",
    physicianData: "Dados do Médico",
    dateTime: "Data e Hora",
    logoSettings: "Configurações de Logo",
    institutionSettings: "Dados da Instituição",
    patientName: "Nome do Paciente",
    sex: "Sexo",
    male: "Masculino",
    female: "Feminino",
    birthDate: "Data de Nascimento (DD/MM/AAAA)",
    cpf: "CPF",
    motherName: "Nome da Mãe",
    address: "Endereço",
    passport: "Passaporte",
    condition: "Condição Clínica (Inglês)",
    vaccination: "Vacinação Contraindicada",
    cid: "CID / ICD",
    physicianName: "Nome do Médico",
    crm: "CRM",
    specialty: "Especialidade",
    signatureDate: "Data da Assinatura (DD/MM/AAAA)",
    signatureTime: "Hora da Assinatura",
    emissionDate: "Data de Emissão (DD/MM/AAAA)",
    logoUrl: "URL da Logo (opcional)",
    logoPreview: "Prévia da Logo",
    useDefaultLogo: "Usar logo padrão IDAB",
    institutionName: "Nome da Instituição",
    issuingAddress: "Endereço Emitente",
    create: "EMITIR ATESTADO",
    cancel: "CANCELAR",
    creating: "Emitindo...",
    success: "Atestado emitido com sucesso!",
    error: "Erro ao emitir atestado",
    back: "← Voltar",
    preview: "Preview em Tempo Real",
    downloadPdf: "⬇ BAIXAR PDF",
    form: "Formulário",
    codeGenerated: "Código de Validação",
    codeInfo: "O código será gerado automaticamente ao emitir.",
  },
  en: {
    title: "Issue New Certificate",
    subtitle: "Fill in the data below. The preview updates in real time.",
    patientData: "Patient Data",
    medicalData: "Medical Data",
    physicianData: "Physician Data",
    dateTime: "Date and Time",
    logoSettings: "Logo Settings",
    institutionSettings: "Institution Data",
    patientName: "Patient Name",
    sex: "Sex",
    male: "Male",
    female: "Female",
    birthDate: "Date of Birth (DD/MM/YYYY)",
    cpf: "CPF",
    motherName: "Mother's Name",
    address: "Address",
    passport: "Passport",
    condition: "Clinical Condition (English)",
    vaccination: "Vaccination Contraindicated",
    cid: "ICD Code",
    physicianName: "Physician Name",
    crm: "CRM",
    specialty: "Specialty",
    signatureDate: "Signature Date (DD/MM/YYYY)",
    signatureTime: "Signature Time",
    emissionDate: "Emission Date (DD/MM/YYYY)",
    logoUrl: "Logo URL (optional)",
    logoPreview: "Logo Preview",
    useDefaultLogo: "Use default IDAB logo",
    institutionName: "Institution Name",
    issuingAddress: "Issuing Address",
    create: "ISSUE CERTIFICATE",
    cancel: "CANCEL",
    creating: "Issuing...",
    success: "Certificate issued successfully!",
    error: "Error issuing certificate",
    back: "← Back",
    preview: "Real-Time Preview",
    downloadPdf: "⬇ DOWNLOAD PDF",
    form: "Form",
    codeGenerated: "Validation Code",
    codeInfo: "The code will be generated automatically upon issuance.",
  },
};

const DEFAULT_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

export default function CreateAttestation() {
  const { language, setLanguage } = useLanguageWithSetter();
  const t = labels[language];
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    paciente: "",
    sexo: "MALE" as "MALE" | "FEMALE",
    nascimento: "",
    cpf: "",
    nomeMae: "",
    endereco: "",
    passaporte: "",
    condicao: "The patient has a history of severe allergic reaction (anaphylaxis) to egg proteins, representing a risk condition for administration of vaccines containing this component.",
    vacinacao: "YELLOW FEVER",
    cid: "T78.0 ANAPHYLACTIC REACTION DUE TO FOOD (EGG)",
    medico: "DIMITRI GUSMAO FLORES",
    crm: "CRM/BA 14180",
    especialidade: "ALLERGY AND IMMUNOLOGY",
    dataAssinatura: "",
    horaAssinatura: "",
    dataEmissao: "",
    instituicao: "IDAB - SALVADOR/BAHIA",
    enderecoEmitente: "AV. ANTÔNIO CARLOS MAGALHÃES, 585 - ITAIGARA, SALVADOR - BA, 41825-000",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler com máscara automática DD/MM/AAAA
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const masked = handleDateInput(value);
    setFormData((prev) => ({ ...prev, [name]: masked }));
  };

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
    setLogoPreviewError(false);
  };

  const handleUseDefaultLogo = () => {
    setLogoUrl(DEFAULT_LOGO_URL);
    setLogoPreviewError(false);
  };

  // Build preview data
  const previewData: AttestationData = {
    id: createdCode || "XXXX.XXXX",
    paciente: formData.paciente || "NOME DO PACIENTE",
    sexo: formData.sexo,
    nascimento: formData.nascimento || "DD/MM/AAAA",
    cpf: formData.cpf || "XXX.XXX.XXX-XX",
    nomeMae: formData.nomeMae || "NOME DA MÃE",
    endereco: formData.endereco || "ENDEREÇO COMPLETO",
    passaporte: formData.passaporte || "XXXXXXX",
    condicao: formData.condicao,
    vacinacao: formData.vacinacao,
    cid: formData.cid,
    codigoQR: createdCode || "XXXX.XXXX",
    dataAssinatura: formData.dataAssinatura || "DD/MM/AAAA",
    horaAssinatura: formData.horaAssinatura || "HH:MM",
    medico: formData.medico,
    crm: formData.crm,
    especialidade: formData.especialidade,
    dataEmissao: formData.dataEmissao
      ? formatDateToEnglish(formData.dataEmissao)
      : "MONTH DD, YYYY",
    logoUrl: logoUrl,
    // Extended fields
    instituicao: formData.instituicao,
    enderecoEmitente: formData.enderecoEmitente,
  } as any;

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      const filename = generatePDFFilename(formData.paciente || "NOVO", "EMITIDO");
      await exportElementToPDF(previewRef.current, {
        filename,
        scale: 2,
        quality: 0.95,
      });
    } catch (err) {
      console.error("PDF generation error:", err);
      alert(`Erro ao gerar PDF: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      paciente: formData.paciente.toUpperCase(),
      sexo: formData.sexo,
      nascimento: formData.nascimento,
      cpf: formData.cpf,
      nomeMae: formData.nomeMae.toUpperCase(),
      endereco: formData.endereco.toUpperCase(),
      passaporte: formData.passaporte.toUpperCase(),
      condicao: formData.condicao,
      vacinacao: formData.vacinacao.toUpperCase(),
      cid: formData.cid.toUpperCase(),
      medico: formData.medico.toUpperCase(),
      crm: formData.crm,
      especialidade: formData.especialidade.toUpperCase(),
      dataAssinatura: formData.dataAssinatura,
      horaAssinatura: formData.horaAssinatura,
      dataEmissao: formatDateToEnglish(formData.dataEmissao).toUpperCase(),
      logoUrl: logoUrl || DEFAULT_LOGO_URL,
      instituicao: formData.instituicao,
      enderecoEmitente: formData.enderecoEmitente,
    };

    try {
      // Tentar salvar via API (D1) primeiro, fallback para localStorage
      let newAtt: any;
      try {
        const apiResult = await createAttestationApi(payload);
        if (apiResult) {
          newAtt = apiResult;
        } else {
          throw new Error('API retornou vazio');
        }
      } catch (apiErr) {
        console.warn('API indisponível, salvando localmente:', apiErr);
        newAtt = createAttestation(payload as any);
      }

      setCreatedCode(newAtt.codigoQR);
      alert(`${t.success}\n\n${t.codeGenerated}: ${newAtt.codigoQR}`);
    } catch (error) {
      alert(`${t.error}: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg p-4 border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{t.title}</h1>
            <p className="text-gray-600 text-sm mt-1">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <Button
                variant={language === "pt" ? "default" : "outline"}
                onClick={() => setLanguage("pt")}
                size="sm"
              >
                PT-BR
              </Button>
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
                size="sm"
              >
                EN
              </Button>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">{t.back}</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content - Side by Side */}
      <div className="max-w-[1800px] mx-auto p-4 flex gap-4" style={{ minHeight: "calc(100vh - 80px)" }}>
        {/* LEFT: Form */}
        <div className="w-[480px] flex-shrink-0 overflow-y-auto" style={{ maxHeight: "calc(100vh - 100px)" }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Validation Code Info */}
            {createdCode && (
              <Card className="p-4 bg-green-50 border-green-300">
                <p className="text-sm font-semibold text-green-800">{t.codeGenerated}:</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{createdCode}</p>
              </Card>
            )}

            {/* Logo Settings */}
            <Card className="p-4 bg-yellow-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.logoSettings}</h3>
              <div className="space-y-2">
                <Input type="url" value={logoUrl} onChange={handleLogoUrlChange} placeholder="https://..." className="text-sm" />
                <Button type="button" onClick={handleUseDefaultLogo} variant="outline" className="w-full text-xs" size="sm">
                  {t.useDefaultLogo}
                </Button>
                {logoUrl && !logoPreviewError && (
                  <div className="border rounded p-2 bg-white flex justify-center">
                    <img src={logoUrl} alt="Logo" onError={() => setLogoPreviewError(true)} className="max-h-16 object-contain" />
                  </div>
                )}
              </div>
            </Card>

            {/* Institution Settings */}
            <Card className="p-4 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.institutionSettings}</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.institutionName}</label>
                  <Input name="instituicao" value={formData.instituicao} onChange={handleInputChange} className="text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.issuingAddress}</label>
                  <Input name="enderecoEmitente" value={formData.enderecoEmitente} onChange={handleInputChange} className="text-sm" />
                </div>
              </div>
            </Card>

            {/* Patient Data */}
            <Card className="p-4 bg-blue-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.patientData}</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.patientName}</label>
                  <Input name="paciente" value={formData.paciente} onChange={handleInputChange} required className="text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.sex}</label>
                    <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm">
                      <option value="MALE">{t.male}</option>
                      <option value="FEMALE">{t.female}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.birthDate}</label>
                    <Input name="nascimento" value={formData.nascimento} onChange={handleDateChange} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required className="text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.cpf}</label>
                  <Input name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="XXX.XXX.XXX-XX" required className="text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.motherName}</label>
                  <Input name="nomeMae" value={formData.nomeMae} onChange={handleInputChange} required className="text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.address}</label>
                  <Input name="endereco" value={formData.endereco} onChange={handleInputChange} required className="text-sm" />
                </div>
              </div>
            </Card>

            {/* Medical Data */}
            <Card className="p-4 bg-green-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.medicalData}</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.passport}</label>
                  <Input name="passaporte" value={formData.passaporte} onChange={handleInputChange} className="text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.condition}</label>
                  <textarea name="condicao" value={formData.condicao} onChange={handleInputChange} rows={3} className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.vaccination}</label>
                    <Input name="vacinacao" value={formData.vacinacao} onChange={handleInputChange} required className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.cid}</label>
                    <Input name="cid" value={formData.cid} onChange={handleInputChange} required className="text-sm" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Physician Data */}
            <Card className="p-4 bg-purple-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.physicianData}</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.physicianName}</label>
                    <Input name="medico" value={formData.medico} onChange={handleInputChange} required className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.crm}</label>
                    <Input name="crm" value={formData.crm} onChange={handleInputChange} required className="text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.specialty}</label>
                  <Input name="especialidade" value={formData.especialidade} onChange={handleInputChange} required className="text-sm" />
                </div>
              </div>
            </Card>

            {/* Date and Time */}
            <Card className="p-4 bg-orange-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">{t.dateTime}</h3>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.signatureDate}</label>
                    <Input name="dataAssinatura" value={formData.dataAssinatura} onChange={handleDateChange} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required className="text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">{t.signatureTime}</label>
                    <Input name="horaAssinatura" type="time" value={formData.horaAssinatura} onChange={handleInputChange} required className="text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">{t.emissionDate}</label>
                  <Input name="dataEmissao" value={formData.dataEmissao} onChange={handleDateChange} placeholder="DD/MM/AAAA" maxLength={10} inputMode="numeric" required className="text-sm" />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pb-4">
              <Link href="/">
                <Button variant="outline" className="px-6">{t.cancel}</Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-6">
                {isLoading ? t.creating : t.create}
              </Button>
            </div>
          </form>
        </div>

        {/* RIGHT: Preview */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-700">{t.preview}</h2>
            <Button onClick={handleDownloadPdf} className="bg-green-600 hover:bg-green-700 text-white" size="sm">
              {t.downloadPdf}
            </Button>
          </div>
          <div className="flex-1 overflow-auto bg-gray-300 rounded-lg p-4" style={{ maxHeight: "calc(100vh - 140px)" }}>
            <div className="shadow-2xl">
              <AttestationDocument ref={previewRef} data={previewData} logoUrl={logoUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
