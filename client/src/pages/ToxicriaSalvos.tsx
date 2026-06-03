/**
 * ToxicriaSalvos — Histórico de Laudos Toxicológicos Innovatox
 */
import DocumentosSalvos from "@/components/DocumentosSalvos";

const FIELDS = [
  { key: "laudoNumero", label: "Laudo N°", locked: true },
  { key: "nome", label: "Nome do Doador" },
  { key: "cpf", label: "CPF", locked: true },
  { key: "nf", label: "NF" },
  { key: "codigoAmostra", label: "Cód. Amostra" },
  { key: "dataColeta", label: "Data Coleta" },
  { key: "dataRecebimento", label: "Data Recebimento" },
  { key: "dataEmissao", label: "Data Emissão" },
  { key: "material", label: "Material" },
  { key: "postoColeta", label: "Posto de Coleta" },
];

export default function ToxicriaSalvos() {
  return (
    <DocumentosSalvos
      title="Laudos Innovatox Salvos"
      apiEndpoint="/api/documents/toxicria"
      docType="toxicria"
      fields={FIELDS}
      nameField="nome"
      cpfField="cpf"
      idLabel="Laudo N°"
      idField="laudoNumero"
      dateLabel="Data Emissão"
      dateField="dataEmissao"
      extraColumns={[
        {
          key: "codigo_validacao",
          label: "Código Validação",
          render: (doc) => (
            <span className="font-mono text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {doc.codigo_qr || "—"}
            </span>
          )
        }
      ]}
    />
  );
}
