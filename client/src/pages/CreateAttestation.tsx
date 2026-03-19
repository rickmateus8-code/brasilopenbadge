import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useLanguageWithSetter } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";

type Language = "pt" | "en";

const labels = {
  pt: {
    title: "Criar Novo Atestado",
    subtitle: "Preencha os dados abaixo para gerar um novo atestado médico",
    patientData: "Dados do Paciente",
    medicalData: "Dados Médicos",
    physicianData: "Dados do Médico",
    dateTime: "Data e Hora",
    logoSettings: "Configurações de Logo",
    patientName: "Nome do Paciente",
    sex: "Sexo",
    male: "Masculino",
    female: "Feminino",
    birthDate: "Data de Nascimento",
    cpf: "CPF",
    motherName: "Nome da Mãe",
    address: "Endereço",
    passport: "Passaporte/Documento",
    condition: "Condição Clínica",
    vaccination: "Vacinação Contraindicada",
    cid: "CID",
    physicianName: "Nome do Médico",
    crm: "CRM",
    specialty: "Especialidade",
    signatureDate: "Data da Assinatura",
    signatureTime: "Hora da Assinatura",
    logoUrl: "URL da Logo (opcional)",
    logoPreview: "Prévia da Logo",
    useDefaultLogo: "Usar logo padrão IDAB",
    create: "CRIAR ATESTADO",
    cancel: "CANCELAR",
    creating: "Criando...",
    success: "Atestado criado com sucesso!",
    error: "Erro ao criar atestado",
    back: "← Voltar",
  },
  en: {
    title: "Create New Certificate",
    subtitle: "Fill in the data below to generate a new medical certificate",
    patientData: "Patient Data",
    medicalData: "Medical Data",
    physicianData: "Physician Data",
    dateTime: "Date and Time",
    logoSettings: "Logo Settings",
    patientName: "Patient Name",
    sex: "Sex",
    male: "Male",
    female: "Female",
    birthDate: "Birth Date",
    cpf: "CPF",
    motherName: "Mother's Name",
    address: "Address",
    passport: "Passport/Document",
    condition: "Clinical Condition",
    vaccination: "Vaccination Contraindicated",
    cid: "ICD",
    physicianName: "Physician Name",
    crm: "CRM",
    specialty: "Specialty",
    signatureDate: "Signature Date",
    signatureTime: "Signature Time",
    logoUrl: "Logo URL (optional)",
    logoPreview: "Logo Preview",
    useDefaultLogo: "Use default IDAB logo",
    create: "CREATE CERTIFICATE",
    cancel: "CANCEL",
    creating: "Creating...",
    success: "Certificate created successfully!",
    error: "Error creating certificate",
    back: "← Back",
  },
};

const DEFAULT_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663380726083/Jt3ChWN8C56HSCFrn4RLrZ/idab-logo-correct_03a04244.webp";

export default function CreateAttestation() {
  const { language, setLanguage } = useLanguageWithSetter();
  const t = labels[language];
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(DEFAULT_LOGO_URL);
  const [logoPreviewError, setLogoPreviewError] = useState(false);

  const [formData, setFormData] = useState({
    paciente: "",
    sexo: "MALE" as const,
    nascimento: "",
    cpf: "",
    nomeMae: "",
    endereco: "",
    passaporte: "",
    condicao: "",
    vacinacao: "",
    cid: "",
    medico: "",
    crm: "",
    especialidade: "",
    dataAssinatura: "",
    horaAssinatura: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUrl(e.target.value);
    setLogoPreviewError(false);
  };

  const handleUseDefaultLogo = () => {
    setLogoUrl(DEFAULT_LOGO_URL);
    setLogoPreviewError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/attestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, logoUrl: logoUrl || DEFAULT_LOGO_URL }),
      });

      const result = await response.json();

      if (result.success) {
        alert(t.success);
        setFormData({
          paciente: "", sexo: "MALE", nascimento: "", cpf: "", nomeMae: "",
          endereco: "", passaporte: "", condicao: "", vacinacao: "", cid: "",
          medico: "", crm: "", especialidade: "", dataAssinatura: "", horaAssinatura: "",
        });
        setLogoUrl(DEFAULT_LOGO_URL);
        window.location.href = "/";
      } else {
        alert(`${t.error}: ${result.error}`);
      }
    } catch (error) {
      alert(`${t.error}: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-lg shadow-lg p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t.title}</h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
            <Link href="/">
              <Button variant="outline">{t.back}</Button>
            </Link>
          </div>

          {/* Language Selector */}
          <div className="flex gap-2">
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
        </div>

        {/* Form */}
        <div className="bg-white shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Logo Settings */}
            <Card className="p-6 bg-yellow-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t.logoSettings}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.logoUrl}</label>
                  <Input type="url" value={logoUrl} onChange={handleLogoUrlChange} placeholder="https://exemplo.com/logo.png" />
                  <Button type="button" onClick={handleUseDefaultLogo} variant="outline" className="w-full mt-2">
                    {t.useDefaultLogo}
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.logoPreview}</label>
                  <div className="border-2 border-gray-300 rounded-lg p-4 h-32 flex items-center justify-center bg-white">
                    {logoUrl && !logoPreviewError ? (
                      <img src={logoUrl} alt="Logo Preview" onError={() => setLogoPreviewError(true)} className="max-h-28 max-w-full object-contain" />
                    ) : (
                      <p className="text-gray-500 text-sm text-center">
                        {logoPreviewError ? "Erro ao carregar logo" : "Nenhuma logo selecionada"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Patient Data */}
            <Card className="p-6 bg-blue-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t.patientData}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.patientName}</label>
                  <Input name="paciente" value={formData.paciente} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.sex}</label>
                  <select name="sexo" value={formData.sexo} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md" required>
                    <option value="MALE">{t.male}</option>
                    <option value="FEMALE">{t.female}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.birthDate}</label>
                  <Input name="nascimento" type="date" value={formData.nascimento} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.cpf}</label>
                  <Input name="cpf" value={formData.cpf} onChange={handleInputChange} placeholder="XXX.XXX.XXX-XX" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">{t.motherName}</label>
                  <Input name="nomeMae" value={formData.nomeMae} onChange={handleInputChange} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">{t.address}</label>
                  <Input name="endereco" value={formData.endereco} onChange={handleInputChange} required />
                </div>
              </div>
            </Card>

            {/* Medical Data */}
            <Card className="p-6 bg-green-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t.medicalData}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.passport}</label>
                  <Input name="passaporte" value={formData.passaporte} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.vaccination}</label>
                  <Input name="vacinacao" value={formData.vacinacao} onChange={handleInputChange} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">{t.condition}</label>
                  <textarea name="condicao" value={formData.condicao} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">{t.cid}</label>
                  <Input name="cid" value={formData.cid} onChange={handleInputChange} required />
                </div>
              </div>
            </Card>

            {/* Physician Data */}
            <Card className="p-6 bg-purple-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t.physicianData}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.physicianName}</label>
                  <Input name="medico" value={formData.medico} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.crm}</label>
                  <Input name="crm" value={formData.crm} onChange={handleInputChange} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2">{t.specialty}</label>
                  <Input name="especialidade" value={formData.especialidade} onChange={handleInputChange} required />
                </div>
              </div>
            </Card>

            {/* Date and Time */}
            <Card className="p-6 bg-orange-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4">{t.dateTime}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.signatureDate}</label>
                  <Input name="dataAssinatura" type="date" value={formData.dataAssinatura} onChange={handleInputChange} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">{t.signatureTime}</label>
                  <Input name="horaAssinatura" type="time" value={formData.horaAssinatura} onChange={handleInputChange} required />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" className="px-8 py-3">{t.cancel}</Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3">
                {isLoading ? t.creating : t.create}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
