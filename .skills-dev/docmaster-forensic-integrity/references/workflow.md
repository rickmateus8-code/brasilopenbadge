# DocMaster Forensic Workflow

## 1. Document Emission (DocMaster)
1.  **Selection:** User selects Doctor/City.
2.  **Fallback:** If `instituicao` is empty, frontend defaults to `PREFEITURA DE {CIDADE}`.
3.  **Saving:** The emission payload **MUST** include this fallback value if the field is empty.
4.  **Database:** Record is created in `attestations` (D1). `data_assinatura` is captured at this moment.

## 2. Validation Flow (IDAB / validaratestado.digital)
1.  **Query:** API `/api/validate/[code]` retrieves the record.
2.  **Parity:** The IDAB page uses the same `AttestationDocument` component.
3.  **Logo Loading:**
    - IDAB is on `validaratestado.digital`.
    - Logos are on `docmaster.store/logos/`.
    - **CORS REQUIRED:** `_headers` must allow `Access-Control-Allow-Origin: *`.
    - **Base64 Safety:** If `logo_url` starts with `data:`, `crossOrigin` must be `undefined`.

## 3. PDF Export (html2canvas / jspdf)
1.  **Canvas Drawing:** `crossOrigin` must be correctly set (or absent for Base64) for the canvas to capture the image.
2.  **Clipping:** Use `overflow: visible` in the footer to prevent clipping the bottom line of text (like the unique code).
3.  **Scale:** Export at `scale: 2` for high fidelity.

## 4. Maintenance & Parity
- Every change in `client/src/components/AttestationDocument.tsx` affects both platforms.
- Every change in `client/src/pages/AtestadoCria.tsx` must be mirrored in `client/src/pages/AtestadoEditar.tsx`.
