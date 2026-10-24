"""Cálculos del análisis de negocio (docs/negocio/analisis.md).

Uso: python3 -I docs/negocio/calculos.py ~/data docs/negocio/hospitales_generales.csv

Cada constante lleva su fuente. Lo que no tiene fuente está marcado como DECISIÓN.
"""
import collections
import csv
import sys

# ---------- Fuentes públicas ----------
POBLACION_ESPANA = 49_128_297  # INE, Censo anual, 1 de enero de 2025
POBLACION_MADRID = 7_113_886  # INE, España en cifras; solo para contrastar (no entra en los totales)
PREV_COLITIS = 316.6 / 100_000  # Registro poblacional de Cataluña, 2023 (J Clin Med 2025;14:5711, tabla 1)
PREV_CROHN = 194.4 / 100_000  # mismo registro
VISITAS_ESTANDAR = 2.34  # myIBDcoach, Lancet 2017: visitas a digestivo o enfermería por paciente y año, seguimiento habitual
VISITAS_REMOTO = 1.55  # mismo ensayo, seguimiento a distancia
INGRESOS_ESTANDAR = 0.10  # ingresos por paciente y año, seguimiento habitual
INGRESOS_REMOTO = 0.05  # seguimiento a distancia
PRECIO_REVISION = 79  # Orden 1975/2023 Comunidad de Madrid: consulta sucesiva presencial (€)
PRECIO_REVISION_NO_PRESENCIAL = 56  # misma orden: consulta sucesiva no presencial (€)
PRECIO_INGRESO = 3_947  # misma orden: ingreso por enfermedad inflamatoria intestinal, nivel de gravedad 1 (el más barato)
CONTRATO_MENOR = 15_000  # Ley 9/2017 de Contratos del Sector Público, art. 118: tope de servicios sin licitación (€ sin IVA)

# ---------- Decisiones nuestras ----------
PRECIO_PACIENTE_ANO = 30  # DECISIÓN: € por paciente activo y año

visitas_evitadas = VISITAS_ESTANDAR - VISITAS_REMOTO
ingresos_evitados = INGRESOS_ESTANDAR - INGRESOS_REMOTO


def euros(n):
    return f'{round(n):,} €'.replace(',', '.')


def num(n):
    return f'{round(n):,}'.replace(',', '.')


def leer(ruta):
    return csv.DictReader(open(ruta, encoding='utf-8-sig'))


# ---------- 1. Datos del reto: Aparato Digestivo, 6 meses ----------
def datos_reto(carpeta):
    esp = {r['id_agenda']: r['especialidad'] for r in leer(f'{carpeta}/AGENDAS.csv')}
    hueco = {r['id_hueco']: esp.get(r['id_agenda']) for r in leer(f'{carpeta}/HUECOS_AGENDA.csv')}
    revisiones = {}
    estados = collections.Counter()
    todas = collections.Counter()
    for c in leer(f'{carpeta}/CITAS.csv'):
        e = hueco.get(c['id_hueco'])
        if c['tipo_visita'] != 'S' or not e:
            continue
        todas[c['estado_actual']] += 1
        if e == 'DIG':
            revisiones[c['id_cita']] = c
            estados[c['estado_actual']] += 1
    minutos_admin = 0.0
    for t in leer(f'{carpeta}/TAREAS_ADMINISTRATIVAS.csv'):
        if t['id_cita'] in revisiones:
            minutos_admin += float(t['duracion_minutos'])
    comunicaciones = sum(1 for m in leer(f'{carpeta}/COMUNICACIONES.csv') if m['id_cita'] in revisiones)
    minutos_medico = [
        float(r['tiempo_atencion'])
        for r in leer(f'{carpeta}/CIRCUITO_CONSULTA.csv')
        if r['id_cita'] in revisiones and r['tiempo_atencion']
    ]
    n = len(revisiones)
    print('== 1. Datos del reto · Aparato Digestivo · revisiones (enero-junio 2025)')
    print('revisiones programadas', n, '| al año', n * 2)
    for k, v in estados.most_common():
        print(f'  {k}: {v} ({v / n:.1%}) | al año {v * 2}')
    print('minutos de médico por revisión (media)', round(sum(minutos_medico) / len(minutos_medico), 1))
    print('minutos administrativos por revisión programada', round(minutos_admin / n, 2))
    print('comunicaciones al paciente por revisión programada', round(comunicaciones / n, 2))
    no = estados['NO_REALIZADA'] * 2
    print('huecos perdidos al año por revisiones no realizadas', no, '| horas de médico', round(no * 20 / 60))
    print('hospital entero (6 especialidades): revisiones programadas al año', sum(todas.values()) * 2,
          '| no realizadas al año', todas['NO_REALIZADA'] * 2)


# ---------- 2. Valor por paciente ----------
def valor_paciente():
    print('\n== 2. Valor por paciente y año (myIBDcoach × tarifas de Madrid)')
    ahorro_revisiones = visitas_evitadas * PRECIO_REVISION
    ahorro_ingresos = ingresos_evitados * PRECIO_INGRESO
    print(f'revisiones evitadas {visitas_evitadas:.2f} × {PRECIO_REVISION} € = {ahorro_revisiones:.2f} €')
    print(f'ingresos evitados {ingresos_evitados:.2f} × {PRECIO_INGRESO} € = {ahorro_ingresos:.2f} €')
    print(f'total {ahorro_revisiones + ahorro_ingresos:.2f} € | precio {PRECIO_PACIENTE_ANO} €')
    print(f'minutos de médico liberados {visitas_evitadas * 20:.1f}')
    return ahorro_revisiones, ahorro_ingresos


# ---------- 3. Pacientes y facturación hospital a hospital ----------
def mercado(ruta_hospitales, ahorro_revisiones, ahorro_ingresos):
    hospitales = list(leer(ruta_hospitales))
    for h in hospitales:
        h['camas'] = int(h['camas'])
    camas_todas = sum(h['camas'] for h in hospitales)
    pacientes_espana = POBLACION_ESPANA * (PREV_COLITIS + PREV_CROHN)
    por_cama = pacientes_espana / camas_todas
    print('\n== 3. Mercado')
    print('pacientes en España: colitis ulcerosa', num(POBLACION_ESPANA * PREV_COLITIS),
          '| Crohn', num(POBLACION_ESPANA * PREV_CROHN), '| total', num(pacientes_espana))
    print('camas en hospitales generales', camas_todas, '| pacientes por cama', round(por_cama, 3))
    print('techo España (todos los pacientes)', euros(pacientes_espana * PRECIO_PACIENTE_ANO))

    def cliente(h):
        p = h['camas'] * por_cama
        return p, p * PRECIO_PACIENTE_ANO

    princesa = next(h for h in hospitales if h['hospital'] == 'Hospital Universitario de La Princesa')
    p, f = cliente(princesa)
    print('\n-- Cliente 1: La Princesa', princesa['camas'], 'camas')
    print('pacientes', num(p), '| colitis', num(p * PREV_COLITIS / (PREV_COLITIS + PREV_CROHN)), '| facturación', euros(f))
    print('revisiones liberadas', num(p * visitas_evitadas), '| por semana', round(p * visitas_evitadas / 52, 1),
          '| horas de médico', num(p * visitas_evitadas * 20 / 60))
    print('ingresos evitados', num(p * ingresos_evitados))
    print('ahorro revisiones', euros(p * ahorro_revisiones), '| ahorro ingresos', euros(p * ahorro_ingresos),
          '| total', euros(p * (ahorro_revisiones + ahorro_ingresos)))
    piloto = CONTRATO_MENOR // PRECIO_PACIENTE_ANO
    print('piloto por contrato menor: pacientes', piloto, '| facturación', euros(piloto * PRECIO_PACIENTE_ANO))

    publicos = [h for h in hospitales if h['publico'] == '1']

    def tramo(c):
        return '>= 1.000 camas' if c >= 1000 else '500-999' if c >= 500 else '200-499' if c >= 200 else '< 200'

    for nombre, grupo in [('España', publicos), ('Madrid', [h for h in publicos if h['comunidad'] == 'Madrid'])]:
        print(f'\n-- Hospitales generales públicos · {nombre}')
        tot_h = tot_p = tot_f = 0
        for t in ['>= 1.000 camas', '500-999', '200-499', '< 200']:
            hs = [h for h in grupo if tramo(h['camas']) == t]
            camas = sum(h['camas'] for h in hs)
            pac = camas * por_cama
            tot_h += len(hs)
            tot_p += pac
            tot_f += pac * PRECIO_PACIENTE_ANO
            print(f'{t}: hospitales {len(hs)} | camas {camas} | pacientes {num(pac)} | facturación {euros(pac * PRECIO_PACIENTE_ANO)}'
                  f' | por hospital {euros(pac * PRECIO_PACIENTE_ANO / max(1, len(hs)))}')
        print(f'total: hospitales {tot_h} | pacientes {num(tot_p)} | facturación {euros(tot_f)}')

    print('\n-- Plan cliente a cliente (Madrid >= 500 camas)')
    grandes = sorted([h for h in publicos if h['comunidad'] == 'Madrid' and h['camas'] >= 500], key=lambda h: -h['camas'])
    total = 0
    for h in grandes:
        p, f = cliente(h)
        total += f
        print(f"{h['hospital']}: {h['camas']} camas | {num(p)} pacientes | {euros(f)}")
    print('total', len(grandes), 'hospitales', euros(total))
    print('\nEuropa: 2,5 millones de pacientes × precio =', euros(2_500_000 * PRECIO_PACIENTE_ANO))
    print('Contraste Madrid por población:', num(POBLACION_MADRID * (PREV_COLITIS + PREV_CROHN)), 'pacientes')


if __name__ == '__main__':
    datos_reto(sys.argv[1])
    a, b = valor_paciente()
    mercado(sys.argv[2], a, b)
