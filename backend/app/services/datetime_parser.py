from datetime import datetime, timedelta
import re


def interpretar_data_hora(texto: str):

    if not texto:
        return None

    texto = texto.lower().strip()
    now = datetime.now()


    # =========================
    # DD/MM/YYYY
    # =========================
    match = re.search(r"\b(\d{1,2}/\d{1,2}/\d{4})\b", texto)



    if match:
        try:
            data = datetime.strptime(
                match.group(1),
                "%d/%m/%Y"
            ).date()

        except ValueError:
            data = None

    # =========================
    # DD/MM
    # =========================
    match = re.search(r"\b(\d{1,2})/(\d{1,2})\b", texto)



    if match:
        try:
            dia, mes = match.groups()

            data = datetime(
                now.year,
                int(mes),
                int(dia)
            ).date()

            return data

        except Exception:
            return None

    # =========================
    # DIA ISOLADO
    # =========================
    match = re.fullmatch(r"\d{1,2}", texto)

    if match:
        try:
            data = datetime(
                now.year,
                now.month,
                int(texto)
            ).date()

            return data

        except Exception:
            return None
    # =========================
    # AMANHÃ
    # =========================
    if "amanha" in texto or "amanhã" in texto:
        data = (now + timedelta(days=1)).date()


        return data

    # =========================
    # HOJE
    # =========================
    if "hoje" in texto:
        data = now.date()

        return data

    return None