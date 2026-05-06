-- Migration: Criação da tabela de histórico de templates
-- Data: 05/05/2026

CREATE TABLE IF NOT EXISTS document_template_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_slug TEXT NOT NULL,
  layout_definition TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_slug) REFERENCES document_templates(slug)
);
