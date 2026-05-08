# API Endpoints - Cloudflare Pages Functions

Todas as rotas estão em `functions/api/` e são servidas automaticamente pelo Cloudflare Pages.

## Base URL

- **Produção**: `https://validaratestado.digital/api` ou `https://atestados-idab.pages.dev/api`
- **Local**: `http://localhost:8788/api` (via `wrangler pages dev`)

## Endpoints

### `GET /api/attestations`
Lista todos os atestados.

**Resposta:**
```json
{
  "success": true,
  "data": [ { "id": "P792.GL02", "paciente": "LUCAS ...", ... } ]
}
```

### `POST /api/attestations`
Cria um novo atestado. O `id` e `codigo_validacao` são gerados automaticamente.

**Body (JSON):**
```json
{
  "paciente": "NOME DO PACIENTE",
  "sexo": "MALE",
  "nascimento": "01/01/1990",
  "cpf": "000.000.000-00",
  "nomeMae": "NOME DA MÃE",
  "endereco": "ENDEREÇO",
  "passaporte": "XXXXXXX",
  "condicao": "Condição clínica...",
  "vacinacao": "YELLOW FEVER",
  "cid": "T78.0",
  "medico": "DR. NOME",
  "crm": "CRM/BA 00000",
  "especialidade": "ESPECIALIDADE",
  "dataAssinatura": "01/01/2026",
  "horaAssinatura": "10:00",
  "dataEmissao": "JANUARY 1, 2026",
  "logoUrl": null,
  "instituicao": "IDAB - SALVADOR/BAHIA",
  "enderecoEmitente": "AV. ANTÔNIO CARLOS MAGALHÃES, 585..."
}
```

**Resposta:**
```json
{ "success": true, "data": { "id": "XXXX.XXXX", "codigoQR": "XXXX.XXXX", ... } }
```

### `GET /api/attestations/:id`
Busca um atestado pelo ID.

### `PUT /api/attestations/:id`
Atualiza um atestado existente. Body igual ao POST.

### `DELETE /api/attestations/:id`
Remove um atestado.

### `GET /api/validate/:code`
Valida um atestado pelo código do QR Code.

**Resposta (válido):**
```json
{ "success": true, "valid": true, "data": { ... } }
```

**Resposta (inválido):**
```json
{ "success": false, "valid": false, "message": "Atestado não encontrado" }
```

## Geração do Código de Validação

O código é gerado no backend (`functions/utils/db.ts`) no formato `XXXX.XXXX`:
- 4 caracteres alfanuméricos maiúsculos + `.` + 4 caracteres alfanuméricos maiúsculos
- Exemplo: `P792.GL02`
- Verificação de unicidade antes de salvar
