# Configuration Guide: New Domain and Backend

This guide explains how to deploy the system with your new domain `validaratestado.digital` and how to use the new backend.

## 1. Domain Configuration

For the system to work on your new domain:

1.  **DNS Setup:** In your domain registrar's panel, point the `A` record to your server's IP address.
2.  **Frontend Configuration:**
    *   The file `client/src/config.ts` is already configured with `validaratestado.digital`.
    *   QR codes generated automatically will point to `https://validaratestado.digital/v/{code}`.

## 2. Backend Structure

The system now has a robust Express API (`server/api.ts`):

*   **POST `/api/attestations`**: Creates a new certificate via form.
*   **GET `/api/attestations`**: Lists all registered certificates.
*   **GET `/api/attestations/:id`**: Fetches details of a specific certificate.
*   **GET `/api/validate/:code`**: Validates the authenticity of a certificate.

### Storage
Currently, data is maintained in memory for demonstration purposes. For production, it's recommended to connect to a database (MongoDB, PostgreSQL, etc.) by modifying the `server/api.ts` file.

## 3. Creating New Certificates

You can create new certificates by accessing the `/create` route in the system:
`https://validaratestado.digital/create`

The form supports:
*   Complete patient data (Name, CPF, Mother, Address).
*   Bilingual medical data (Clinical Condition, ICD, Vaccination).
*   Physician data and simulated digital signature.
*   Custom logo upload for each certificate.

## 4. PDF Export

PDF functionality has been implemented using the browser's native print API, optimized via CSS:
*   Removes interface elements (buttons, menus) during printing.
*   Adjusts the document title to the patient's name.
*   Ensures the printed layout is 100% faithful to the original IDAB document.

## 5. System Features

*   **100% English Interface:** All content is in English for international use.
*   **QR Code Validation:** Automatic validation via QR code scanning.
*   **Responsive Design:** Fully responsive for mobile and desktop devices.
*   **Dynamic Logo:** Each certificate can have a custom logo.
*   **20% Size Increase:** Layout increased by 20% (25% - 5% reduction) for better readability.

## 6. Recommended Next Steps

1.  **SSL/HTTPS:** Install an SSL certificate (Let's Encrypt) to ensure the domain works via HTTPS and protects data security.
2.  **Database Persistence:** Connect the backend to a real database.
3.  **Authentication:** Add a login layer to the `/create` page so only authorized personnel can generate certificates.
4.  **Cloudflare Pages Deployment:** Use Cloudflare Pages for frontend hosting and Cloudflare Workers for backend if needed.

---
Developed by Manus AI.

---
**Update:** Forcing build for SSL certificate renewal on Cloudflare.
Date: 2026-03-19
