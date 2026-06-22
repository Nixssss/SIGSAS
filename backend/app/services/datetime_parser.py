from datetime import datetime, timedelta
import re


def interpretar_data_hora(texto: str):
    if not texto:
        return None

    texto = texto.lower().strip()
    now = datetime.now()

    # =====================================================
    # 1. RANGE EXPLÍCITO (até, -, a)
    # =====================================================
    match_range = re.search(
        r"(\d{1,2}/\d{1,2}(?:/\d{4})?)\s*(?:até|ate|a|-|–)\s*(\d{1,2}/\d{1,2}(?:/\d{4})?)",
        texto
    )

    # =====================================================
    # 2. RANGE IMPLÍCITO (17/07 18/07)
    # =====================================================
    match_duplo = re.findall(r"\d{1,2}/\d{1,2}(?:/\d{4})?", texto)

    if match_range:
        d1_raw = match_range.group(1)
        d2_raw = match_range.group(2)

        return {
            "inicio": parse_date(d1_raw, now),
            "fim": parse_date(d2_raw, now)
        }

    if len(match_duplo) >= 2:
        return {
            "inicio": parse_date(match_duplo[0], now),
            "fim": parse_date(match_duplo[1], now)
        }

    if len(match_duplo) == 1:
        return {
            "inicio": parse_date(match_duplo[0], now),
            "fim": None
        }

    # =====================================================
    # 3. DD/MM/YYYY isolado
    # =====================================================
    match = re.search(r"\b(\d{1,2}/\d{1,2}/\d{4})\b", texto)
    if match:
        d = parse_date(match.group(1), now)
        return {"inicio": d, "fim": None}

    # =====================================================
    # 4. DD/MM isolado
    # =====================================================
    match = re.search(r"\b(\d{1,2}/\d{1,2})\b", texto)
    if match:
        d = parse_date(match.group(1), now)
        return {"inicio": d, "fim": None}

    # =====================================================
    # 5. DIA ISOLADO
    # =====================================================
    match = re.fullmatch(r"\d{1,2}", texto)

    if match:

        dia = int(texto)

        # só considera dia isolado para valores plausíveis
        if 1 <= dia <= 31:
            return {
                "inicio": datetime(
                    now.year,
                    now.month,
                    dia
                ).date(),
                "fim": None
            }

        return None
    # =====================================================
    # 6. AMANHÃ / HOJE
    # =====================================================
    if "amanha" in texto or "amanhã" in texto:
        d = (now + timedelta(days=1)).date()
        return {"inicio": d, "fim": None}

    if "hoje" in texto:
        return {"inicio": now.date(), "fim": None}

    return None


def parse_date(d, now):
    if len(d.split("/")) == 2:
        return datetime.strptime(d, "%d/%m").replace(year=now.year).date()
    return datetime.strptime(d, "%d/%m/%Y").date()