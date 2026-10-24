# MedLink · Números para el inversor

Borrador para verificar. Todas las cifras de dinero son **facturación o ahorro al año, en euros**.

Cada número lleva su origen:

- **[Reto]**: datos del hackathon (`~/data`). Son sintéticos y cubren el servicio de Aparato Digestivo entero (no solo colitis ulcerosa), de enero a junio de 2025. Para pasarlos a un año, multiplico por 2.
- **[Fuente n]**: publicación o norma pública, listada al final.
- **[Decisión]**: elección nuestra, con el motivo al lado.

Todos los cálculos se pueden repetir con:

```
python3 -I docs/negocio/calculos.py ~/data docs/negocio/hospitales_generales.csv
```

---

## 1. El problema, en números

Hoy el hospital revisa a cada paciente crónico por calendario: cita cada X meses, esté bien o mal.

Aparato Digestivo del hospital del reto, en un año **[Reto]**:

| | Al año |
|---|---|
| Revisiones programadas | 23.906 |
| Revisiones realizadas | 16.606 |
| Revisiones **no realizadas** (el paciente no vino) | **5.022** (21,0 % de las programadas) |
| Revisiones anuladas | 1.686 |
| Horas de médico en huecos perdidos (5.022 × 20 min) | **1.674 h** |
| Minutos de administración por revisión programada (citar, admitir, reprogramar, volver a llamar) | 9,5 min → **3.786 h** al año |
| Mensajes al paciente por revisión (SMS, llamada, email, carta) | 2,17 → **51.780** al año |
| Espera mediana para una primera consulta | 45 días |
| Derivaciones pendientes de cita (foto a 30 de junio) | 229 |

En el hospital entero (6 especialidades) hay **218.614** revisiones programadas al año, y **53.168** no se realizan **[Reto]**.

Mientras tanto, el paciente que empeora entre dos revisiones no tiene un canal para avisar. Espera a su cita o va a Urgencias.

## 2. Le damos la vuelta

**De revisar por calendario a revisar por necesidad.**

- El paciente responde una encuesta corta cada 14 días y sube su analítica.
- MedLink ordena los avisos por prioridad. El médico solo ve a quien ha cambiado.
- El paciente estable no ocupa un hueco presencial. El que empeora entra antes, sin pasar por Urgencias.

Esto ya se ha medido en un ensayo aleatorizado: 909 pacientes con enfermedad inflamatoria intestinal en 4 hospitales de Países Bajos, seguidos 12 meses **[Fuente 1]**.

| Por paciente y año | Seguimiento habitual | Seguimiento a distancia | Diferencia |
|---|---|---|---|
| Visitas a digestivo o enfermería | 2,34 | 1,55 | **−0,79** |
| Ingresos en el hospital | 0,10 | 0,05 | **−0,05** |
| Calidad percibida (0 a 10) | 8,27 | 8,16 | sin diferencia |

Los brotes, los tratamientos con corticoides, las visitas a Urgencias y las operaciones no cambiaron entre los dos grupos **[Fuente 1]**.

## 3. Qué gana el cliente

El cliente es el hospital público, que paga.

### Por paciente y año

Aplico la diferencia del ensayo a las tarifas oficiales de la Comunidad de Madrid **[Fuente 2]**:

| Concepto | Cálculo | Ahorro |
|---|---|---|
| Revisiones evitadas | 0,79 × 79 € (consulta sucesiva presencial) | **62 €** |
| Ingresos evitados | 0,05 × 3.947 € (ingreso por enfermedad inflamatoria intestinal, el nivel de gravedad más bajo) | **197 €** |
| **Total** | | **260 €** |
| Tiempo de médico liberado | 0,79 × 20 min | 15,8 min |

Como contraste, el estudio de coste del mismo ensayo calcula un ahorro de **547 €** por paciente y año **[Fuente 3]**. Lo cuenta desde el punto de vista de toda la sociedad, no solo del hospital. Me quedo con la cifra más baja.

### Cliente 1: Hospital Universitario de La Princesa

**Pacientes estimados.** La Princesa tiene 524 camas **[Fuente 4]**. Reparto los pacientes de España entre hospitales según sus camas: 2,03 pacientes por cama (ver sección 6). Salen **1.062 pacientes** con enfermedad inflamatoria intestinal: 658 con colitis ulcerosa y 404 con Crohn.

| Al año, con los 1.062 pacientes | |
|---|---|
| Revisiones liberadas | **839** (16 por semana) |
| Horas de médico liberadas | 280 h |
| Ingresos evitados | 53 |
| Ahorro en revisiones | 66.262 € |
| Ahorro en ingresos | 209.532 € |
| **Ahorro total** | **275.794 €** |
| **Lo que paga a MedLink** (1.062 × 30 €) | **31.852 €** |

Con esos 16 huecos semanales, las 229 derivaciones pendientes del reto se citarían en 14 semanas. Es una ilustración: mezcla datos sintéticos del reto con una estimación de pacientes.

## 4. Propuesta de valor

> Por **30 €** al año por paciente, el hospital deja de citar por calendario a los pacientes con enfermedad inflamatoria intestinal que están bien.
>
> Por cada paciente:
> - libera 0,79 revisiones presenciales y evita 0,05 ingresos al año;
> - eso son **260 €** a tarifa oficial de Madrid;
> - la calidad percibida por el paciente no cambia.
>
> En La Princesa: **839 revisiones** y **53 ingresos** menos al año, por **31.852 €**.

## 5. Cómo ganamos dinero

**Licencia anual por paciente activo.** El hospital paga por cada paciente que tiene en seguimiento con MedLink.

**Precio: 30 € por paciente y año [Decisión].** Motivos:

1. **Se paga solo con las revisiones.** El hospital recupera 62 € por paciente solo con las revisiones evitadas, sin contar los ingresos.
2. **Cuesta menos que una sola revisión.** Una revisión no presencial cuesta 56 € a tarifa oficial **[Fuente 2]**.
3. **Cabe en un contrato menor.** Un hospital público puede contratar servicios por hasta **15.000 €** al año sin licitación **[Fuente 5]**. A 30 €, eso son **500 pacientes**: un piloto completo sin concurso.

Así compra el cliente:

| Paso | Qué es | Facturación al año |
|---|---|---|
| 1. Piloto | 500 pacientes, contrato menor | 15.000 € |
| 2. Servicio completo | Todos los pacientes del hospital, por concurso | 31.852 € (La Princesa) |
| 3. Otras enfermedades | Mismo hospital, mismo producto con otra plantilla de preguntas y analíticas | sin cifrar todavía (ver sección 8) |

**Sensibilidad al precio.** Facturación al año si entran todos los pacientes:

| Precio por paciente | La Princesa | 9 hospitales grandes de Madrid | Todos los hospitales generales públicos de España |
|---|---|---|---|
| 30 € | 31.852 € | 437.719 € | 5.694.298 € |
| 60 € | 63.704 € | 875.438 € | 11.388.596 € |
| 90 € | 95.556 € | 1.313.157 € | 17.082.894 € |

Incluso a 90 €, el hospital paga menos de lo que ahorra solo en ingresos (197 €).

## 6. Tamaño del mercado

### Cuántos pacientes hay

| Dato | Valor | Origen |
|---|---|---|
| Población de España, 1 de enero de 2025 | 49.128.297 | [Fuente 6] |
| Colitis ulcerosa por cada 100.000 habitantes (2023) | 316,6 | [Fuente 7] |
| Crohn por cada 100.000 habitantes (2023) | 194,4 | [Fuente 7] |
| **Pacientes con colitis ulcerosa en España** | **155.540** | cálculo |
| **Pacientes con Crohn en España** | **95.505** | cálculo |
| **Total con enfermedad inflamatoria intestinal** | **251.046** | cálculo |
| Camas en hospitales generales (públicos y privados) | 123.900 | [Fuente 4] |
| Pacientes por cama | 2,03 | cálculo |

**Supuesto clave.** Las tasas son de Cataluña. Las aplico a toda España porque es el registro poblacional más reciente que he encontrado.

**Cifra baja.** El estudio nacional EPICURE contó **41.840** pacientes con colitis ulcerosa atendidos en unidades de digestivo en 2011 **[Fuente 8]**. Es el número de pacientes que ya estaban en seguimiento en el hospital hace 14 años, no el total de diagnosticados. Si el mercado real se parece a esta cifra y no a la de Cataluña, los techos de esta sección bajan.

### Segmentación

Criterios, en este orden:

1. **Quién paga.** Primero los hospitales generales **públicos**, porque son los que ahorran el coste de revisiones e ingresos. Los privados cobran por acto: menos visitas son menos ingresos para ellos, así que quedan fuera por ahora. Los hospitales concertados figuran como privados en el catálogo.
2. **Tamaño** (camas). Fija cuántos pacientes tiene cada cliente, es decir, cuánto factura cada venta.
3. **Territorio.** Madrid primero (La Princesa y el reto), después España y después Europa.
4. **Enfermedad.** Colitis ulcerosa y Crohn juntas, porque las lleva la misma unidad y el mismo equipo. Después, otros seguimientos crónicos.

### España · hospitales generales públicos **[Fuente 4]** × 2,03 pacientes por cama × 30 €

| Tamaño | Hospitales | Pacientes | Facturación al año | Por hospital |
|---|---|---|---|---|
| 1.000 camas o más | 11 | 26.640 | 799.212 € | 72.656 € |
| 500 a 999 camas | 53 | 76.720 | 2.301.596 € | 43.426 € |
| 200 a 499 camas | 94 | 60.377 | 1.811.297 € | 19.269 € |
| Menos de 200 camas | 127 | 26.073 | 782.192 € | 6.159 € |
| **Total** | **285** | **189.810** | **5.694.298 €** | |

Si se suman también los hospitales privados y concertados, el techo de España es 251.046 pacientes × 30 € = **7.531.368 €** al año.

### Madrid, cliente a cliente: los 9 hospitales públicos de 500 camas o más

| Hospital | Camas | Pacientes | Facturación al año |
|---|---|---|---|
| 12 de Octubre | 1.161 | 2.352 | 70.572 € |
| Gregorio Marañón | 1.140 | 2.310 | 69.296 € |
| La Paz | 966 | 1.957 | 58.719 € |
| Ramón y Cajal | 886 | 1.795 | 53.856 € |
| Clínico San Carlos | 861 | 1.745 | 52.337 € |
| Puerta de Hierro Majadahonda | 613 | 1.242 | 37.262 € |
| Getafe | 543 | 1.100 | 33.007 € |
| **La Princesa** | 524 | 1.062 | 31.852 € |
| Príncipe de Asturias | 507 | 1.027 | 30.818 € |
| **Total** | | **14.590** | **437.719 €** |

Los 26 hospitales generales públicos de Madrid suman 23.672 pacientes y **710.161 €** al año.

Contraste: aplicando las tasas de prevalencia a la población de Madrid (7.113.886 habitantes) salen 36.352 pacientes. La diferencia con 23.672 son pacientes de hospitales privados y concertados.

### Europa

Entre 2,5 y 3 millones de personas tienen enfermedad inflamatoria intestinal en Europa **[Fuente 9]**. Con la cifra baja y el mismo precio: 2.500.000 × 30 € = **75.000.000 €** al año de techo. El precio en otros países está sin validar.

## 7. La película, cliente a cliente

| Año | Clientes | Facturación al año |
|---|---|---|
| 1 | La Princesa, piloto de 500 pacientes | **15.000 €** |
| 2 | Los 9 hospitales públicos de Madrid con 500 camas o más, todos sus pacientes con enfermedad inflamatoria intestinal | **437.719 €** |
| 3 | Los 64 hospitales públicos de España con 500 camas o más | **3.100.808 €** |

**Supuesto de los años 2 y 3.** Cada hospital mete a todos sus pacientes. Es el máximo de cada cliente, no una previsión. La previsión necesita el dato de adopción del piloto (sección 8).

## 8. Lo que falta para cerrar los números

1. **Adopción.** Qué parte de los pacientes de un hospital entra y sigue respondiendo. El piloto de La Princesa nos da este dato.
2. **Pacientes por hospital.** Hoy salen del reparto por camas. La Princesa tiene una unidad de referencia en enfermedad inflamatoria intestinal (el estudio EpidemIBD lo lideró este hospital **[Fuente 11]**), así que puede tener más pacientes. Conviene pedir el número real a la unidad.
3. **Ahorro por ingresos.** En el ensayo, la diferencia en ingresos es justa (p = 0,046). La de revisiones es firme (p < 0,0001). Si solo contamos revisiones, el ahorro es de 62 € por paciente: sigue siendo el doble del precio.
4. **Otras enfermedades.** La psoriasis afecta al 2,3 % de la población: unas 1,13 millones de personas **[Fuente 10]**. Falta saber cuántas siguen en revisión en el hospital, por ejemplo las que toman metotrexato, para poder cifrar ese segmento.
5. **Nuestros costes.** Servidor, soporte e integración con la historia clínica de cada hospital, por paciente y año. Sin ese dato no hay margen.
6. **Datos del reto.** Son sintéticos y de todo Digestivo. Sirven para ilustrar el problema, no como cifra del hospital real.

## Fuentes

1. de Jong MJ et al. *Telemedicine for management of inflammatory bowel disease (myIBDcoach)*. Lancet 2017;390:959-968. [Resumen](https://pure.amsterdamumc.nl/en/publications/telemedicine-for-management-of-inflammatory-bowel-disease-myibdco/)
2. Orden 1975/2023, de 29 de diciembre, de la Consejería de Sanidad de la Comunidad de Madrid, precios públicos (BOCM n.º 310, 30/12/2023). Anexo I.2: consulta sucesiva presencial 79 €, no presencial 56 €. Ingreso por enfermedad inflamatoria intestinal, nivel 1: 3.947 €. [PDF](https://www.comunidad.madrid/transparencia/sites/default/files/bocm-20231230-3.pdf)
3. de Jong MJ et al. *Cost-effectiveness of telemedicine-directed specialized vs standard care for patients with inflammatory bowel diseases*. Clin Gastroenterol Hepatol 2020;18:1744-52. Cifra de 547 € tomada del resumen de la tesis doctoral. [Tesis](https://scholarlypublications.universiteitleiden.nl/access/item%3A3463280/view)
4. Ministerio de Sanidad, Catálogo Nacional de Hospitales 2025 (datos a 31/12/2024). Extracto de los 549 hospitales generales en `hospitales_generales.csv`. [Web](https://www.sanidad.gob.es/estadEstudios/estadisticas/sisInfSanSNS/ofertaRecursos/hospitales/home.htm)
5. Ley 9/2017 de Contratos del Sector Público, art. 118: contratos menores de servicios de hasta 15.000 € sin impuestos.
6. Instituto Nacional de Estadística, Censo anual de población 2025. [Nota](https://ine.es/dyngs/Prensa/CensoVariables2025.htm)
7. *Update on the Prevalence, Incidence, Mortality, and Trends in Treatment of Inflammatory Bowel Disease in a Population-Based Registry in Catalonia Between 2017 and 2023*. J Clin Med 2025;14:5711, tabla 1. [Artículo](https://pmc.ncbi.nlm.nih.gov/articles/PMC12386801/)
8. Estudio EPICURE: *Epidemiology and hospital resources use in the treatment of ulcerative colitis at gastroenterology units in Spain*. [Artículo](https://pmc.ncbi.nlm.nih.gov/articles/PMC5842877/)
9. Burisch J et al. *The burden of inflammatory bowel disease in Europe*. J Crohns Colitis 2013. [Registro](https://research.regionh.dk/da/publications/the-burden-of-inflammatory-bowel-disease-in-europe/)
10. Ferrándiz C, Carrascosa JM, Toro M. *Prevalencia de la psoriasis en España en la era de los agentes biológicos*. Actas Dermosifiliogr 2014. [Artículo](https://actasdermo.org/es-prevalence-psoriasis-in-spain-in-articulo-S157821901400122X)
11. Incidencia en España, estudio EpidemIBD liderado por La Princesa. [Nota del hospital](https://www.comunidad.madrid/hospital/laprincesa/noticia/60607)
