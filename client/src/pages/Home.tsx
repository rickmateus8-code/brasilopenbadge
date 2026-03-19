import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { attestations } from "@/data/attestations";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">IDAB - Atestados Médicos</h1>
          <p className="text-lg text-blue-100">
            Instituto de Dermatologia e Alergia - Salvador/Bahia
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Attestations List */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Atestados Disponíveis</h2>
            <div className="space-y-4">
              {Object.entries(attestations).map(([key, attestation]) => (
                <Card key={key} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-800">
                      {attestation.paciente}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Código: <span className="font-mono font-semibold">{attestation.codigoQR}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      CPF: {attestation.cpf}
                    </p>
                    <p className="text-sm text-gray-600">
                      Data: {attestation.dataEmissao}
                    </p>
                  </div>
                  <Link href={`/atestado/${key}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Visualizar Atestado
                    </Button>
                  </Link>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Ações Rápidas</h2>
            <div className="space-y-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Validar Documento</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Verifique a autenticidade de um atestado médico usando o código QR ou código de validação.
                </p>
                <Link href="/validar">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Ir para Validação
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-3">Criar Atestado</h3>
                <p className="text-sm text-green-800 mb-4">
                  Gere um novo atestado médico preenchendo o formulário com os dados do paciente.
                </p>
                <Link href="/criar">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    Novo Atestado
                  </Button>
                </Link>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <h3 className="text-lg font-bold text-purple-900 mb-3">Suporte</h3>
                <p className="text-sm text-purple-800 mb-4">
                  Dúvidas sobre validação ou acesso aos atestados?
                </p>
                <Button variant="outline" className="w-full">
                  Contato
                </Button>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-600">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Sobre este Sistema</h3>
          <p className="text-gray-700 mb-4">
            O sistema de atestados médicos do IDAB permite que pacientes visualizem, validem e baixem seus atestados de forma segura e conveniente. Todos os documentos são assinados digitalmente conforme a Medida Provisória nº 2.200-2.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div>
              <p className="font-semibold text-gray-800">Segurança</p>
              <p className="text-sm text-gray-600">Documentos assinados digitalmente</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Validação</p>
              <p className="text-sm text-gray-600">Código QR e validação online</p>
            </div>
            <div>
              <p className="font-semibold text-gray-800">Acesso</p>
              <p className="text-sm text-gray-600">24/7 pela internet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
