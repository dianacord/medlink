# Medlink

Prototipo de seguimiento remoto de pacientes crónicos con **colitis ulcerosa** (Aparato Digestivo), hecho para el hackathon Innomakers 4 Health 2026.

El paciente responde una encuesta corta cada 14 días y sube sus analíticas. El médico recibe una bandeja de avisos ordenada por prioridad y decide: archivar, llamar o citar en consulta. Los pacientes estables no ocupan un hueco presencial.

> **Prototipo · datos sintéticos · no usar con pacientes reales.** No se conecta a ningún sistema del hospital. Todo se guarda en el navegador (localStorage e IndexedDB).

**Demo publicada:** https://medlink-lilac.vercel.app · QR en `docs/qr-medlink.png` (y `.svg` para imprimir).

## Arrancar

```bash
npm install
npm run dev        # http://localhost:5173
```

Otros comandos:

| Comando | Qué hace |
|---|---|
| `npm test` | Tests (Vitest) de la lógica de avisos, el texto libre y la lectura de PDFs |
| `npm run build` | Comprobación de tipos y build de producción en `dist/` |
| `npm run datos` | Regenera `data/*.json` a partir de los CSV del hackathon (en `~/data`) |
| `npm run pdfs` | Regenera los 3 PDFs de ejemplo en `public/ejemplos/` |
| `npx vercel --prod` | Publica una versión nueva en https://medlink-lilac.vercel.app |

## Usuarios de prueba

La contraseña de todos es `demo1234`. En la portada, **"Prueba rápida, sin contraseña"** entra directamente como Ana o como la doctora.

| Email | Quién |
|---|---|
| `medico@demo.es` | Dra. Elena Navarro (Aparato Digestivo) |
| `paciente@demo.es` | Ana Ruiz: tiene la encuesta pendiente hoy |
| `javier@demo.es` | Javier Moreno: aviso de prioridad alta |
| `antonio@demo.es` | Antonio Fernández: discapacidad visual, ve la app con letra grande |

Dentro de la app, la barra **"Ver como médico / Ver como paciente"** cambia de rol sin cerrar sesión, para probar el ciclo completo en un solo móvil.

## Recorrido para el demo

1. Entra como **paciente** (Ana) y responde la encuesta: más deposiciones y sangre en heces.
2. Pulsa **Ver como médico**: el aviso de Ana aparece arriba en la bandeja, con prioridad alta.
3. Abre el aviso y propón una **cita telefónica**.
4. **Ver como paciente**: Ana tiene una propuesta de cita y la acepta.
5. En la app del médico, registra el resultado de la llamada como **Estable**: el aviso se archiva y sube el contador de **Impacto**.

También se puede probar:

- **Señal de alarma.** Si el paciente contesta "Sí" a una pregunta de alarma, ve la pantalla roja de Urgencias.
- **Analítica en PDF.** Desde "Subir una analítica" hay 3 PDFs de ejemplo: con valores normales, con valores alterados y con otra prueba que no tiene estos parámetros.
- **Panel `/demo`.** Para presentar: elige un paciente, rellena un caso con un botón y envía la encuesta o una analítica del hospital. Desde ahí también se reinician los datos.

## Cómo funciona

- **Avisos.** Un modelo interno de reglas puntúa cada cambio: valores fuera de rango, cambios bruscos, tendencias, síntomas que empeoran, señales de alarma, encuestas sin responder y peticiones del paciente. La puntuación no se muestra: el médico solo ve la prioridad (alta, media o baja) y qué ha cambiado. Pesos y umbrales en `src/config/prioridad.ts`.
- **Plantilla de colitis ulcerosa.** 4 parámetros (calprotectina, PCR, hemoglobina y albúmina) y 10 preguntas, en `src/config/plantillas.ts`. Pendiente de validar por un especialista.
- **Nada se sobrescribe.** Las respuestas, las analíticas, las decisiones y las versiones del seguimiento se añaden siempre como registros nuevos. Solo el médico ve el historial.
- **El paciente** solo ve lo que tiene pendiente, un estado neutro y sus citas. Nunca ve puntuaciones ni gráficos.
- **Datos.** Los IDs, la edad, el sexo, la preferencia de contacto y la accesibilidad salen de los CSV del hackathon. Los nombres, el NHC y los valores clínicos son inventados (`scripts/capa-clinica.ts`). La pestaña Impacto usa los agregados reales de los CSV (`data/impacto.json`).

## Estructura

```
src/
  config/       plantillas y pesos de prioridad
  logica/       funciones puras: puntuación, calendario, texto libre, PDFs
  datos/        estado (append-only), almacén, sesión, vistas
  componentes/  UI compartida
  paginas/      comun/, medico/, paciente/
scripts/        preparación de datos y PDFs de ejemplo
data/           JSON generados a partir de los CSV
```

Stack: React 19, Vite, TypeScript, Tailwind CSS 4, React Router, pdf.js y pdf-lib.
