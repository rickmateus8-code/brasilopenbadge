"""
Gera as imagens base da CHA Náutica (frente e verso) com fidelidade ao modelo gov.br
"""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1600, 952
BG_COLOR = "#c8e6c9"  # verde claro (mint green)
BORDER_COLOR = "#4a7c59"  # verde escuro para bordas
TEXT_COLOR = "#1a3a2a"  # verde escuro para textos
FIELD_BG = "#ffffff"
FIELD_BORDER = "#6aab7a"

def get_font(size, bold=False):
    """Tenta carregar uma fonte, cai para padrão se não encontrar"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf" if bold else "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    return ImageFont.load_default()

def draw_field(draw, x, y, w, h, label=None, label_size=18, label_color=None):
    """Desenha um campo com borda e label opcional"""
    # Campo branco com borda
    draw.rectangle([x, y, x+w, y+h], fill=FIELD_BG, outline=FIELD_BORDER, width=2)
    if label:
        lc = label_color or TEXT_COLOR
        font = get_font(label_size)
        draw.text((x, y - label_size - 4), label, fill=lc, font=font)

def draw_text_centered(draw, text, cx, y, font, color=TEXT_COLOR):
    """Desenha texto centralizado em cx"""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text((cx - tw//2, y), text, fill=color, font=font)

# ─── FRENTE ──────────────────────────────────────────────────────────────────
def create_frente():
    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Borda externa
    draw.rectangle([8, 8, W-8, H-8], outline=BORDER_COLOR, width=3)
    
    # ── Header (fora do card interno) ──
    cx = W // 2
    
    # Brasão da República (círculo estilizado)
    brasao_cx, brasao_cy = 90, 90
    draw.ellipse([brasao_cx-45, brasao_cy-45, brasao_cx+45, brasao_cy+45], 
                 fill="#2d6a4f", outline="#1a3a2a", width=2)
    draw.ellipse([brasao_cx-35, brasao_cy-35, brasao_cx+35, brasao_cy+35], 
                 fill="#40916c", outline="#1a3a2a", width=1)
    font_brasao = get_font(20, bold=True)
    draw.text((brasao_cx-12, brasao_cy-12), "BR", fill="#ffffff", font=font_brasao)
    
    # Logo Marinha (leme estilizado)
    leme_cx, leme_cy = W - 90, 90
    draw.ellipse([leme_cx-45, leme_cy-45, leme_cx+45, leme_cy+45], 
                 fill="#1a3a6b", outline="#0d2040", width=2)
    draw.ellipse([leme_cx-35, leme_cy-35, leme_cx+35, leme_cy+35], 
                 fill="#2563eb", outline="#1a3a6b", width=1)
    # Raios do leme
    import math
    for angle in range(0, 360, 45):
        rad = math.radians(angle)
        x1 = leme_cx + 15 * math.cos(rad)
        y1 = leme_cy + 15 * math.sin(rad)
        x2 = leme_cx + 32 * math.cos(rad)
        y2 = leme_cy + 32 * math.sin(rad)
        draw.line([x1, y1, x2, y2], fill="#ffffff", width=2)
    draw.ellipse([leme_cx-8, leme_cy-8, leme_cx+8, leme_cy+8], fill="#ffffff")
    
    # Textos do header
    font_h1 = get_font(22, bold=True)
    font_h2 = get_font(18)
    font_h3 = get_font(16)
    font_title = get_font(28, bold=True)
    font_subtitle = get_font(20)
    
    y_start = 22
    draw_text_centered(draw, "República Federativa do Brasil", cx, y_start, font_h1)
    draw_text_centered(draw, "(Federative Republic of Brazil)", cx, y_start + 26, font_h2)
    draw_text_centered(draw, "Autoridade Marítima Brasileira", cx, y_start + 52, font_h1)
    draw_text_centered(draw, "(Brazilian Maritime Authority)", cx, y_start + 78, font_h2)
    draw_text_centered(draw, "Diretoria de Portos e Costas", cx, y_start + 104, font_h1)
    draw_text_centered(draw, "(Directorate of Ports and Coasts)", cx, y_start + 130, font_h2)
    
    y_title = y_start + 162
    draw_text_centered(draw, "CARTEIRA DE HABILITAÇÃO DE AMADOR (CHA)", cx, y_title, font_title)
    draw_text_centered(draw, "(Non Professionals License Card)", cx, y_title + 36, font_subtitle)
    
    # ── Card interno (fundo branco com borda) ──
    card_x, card_y = 20, y_title + 70
    card_w, card_h = W - 40, H - card_y - 20
    draw.rectangle([card_x, card_y, card_x + card_w, card_y + card_h], 
                   fill=BG_COLOR, outline=BORDER_COLOR, width=2)
    
    # ── Campos do formulário ──
    font_label = get_font(22)
    font_label_en = get_font(18)
    
    # Nome
    nome_y = card_y + 30
    draw.text((card_x + 35, nome_y), "Nome (Name)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, card_x + 35, nome_y + 28, 885, 58)
    
    # Nascimento + CPF
    nasc_y = nome_y + 110
    draw.text((card_x + 35, nasc_y), "Data de Nascimento (Date of Birth)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, card_x + 35, nasc_y + 28, 320, 58)
    
    draw.text((card_x + 425, nasc_y), "CPF (Individual Registration)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, card_x + 425, nasc_y + 28, 495, 58)
    
    # Categoria
    cat_y = nasc_y + 110
    draw.text((card_x + 35, cat_y), "Categoria (Category)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, card_x + 35, cat_y + 28, 885, 58)
    
    # Validade + Inscrição
    val_y = cat_y + 110
    draw.text((card_x + 35, val_y), "Data de Validade (Expiration date)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, card_x + 35, val_y + 28, 320, 58)
    
    draw.text((card_x + 425, val_y), "Nº de Inscrição (Registration Number)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, card_x + 425, val_y + 28, 495, 58)
    
    # Foto
    foto_x = card_x + 985
    draw_field(draw, foto_x, card_y + 30, 555, 420)
    font_foto = get_font(28)
    draw.text((foto_x + 220, card_y + 220), "FOTO", fill="#aaaaaa", font=font_foto)
    
    output_path = "/home/ubuntu/docmaster/public/frentecha.png"
    img.save(output_path, "PNG", optimize=True)
    print(f"Frente salva: {output_path} ({W}x{H})")
    return img

# ─── VERSO ───────────────────────────────────────────────────────────────────
def create_verso():
    img = Image.new("RGB", (W, H), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Borda externa
    draw.rectangle([8, 8, W-8, H-8], outline=BORDER_COLOR, width=3)
    
    font_label = get_font(22)
    font_label_en = get_font(18)
    
    # Limites da Navegação
    lim_y = 30
    draw.text((35, lim_y), "Limites da Navegação (Navigation Limits)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, 35, lim_y + 30, 1165, 148)
    
    # Requisitos
    req_y = lim_y + 210
    draw.text((35, req_y), "Requisitos para conduzir a embarcação (Requirements to conduct the boat)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, 35, req_y + 30, 1165, 148)
    
    # Órgão de Emissão + Data de Emissão
    org_y = req_y + 210
    draw.text((35, org_y), "Órgão de Emissão (Issuing Organization)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, 35, org_y + 30, 660, 58)
    
    draw.text((760, org_y), "Data de Emissão (Issue Date)", fill=TEXT_COLOR, font=font_label)
    draw_field(draw, 760, org_y + 30, 440, 58)
    
    # Logo Marinha do Brasil (centro inferior)
    import math
    logo_cx = W // 2
    logo_cy = H - 180
    
    # Círculo externo
    draw.ellipse([logo_cx-85, logo_cy-85, logo_cx+85, logo_cy+85], 
                 fill="#1a3a6b", outline="#0d2040", width=3)
    
    # Âncora estilizada
    # Haste vertical
    draw.rectangle([logo_cx-5, logo_cy-55, logo_cx+5, logo_cy+55], fill="#ffffff")
    # Barra horizontal
    draw.rectangle([logo_cx-35, logo_cy-45, logo_cx+35, logo_cy-35], fill="#ffffff")
    # Argola
    draw.ellipse([logo_cx-12, logo_cy-65, logo_cx+12, logo_cy-45], outline="#ffffff", width=4)
    # Braços da âncora
    draw.arc([logo_cx-45, logo_cy+10, logo_cx+45, logo_cy+70], 180, 0, fill="#ffffff", width=5)
    draw.line([logo_cx-45, logo_cy+40, logo_cx-35, logo_cy+55], fill="#ffffff", width=4)
    draw.line([logo_cx+45, logo_cy+40, logo_cx+35, logo_cy+55], fill="#ffffff", width=4)
    
    # Raios do leme ao redor
    for angle in range(0, 360, 30):
        rad = math.radians(angle)
        x1 = logo_cx + 60 * math.cos(rad)
        y1 = logo_cy + 60 * math.sin(rad)
        x2 = logo_cx + 80 * math.cos(rad)
        y2 = logo_cy + 80 * math.sin(rad)
        draw.line([x1, y1, x2, y2], fill="#ffffff", width=2)
    
    # Texto Marinha do Brasil
    font_marinha = get_font(30, bold=True)
    draw_text_centered(draw, "MARINHA", logo_cx, logo_cy + 95, font_marinha)
    draw_text_centered(draw, "DO BRASIL", logo_cx, logo_cy + 130, font_marinha)
    
    output_path = "/home/ubuntu/docmaster/public/versocha.png"
    img.save(output_path, "PNG", optimize=True)
    print(f"Verso salvo: {output_path} ({W}x{H})")
    return img

if __name__ == "__main__":
    create_frente()
    create_verso()
    print("Imagens CHA geradas com sucesso!")
