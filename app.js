/**
 * Main Application Logic & API Connections for Contract Auditor
 */

// System Prompt from instructions
const DEFAULT_SYSTEM_PROMPT = `Eres un auditor jurídico-técnico senior en contratación estatal colombiana, especializado en control de calidad documental, consistencia interdocumental y prevención de reprocesos (incluido SECOP II). Tu misión es revisar el documento principal y sus soportes con estándar forense: detectar, evidenciar y corregir todos los errores, inconsistencias, omisiones, ambigüedades y riesgos identificables con base en el material aportado, sin imponer límites al número de hallazgos.

REGLAS DURAS (obligatorias)

Cero invención: no completes ni supongas números, fechas, valores, nombres, dependencias, CDP/CRP, pólizas, memorandos, radicados, anexos o cláusulas. Si no está en el texto aportado, es faltante/no verificable.

Trazabilidad: todo hallazgo debe indicar ubicación precisa (sección/cláusula/numeral/página si existe, o frase guía) y qué documento lo soporta o lo contradice.

Comillas: no uses comillas salvo transcripción literal de texto pegado por el usuario. Para transcribir literal, prefiere bloque de texto/código y copia exactamente.

Separación: distingue siempre entre (i) dato documental, (ii) inferencia (marcada como inferencia), (iii) criterio técnico-jurídico, (iv) conclusión/acción.

Preguntas: solo las indispensables para cerrar inconsistencias materiales; pide el soporte mínimo o el dato exacto.

MÉTODO DE AUDITORÍA (siempre, aunque el usuario no lo pida)
A) Inventario: identifica documento principal y soportes; si el usuario no lo indica, asume como principal el primer documento aportado y decláralo.
B) Ficha maestra: extrae del principal todos los datos críticos presentes: contrato (número/año), partes, objeto, alcance, plazo (fechas/duración/hitos), valor (inicial/adición/total/impuestos si figuran), forma de pago, CDP/CRP/rubros si figuran, supervisión/interventoría, garantías/pólizas (amparos, valores, vigencias, aseguradora), naturaleza de la modificación (prórroga/adición/otrosí/etc.), anexos citados, firmas/competencia formal según el texto.
C) Cruce campo-por-campo: valida cada dato de la ficha contra soportes; reporta divergencias y también conflictos entre soportes (aunque el principal coincida con uno).
D) Coherencia interna: detecta contradicciones dentro del principal (considerandos vs cláusulas; tablas vs texto; fechas vs plazo; valor vs forma de pago; vigencias vs efectos; remisiones; numeración; anexos citados no aportados).
E) Temporalidad y garantías: verifica consistencia de fechas/duración y alineación de garantías con la modificación (vigencias y cuantías frente a prórroga/adición). Si el texto permite, haz verificación aritmética exacta y reporta discrepancias.
F) Redacción formal: ortografía, puntuación, concordancia, repeticiones, duplicidades, textos fuera de contexto, uniformidad terminológica (prórroga/adición/otrosí; vigencia/plazo; ejecución/terminación).
G) Barrido final: relectura completa del principal y revisión dirigida de soportes para asegurar que no queden hallazgos sin reportar.

SEVERIDAD (sin omitir)
Clasifica cada hallazgo como Alta/Media/Baja con razón técnica. Alta: afecta sentido jurídico/financiero, fechas/plazos/vigencias, valor total/adición, CDP/CRP, garantías, identificación de partes/contrato, no se copio literal la obligación o impide publicación/gestión operativa.

FORMATO DE SALIDA (obligatorio, siempre en este orden)

Dictamen ejecutivo: estado general (consistente con ajustes / inconsistente / no verificable por falta de soportes) y por qué.

Ficha maestra (principal): datos críticos extraídos + ubicación. Si hay conflictos, remite a la matriz.

Matriz exhaustiva de hallazgos (sin límite): tabla con columnas:
ID; Ubicación; Tipo (interdocumental/interna/faltante/material/redacción/SECOP/riesgo); Evidencia principal; Evidencia soporte(s) o no verificable; Diagnóstico; Corrección aplicable (texto listo o instrucción exacta); Severidad y razón.
Regla: no des recomendaciones vagas; cada fila debe ser ejecutable o quedar marcada como faltante con el soporte requerido.

Conflictos entre soportes: lista completa de choques entre soportes, indicando qué sostiene cada uno y qué dato debe confirmarse si no se puede dirimir documentalmente.

Redlines listos para pegar: para hallazgos Alta y Media, entrega reemplazos textuales completos cuando sea posible; si falta el dato, usa marcador [●] y especifica qué soporte lo debe suministrar.

Comentarios pegables para Word: observaciones cortas y accionables para insertar como comentario, referenciando ubicación (incluye todos los Alta y Media).

Faltantes/no verificables: lista completa de lo que no puede verificarse con lo aportado y el soporte mínimo requerido.

Autocontrol RACCCA: seis líneas (Relevancia, Exactitud, Completitud, Claridad, Coherencia, Adecuación) indicando qué verificación aplicaste y el principal límite por información disponible.

MODO COMPARACIÓN LITERAL (cuando el usuario lo pida)
Comparación literal línea por línea de apartes indicados, preservando texto; tabla con: Fragmento A; Fragmento B; ¿idéntico?; diferencia puntual; tipo (forma/fondo); impacto; corrección recomendada. Detecta omisiones, adiciones y reordenamientos, incluso mínimos.

GESTIÓN DE RESPUESTAS LARGAS (sin perder hallazgos)
Si el volumen excede el máximo de salida, divide en Parte 1, Parte 2, etc., mantén IDs consecutivos y continúa en el siguiente mensaje cuando el usuario diga CONTINUAR. No resumas hallazgos por limitación de espacio: particiona.

ESTILO
Tono técnico, sobrio y operativo. Cero relleno. Máxima precisión y trazabilidad. No uses comillas salvo transcripción literal del usuario.`;

// System Prompt for Diana Contrate
const DIANA_SYSTEM_PROMPT = `Actúa como un auditor experto en contratación pública colombiana, con especialización y maestría en contratación pública y control documental de documentos de necesidad de contratación. Tu función es revisar los documentos de necesidad que el usuario cargue conforme a la normatividad colombiana, identifica si hay coherencia entre los diferentes capítulos del documento y luego compararlos contra el documento base incluido en tus conocimientos, denominado “Formato de Radicación de Necesidad de Contratación ante la Unidad de Compras Públicas” y la coherencia entre documentos.
Debes verificar si el documento entregado es coherente en si mismo y además verifica si conserva la estructura, títulos, subtítulos, tablas, anexos y elementos sustanciales del formato base. Tu revisión debe enfocarse en aspectos contractuales y especialmente en detectar si el documento analizado eliminó, omitió, modificó,  o alteró el orden de alguno de los títulos o apartados exigidos.
Lo primero que haces es  verificar cada título del formato base mediante búsqueda textual específica dentro del documento revisado. No puedes clasificar un título como “No cumple” únicamente porque no aparezca en el primer fragmento visible o porque el documento esté truncado. Si el archivo es extenso, busca expresamente cada sección por palabras clave y variantes de nombre. Solo marca “No cumple” cuando hayas confirmado que el título no aparece en el documento. Si el título aparece más adelante, evalúa su contenido como “Cumple” o “Cumple parcialmente”.
Diferencia entre “no encontrado por limitación de lectura” y “omitido en el documento”. Si no puedes verificar el documento completo, debes advertirlo expresamente.
Durante la revisión del documento de necesidad, estudios previos, anexos técnicos, fichas técnicas, presupuesto o cualquier documento soporte, deberás generar una alerta expresa cuando se evidencie cualquiera de las siguientes situaciones: 1. Referencia al impuesto de timbre marca como Alerta Alta. 2. Inclusión de marcas específicas en bienes o servicios Cuando se evidencie una marca específica, es decir si se insertó una marca para algún elemento esto es grave. 3. Cuando hay incoherencia entre el propio documento o entre documentos. 
Documento base de comparación. Usa como referencia obligatoria el formato base cargado en tus conocimientos. Este documento contiene, entre otros, los siguientes bloques principales:
Requerimiento: bien, servicio, obra u otro.
Datos del solicitante.
Anexos.
Documentos o constancias técnicas especiales.
Necesidad.
Descripción de la necesidad.
Antecedentes.
Alternativas estudiadas para satisfacer la necesidad.
Alcance de la necesidad.
Coherencia con los instrumentos de planeación.
Propuesta de obligaciones específicas.
Requisitos ambientales.
Requisitos en materia de seguridad y salud en el trabajo.
Condiciones técnicas mínimas del contratista.
Criterios adicionales y condiciones técnicas del contratista de mayor valor o calidad.
Plazo de ejecución del contrato.
Fecha estimada en la que se requiere la obra, bien o servicio terminado.
Periodicidad y forma de entrega.
Acuerdos de Niveles de Servicio — ANS.
Riesgos previsibles.
Observaciones generales.
Territorialización del bien o servicio solicitado.
Valor estimado y justificación.
Identificación presupuestal.
Supervisión o interventoría.
Información de las personas designadas por la dependencia solicitante.
Firma, elaboró, revisó y aprobó.
Instrucciones de auditoría
Cuando el usuario cargue un documento de necesidad, realiza la revisión siguiendo estos pasos:
Identifica el tipo de documento cargado.
Confirma si corresponde a un documento de necesidad, formato de radicación, solicitud de contratación o documento equivalente.
Compara la estructura contra el formato base.
Revisa título por título, subtítulo por subtítulo y tabla por tabla.
Detecta omisiones.
Advierte expresamente si falta alguno de los títulos, subtítulos, tablas o campos del formato base. No minimices omisiones. Si falta un título completo, clasifícalo como hallazgo relevante.
Detecta modificaciones de nombres.
Si el documento conserva el contenido pero cambió el nombre del título, indícalo como “título modificado o renombrado” y explica cuál era el nombre original y cuál aparece en el documento revisado.
Detecta eliminaciones indebidas.
Si el documento eliminó una tabla o sección que solo podía eliminarse en casos específicos, por ejemplo anexos de obra pública, arrendamiento, consultoría o prestación de servicios profesionales, verifica si el documento justifica que no aplica. Si no hay justificación clara, márcalo como posible eliminación indebida.
Diferencia entre ausencia total y ausencia parcial.
Clasifica cada hallazgo así:
Cumple: el título y su contenido están presentes.
Cumple parcialmente: el título está presente, pero falta contenido, tabla, explicación o soporte.
No cumple: el título o elemento fue omitido.
No aplica justificado: el documento explica razonablemente que la sección no aplica.
No aplica no justificado: la sección fue eliminada o marcada como no aplicable sin explicación suficiente.
Evalúa coherencia interna.
Verifica si la necesidad, el alcance, el plazo, las obligaciones, el presupuesto, los riesgos y la supervisión guardan relación entre sí.
No inventes información.
Si un dato no aparece en el documento, debes decir: “No se evidencia en el documento revisado”.
No corrijas el documento directamente salvo que el usuario lo pida.
Tu tarea principal es auditar, advertir omisiones and emitir recomendaciones.
Usa lenguaje profesional, claro y preventivo.
Evita afirmaciones absolutas cuando no tengas certeza. Usa expresiones como “se evidencia”, “no se evidencia”, “podría requerir ajuste”, “se recomienda incorporar”.
Formato obligatorio de respuesta
Entrega siempre la auditoría en este formato:
Informe de auditoría documental
1. Resultado general
Indica una de estas categorías:
Cumple integralmente
Cumple con observaciones
Cumple parcialmente
No cumple por omisiones relevantes
Incluye un resumen breve de máximo dos líneas.
2. Matriz de comparación contra el formato base
Presenta una tabla con estas columnas:
No.	Título o elemento del formato base	Estado	Observación	Recomendación
En “Estado” usa únicamente:
Cumple / Cumple parcialmente / No cumple / No aplica justificado / No aplica no justificado.
3. Títulos omitidos o eliminados
Incluye una lista expresa de los títulos que no aparecen en el documento revisado.
Si no hay omisiones, responde:
“No se identificaron títulos omitidos frente al formato base.”
4. Títulos modificados o renombrados
Incluye una tabla así:

Título original del formato base	Título encontrado en el documento revisado	Observación

Si no hay cambios, responde:
“No se identificaron títulos modificados o renombrados.”
Cuando te entregué otros documentos indícame si hay coherencia entre los mismos o en su contenido.
5. Elementos incompletos
Identifica secciones que existen, pero están vacías, incompletas o sin soporte suficiente.
6. Alertas críticas
Falta de coherencia entre el propio documento e indica donde y la razón de ello.
Encuentra una contradicción entre el documento y el ordenamiento jurídico colombiano e indica la razón. 
Incluye alertas cuando falten elementos relevantes como:
Descripción de la necesidad.
Antecedentes.
Alcance de la necesidad.
Coherencia con POAI o Plan Anual de Adquisiciones.
Obligaciones específicas.
Requisitos ambientales.
Requisitos de seguridad y salud en el trabajo.
Condiciones técnicas mínimas.
Plazo de ejecución.
Riesgos previsibles.
Valor estimado y justificación.
Identificación presupuestal.
Supervisión o interventoría.
Clasifica cada alerta como:
Alta: puede afectar la viabilidad o estructuración del proceso contractual.
Media: requiere ajuste para mejorar completitud o trazabilidad.
Baja: aspecto formal o de presentación.
7. Recomendaciones finales
Entrega recomendaciones concretas para que el documento quede alineado con el formato base.
8. Conclusión
Finaliza con una conclusión breve indicando si el documento puede continuar su trámite o si requiere ajustes previos.
Restricciones
revisa que exista coherencia con los demás documentos, de no existir manda una alerta critica y grave indicando las incoherencias con los otros documentos. 
No debes omitir hallazgos por considerarlos menores.
No debes asumir que una sección “no aplica” si el documento no lo justifica.
No debes inventar anexos, soportes, valores, fechas, responsables ni justificaciones.`;

// Application State
// Las API keys ya no se manejan en el frontend — el servidor proxy las gestiona desde .env
const state = {
  provider: 'openai',
  model: {
    openai: 'gpt-4o-mini',
    gemini: 'gemini-1.5-flash'
  },
  temperature: 0.1,
  mainDocument: { name: '', text: '', size: 0 },
  supportDocuments: [], // array of { name, text, size }
  baseDocument: { name: '', text: '', size: 0 }, // optional base format template
  knowledgeDocuments: [], // array of { name, text, size } of reference laws/norms
  history: [],
  currentAudit: null,
  isAuditing: false,
  activeTool: 'auditor',
  coherenceResults: [],       // [{text, severity}] — from runCoherenceCheck
  matrizComparacionData: null, // parsedData — from runMatrizComparacion
  promptAuditor: DEFAULT_SYSTEM_PROMPT,
  promptDiana: DIANA_SYSTEM_PROMPT,
  systemPrompt: DEFAULT_SYSTEM_PROMPT
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHistory();
  setupEventListeners();
  updateUI();
  checkForLocalBaseFormat();
  loadLocalKnowledgeDocuments();
});

// Setup Settings and State from localStorage
function loadSettings() {
  const savedProvider    = localStorage.getItem('auditor_provider');
  const savedOpenaiModel = localStorage.getItem('auditor_model_openai');
  const savedGeminiModel = localStorage.getItem('auditor_model_gemini');
  const savedTemp        = localStorage.getItem('auditor_temp');
  const savedActiveTool  = localStorage.getItem('auditor_active_tool');
  const savedPromptAuditor = localStorage.getItem('auditor_prompt');
  const savedPromptDiana   = localStorage.getItem('auditor_prompt_diana');

  if (savedProvider)    state.provider = savedProvider;
  if (savedOpenaiModel) state.model.openai = savedOpenaiModel;
  if (savedGeminiModel) state.model.gemini = savedGeminiModel;
  if (savedTemp)        state.temperature  = parseFloat(savedTemp);
  if (savedActiveTool)  state.activeTool   = savedActiveTool;
  if (savedPromptAuditor) state.promptAuditor = savedPromptAuditor;
  if (savedPromptDiana) {
    if (!savedPromptDiana.includes('Falta de coherencia entre el propio documento e indica donde y la razón de ello.')) {
      state.promptDiana = DIANA_SYSTEM_PROMPT;
      localStorage.setItem('auditor_prompt_diana', DIANA_SYSTEM_PROMPT);
    } else {
      state.promptDiana = savedPromptDiana;
    }
  }

  state.systemPrompt = state.activeTool === 'auditor' ? state.promptAuditor : state.promptDiana;

  document.getElementById('api-provider').value  = state.provider;
  document.getElementById('model-select').value  = state.model[state.provider];
  document.getElementById('temperature-input').value = state.temperature;
  document.getElementById('tool-select').value   = state.activeTool;
  document.getElementById('system-prompt-textarea').value = state.systemPrompt;
}

function saveSettings() {
  localStorage.setItem('auditor_provider', state.provider);
  localStorage.setItem('auditor_model_openai', state.model.openai);
  localStorage.setItem('auditor_model_gemini', state.model.gemini);
  localStorage.setItem('auditor_temp', state.temperature.toString());
  localStorage.setItem('auditor_active_tool', state.activeTool);

  if (state.activeTool === 'auditor') {
    state.promptAuditor = state.systemPrompt;
    localStorage.setItem('auditor_prompt', state.promptAuditor);
  } else {
    state.promptDiana = state.systemPrompt;
    localStorage.setItem('auditor_prompt_diana', state.promptDiana);
  }
}

function loadHistory() {
  const savedHistory = localStorage.getItem('auditor_history');
  if (savedHistory) {
    try {
      state.history = JSON.parse(savedHistory);
    } catch (e) {
      state.history = [];
    }
  }
}

function saveHistory() {
  localStorage.setItem('auditor_history', JSON.stringify(state.history));
  renderHistoryList();
}

// UI Actions & Event Listeners
function setupEventListeners() {
  // Navigation Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Settings Events
  document.getElementById('api-provider').addEventListener('change', (e) => {
    state.provider = e.target.value;
    updateModelOptions();
    saveSettings();
  });

  const btnRunMatriz = document.getElementById('btn-run-matriz');
  if (btnRunMatriz) {
    btnRunMatriz.addEventListener('click', () => runMatrizComparacion());
  }


  document.getElementById('model-select').addEventListener('change', (e) => {
    state.model[state.provider] = e.target.value;
    saveSettings();
  });

  document.getElementById('temperature-input').addEventListener('input', (e) => {
    state.temperature = parseFloat(e.target.value) || 0.1;
    saveSettings();
  });

  document.getElementById('system-prompt-textarea').addEventListener('input', (e) => {
    state.systemPrompt = e.target.value;
    saveSettings();
  });

  // Tool Selector change event
  document.getElementById('tool-select').addEventListener('change', (e) => {
    state.activeTool = e.target.value;
    state.systemPrompt = state.activeTool === 'auditor' ? state.promptAuditor : state.promptDiana;
    document.getElementById('system-prompt-textarea').value = state.systemPrompt;
    saveSettings();
    updateUI();
  });

  // Reset Prompt Button
  document.getElementById('btn-reset-prompt').addEventListener('click', () => {
    if (confirm('¿Estás seguro de restaurar el prompt de sistema original?')) {
      if (state.activeTool === 'auditor') {
        state.promptAuditor = DEFAULT_SYSTEM_PROMPT;
        state.systemPrompt = DEFAULT_SYSTEM_PROMPT;
      } else {
        state.promptDiana = DIANA_SYSTEM_PROMPT;
        state.systemPrompt = DIANA_SYSTEM_PROMPT;
      }
      document.getElementById('system-prompt-textarea').value = state.systemPrompt;
      saveSettings();
      showToast('Prompt restaurado correctamente');
    }
  });

  // Text Inputs
  document.getElementById('main-doc-text').addEventListener('input', (e) => {
    const val = e.target.value;
    if (state.supportDocuments.length === 0 || 
        (state.supportDocuments.length === 1 && 
         (state.supportDocuments[0].name === 'Texto pegado manualmente' || state.supportDocuments[0].name === 'Texto copiado/pegado'))) {
      state.supportDocuments = [{
        name: 'Texto copiado/pegado',
        text: val,
        size: val.length
      }];
      state.mainDocument = state.supportDocuments[0];
      updateFileStats();
    } else {
      // If we have files loaded, keep the list but update audit button state
      const startBtn = document.getElementById('btn-start-audit');
      if (startBtn) {
        startBtn.disabled = !val.trim();
      }
    }
  });

  // Drag and Drop Files
  setupDragAndDrop('main-upload-zone', (file, text) => {
    state.supportDocuments.push({ name: file.name, text, size: text.length });

    if (state.supportDocuments.length === 1) {
      state.mainDocument = state.supportDocuments[0];
    }

    const combinedText = state.supportDocuments.map((doc, idx) =>
      `=== DOCUMENTO ${idx + 1}: ${doc.name} ===\n${doc.text}\n`
    ).join('\n');

    document.getElementById('main-doc-text').value = combinedText;
    updateFileStats();
    showToast(`Documento cargado: ${file.name}`);
  });

  setupDragAndDrop('support-upload-zone', (file, text) => {
    state.supportDocuments.push({ name: file.name, text, size: text.length });

    if (state.supportDocuments.length === 1) {
      state.mainDocument = state.supportDocuments[0];
    }

    const combinedText = state.supportDocuments.map((doc, idx) =>
      `=== DOCUMENTO ${idx + 1}: ${doc.name} ===\n${doc.text}\n`
    ).join('\n');

    document.getElementById('main-doc-text').value = combinedText;
    updateFileStats();
    showToast(`Soporte cargado: ${file.name}`);
  });

  setupDragAndDrop('base-upload-zone', (file, text) => {
    state.baseDocument = { name: file.name, text, size: text.length };
    updateFileStats();
    showToast(`Formato base cargado: ${file.name}`);
  });

  setupDragAndDrop('knowledge-upload-zone', (file, text) => {
    state.knowledgeDocuments.push({ name: file.name, text, size: text.length });
    updateFileStats();
    showToast(`Normativa cargada: ${file.name}`);
  });

  // Clear documents
  document.getElementById('btn-clear-docs').addEventListener('click', () => {
    state.mainDocument = { name: '', text: '', size: 0 };
    state.supportDocuments = [];
    state.baseDocument = { name: '', text: '', size: 0 };
    state.knowledgeDocuments = [];
    document.getElementById('main-doc-text').value = '';
    updateFileStats();
    showToast('Documentos limpiados');
  });

  // Start Audit
  document.getElementById('btn-start-audit').addEventListener('click', startAudit);

  // Compare Tab Actions
  document.getElementById('btn-compare').addEventListener('click', runComparison);

  // Setup Search/Filters for Findings Table
  document.getElementById('finding-search').addEventListener('input', filterFindingsTable);

  const filterBadges = document.querySelectorAll('.filter-badge');
  filterBadges.forEach(badge => {
    badge.addEventListener('click', () => {
      filterBadges.forEach(b => b.classList.remove('active'));
      badge.classList.add('active');
      filterFindingsTable();
    });
  });
}

function updateModelOptions() {
  const modelSelect = document.getElementById('model-select');
  modelSelect.innerHTML = '';

  let options = [];
  if (state.provider === 'openai') {
    options = [
      { value: 'gpt-4o-mini', label: 'GPT-4o-Mini (Económico / Recomendado)' },
      { value: 'gpt-4o', label: 'GPT-4o (Avanzado / Costoso)' }
    ];
  } else {
    options = [
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Económico / Recomendado)' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Avanzado / Costoso)' }
    ];
  }

  options.forEach(opt => {
    const el = document.createElement('option');
    el.value = opt.value;
    el.textContent = opt.label;
    modelSelect.appendChild(el);
  });

  modelSelect.value = state.model[state.provider];
}

function switchTab(tabId) {
  // Update Buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update Panels
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabId}`);
  });
}

// Drag and drop setup helper
function setupDragAndDrop(elementId, onFileLoaded) {
  const zone = document.getElementById(elementId);

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragover');
  });

  zone.addEventListener('dragleave', () => {
    zone.classList.remove('dragover');
  });

  zone.addEventListener('drop', async (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    for (let file of files) {
      await processUploadedFile(file, onFileLoaded);
    }
  });

  // File explorer click event
  zone.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = elementId.includes('support') || elementId.includes('main') || elementId.includes('knowledge');
    input.accept = '.txt,.pdf,.docx';

    input.onchange = async () => {
      for (let file of input.files) {
        await processUploadedFile(file, onFileLoaded);
      }
    };
    input.click();
  });
}

// Process Uploaded File Client-side
async function processUploadedFile(file, callback) {
  const extension = file.name.split('.').pop().toLowerCase();

  try {
    showToast(`Procesando ${file.name}...`);
    const reader = new FileReader();

    if (extension === 'txt') {
      reader.onload = (e) => callback(file, e.target.result);
      reader.readAsText(file);
    } else if (extension === 'pdf') {
      reader.onload = async (e) => {
        try {
          const text = await extractTextFromPDF(e.target.result);
          callback(file, text);
        } catch (err) {
          console.error(err);
          showToast(`Error al leer PDF: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (extension === 'docx') {
      reader.onload = async (e) => {
        try {
          const text = await extractTextFromDocx(e.target.result);
          callback(file, text);
        } catch (err) {
          console.error(err);
          showToast(`Error al leer archivo de Word: ${err.message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      showToast(`Formato no soportado: .${extension}`);
    }
  } catch (err) {
    showToast(`Error de lectura: ${err.message}`);
  }
}

// PDF.js worker extraction
async function extractTextFromPDF(arrayBuffer) {
  const pdfjsLib = window['pdfjs-dist/build/pdf'];
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  let text = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += `[PÁGINA ${i}]\n${pageText}\n\n`;
  }
  return text;
}

// Mammoth extraction
async function extractTextFromDocx(arrayBuffer) {
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Auto-check and preload format base file from directory
async function checkForLocalBaseFormat() {
  const filenames = [
    'Formato+de+necesidad REV 19_05_26 (2) 7 (1).docx',
    'Formato+de+necesidad%20REV%2019_05_26%20(2)%207%20(1).docx',
    'Formato_Base.docx',
    'formato_base.docx'
  ];

  for (let filename of filenames) {
    try {
      const response = await fetch(encodeURI(filename));
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const text = await extractTextFromDocx(arrayBuffer);
        state.baseDocument = {
          name: filename.replace(/%20/g, ' ').replace(/%2B/g, '+'),
          text: text,
          size: arrayBuffer.byteLength
        };
        updateFileStats();
        showToast(`Formato Base cargado automáticamente: ${state.baseDocument.name}`);
        break;
      }
    } catch (e) {
      // ignore and try next filename candidate
    }
  }
}

// Auto-check and preload local norm documents
async function loadLocalKnowledgeDocuments() {
  const filenames = [
    'Decreto_1082_de_2015_Sector_Administrativo_de_Planeación_Nacional (1).pdf',
    'Ley_1150_de_2007 (1).pdf',
    'Ley_80_de_1993 (1).pdf'
  ];

  for (let filename of filenames) {
    try {
      const response = await fetch(encodeURI(filename));
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const text = await extractTextFromPDF(arrayBuffer);
        
        if (!state.knowledgeDocuments.some(d => d.name === filename)) {
          state.knowledgeDocuments.push({
            name: filename.replace(/_/g, ' ').replace(/ \(1\)/, ''),
            text: text,
            size: arrayBuffer.byteLength
          });
        }
      }
    } catch (e) {
      console.log('Error al precargar norma local:', filename, e);
    }
  }
  updateFileStats();
}

// Update file display count and size in Sidebar
function updateFileStats() {
  const mainList = document.getElementById('main-doc-list');
  if (mainList) {
    mainList.innerHTML = '';
    state.supportDocuments.forEach((doc, index) => {
      const item = createDocItemEl(doc.name, doc.size, () => {
        state.supportDocuments.splice(index, 1);

        if (state.supportDocuments.length > 0) {
          state.mainDocument = state.supportDocuments[0];
        } else {
          state.mainDocument = { name: '', text: '', size: 0 };
        }

        const combinedText = state.supportDocuments.map((d, idx) =>
          `=== DOCUMENTO ${idx + 1}: ${d.name} ===\n${d.text}\n`
        ).join('\n');
        document.getElementById('main-doc-text').value = combinedText;

        updateFileStats();
      });
      mainList.appendChild(item);
    });
  }

  // Render Base Document Item
  const baseList = document.getElementById('base-doc-list');
  if (baseList) {
    baseList.innerHTML = '';
    if (state.baseDocument.text) {
      const item = createDocItemEl(state.baseDocument.name, state.baseDocument.size, () => {
        state.baseDocument = { name: '', text: '', size: 0 };
        updateFileStats();
      });
      baseList.appendChild(item);
    }
  }

  // Render Knowledge Document Items
  const knowledgeList = document.getElementById('knowledge-doc-list');
  if (knowledgeList) {
    knowledgeList.innerHTML = '';
    state.knowledgeDocuments.forEach((doc, index) => {
      const item = createDocItemEl(doc.name, doc.size, () => {
        state.knowledgeDocuments.splice(index, 1);
        updateFileStats();
      });
      knowledgeList.appendChild(item);
    });
  }

  // Enable/Disable Audit button
  const startBtn = document.getElementById('btn-start-audit');
  if (startBtn) {
    const mainDocTextVal = document.getElementById('main-doc-text') ? document.getElementById('main-doc-text').value.trim() : '';
    startBtn.disabled = !mainDocTextVal && state.supportDocuments.length === 0;
  }
}

function createDocItemEl(name, size, onRemove) {
  const div = document.createElement('div');
  div.className = 'doc-item';

  const sizeKB = (size / 1024).toFixed(1);

  div.innerHTML = `
    <div class="doc-info">
      <span class="doc-name">${name}</span>
      <span class="doc-meta">(${sizeKB} KB)</span>
    </div>
  `;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'doc-remove';
  removeBtn.innerHTML = '&times;';
  removeBtn.onclick = onRemove;

  div.appendChild(removeBtn);
  return div;
}

// API Streaming Logic
async function startAudit() {
  if (state.isAuditing) return;

  state.isAuditing = true;
  document.getElementById('btn-start-audit').disabled = true;
  document.getElementById('btn-start-audit').innerHTML = '<span class="spinner"></span> Auditar';

  // Clear previous results console and module state
  const consoleEl = document.getElementById('stream-console');
  consoleEl.innerHTML = '';
  state.coherenceResults = [];
  state.matrizComparacionData = null;

  // Switch to auditor stream view
  switchTab('activa');

  // Build Prompts
  const combinedText = document.getElementById('main-doc-text').value.trim();
  let userContent = '';

  let knowledgeText = '';
  if (state.knowledgeDocuments.length > 0) {
    knowledgeText = state.knowledgeDocuments.map((doc, idx) => {
      return `[NORMATIVA/CONOCIMIENTO DE REFERENCIA ${idx + 1} (${doc.name})]:\n${doc.text}\n=== FIN NORMATIVA/CONOCIMIENTO DE REFERENCIA ${idx + 1} ===`;
    }).join('\n\n');
  }

  if (state.activeTool === 'auditor') {
    if (state.supportDocuments.length > 0 || combinedText.includes('DOCUMENTO')) {
      userContent = `⚠️ INSTRUCCIÓN GENERAL PARA EL AUDITOR: Se han aportado múltiples documentos del expediente (Contrato, Soportes, Anexos, etc.) consolidados en el siguiente bloque. Es OBLIGATORIO realizar un cruce campo-por-campo identificando cuál es el documento principal y cuáles son sus soportes, y validando cada dato. Reporta detalladamente cualquier divergencia o contradicción en la sección "Conflictos entre soportes" y agrégala a la matriz de hallazgos.\n\n`;
    }

    userContent += `DOCUMENTOS APORTADOS AL EXPEDIENTE A AUDITAR:
--- INICIO DOCUMENTOS ---
${combinedText}
--- FIN DOCUMENTOS ---`;

    if (knowledgeText) {
      userContent += `\n\nNORMATIVAS Y LEYES DE REFERENCIA ADICIONALES (El Auditor Jurídico-Técnico debe evaluar conformidad frente a estas normas):
--- INICIO NORMATIVAS ---
${knowledgeText}
--- FIN NORMATIVAS ---`;
    }
  } else {
    const baseText = state.baseDocument.text || 'Formato de Radicación de Necesidad de Contratación ante la Unidad de Compras Públicas (estructura estándar)';

    if (state.supportDocuments.length > 1 || (state.supportDocuments.length > 0 && combinedText.match(/DOCUMENTO\s+[2-9]/))) {
      // Multiple documents — force explicit coherence analysis
      const docList = state.supportDocuments.map((d, i) => `  • Documento ${i + 1}: ${d.name}`).join('\n');
      userContent = `⚠️ INSTRUCCIÓN CRÍTICA PARA DIANA CONTRATE — ANÁLISIS DE COHERENCIA OBLIGATORIO:

Se han cargado ${state.supportDocuments.length} documentos:
${docList}

DEBES realizar las siguientes tareas de forma OBLIGATORIA e INELUDIBLE:

1. AUDITORÍA ESTRUCTURAL: Audita el documento de necesidad principal contra el formato base, sección por sección.

2. ANÁLISIS DE COHERENCIA CRUZADA (OBLIGATORIO): Compara TODOS los documentos entre sí. Detecta y reporta CADA inconsistencia o contradicción en:
   - Valores económicos y presupuesto (CDP, CRP, cotizaciones vs necesidad)
   - Fechas y plazos de ejecución
   - Objeto del contrato / descripción del bien o servicio
   - Cantidades e ítems
   - Condiciones técnicas mínimas
   - Identificación presupuestal
   - Cualquier otro dato que difiera entre los documentos

3. Presenta el análisis de coherencia en una sección separada titulada EXACTAMENTE: "## Coherencia e Incoherencias entre Soportes"
   - Si hay incoherencias: lística cada una como alerta CRÍTICA con los documentos que la generan.
   - Si son coherentes: confírmalo expresamente.

NO omitas el análisis de coherencia. Es el propósito principal cuando se cargan varios documentos.\n\n`;
    } else if (state.supportDocuments.length > 0 || combinedText.includes('DOCUMENTO')) {
      userContent = `⚠️ INSTRUCCIÓN GENERAL PARA DIANA CONTRATE: Se ha aportado el documento del expediente. Realiza la auditoría completa según el formato base.\n\n`;
    }

    userContent += `DOCUMENTO BASE DE REFERENCIA (Conocimiento base para comparar):
--- INICIO DOCUMENTO BASE ---
${baseText}
--- FIN DOCUMENTO BASE ---

DOCUMENTOS APORTADOS AL EXPEDIENTE A AUDITAR:
--- INICIO DOCUMENTOS ---
${combinedText}
--- FIN DOCUMENTOS ---`;

    if (knowledgeText) {
      userContent += `\n\nNORMATIVAS JURÍDICAS Y LEYES DE REFERENCIA ADICIONALES (Diana Contrate debe evaluar conformidad frente a estas normas):
--- INICIO NORMATIVAS ---
${knowledgeText}
--- FIN NORMATIVAS ---`;
    }
  }

  let responseText = '';

  try {
    const headers = { 'Content-Type': 'application/json' };
    let url = '';
    let body = {};

    if (state.provider === 'openai') {
      url = '/api/openai';
      body = {
        model: state.model.openai,
        messages: [
          { role: 'system', content: state.systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: state.temperature,
        stream: true
      };
    } else {
      url = '/api/gemini';
      body = {
        model: state.model.gemini,
        stream: true,
        contents: [{ role: 'user', parts: [{ text: userContent }] }],
        systemInstruction: { parts: [{ text: state.systemPrompt }] },
        generationConfig: { temperature: state.temperature
        }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || 'Error desconocido del servidor'}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Hold onto partial line

      for (const line of lines) {
        const cleanLine = line.trim();
        if (!cleanLine) continue;

        if (cleanLine === 'data: [DONE]') {
          break;
        }

        if (cleanLine.startsWith('data: ')) {
          const jsonStr = cleanLine.substring(6);
          try {
            const parsed = JSON.parse(jsonStr);
            let chunkText = '';

            if (state.provider === 'openai') {
              chunkText = parsed.choices?.[0]?.delta?.content || '';
            } else if (state.provider === 'gemini') {
              chunkText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }

            if (chunkText) {
              responseText += chunkText;
              consoleEl.textContent = responseText;
              consoleEl.scrollTop = consoleEl.scrollHeight;
            }
          } catch (e) {
            // Partial JSON, skip
          }
        }
      }
    }

    // Capture the completed text
    state.currentAudit = {
      id: Date.now(),
      title: `${state.activeTool === 'auditor' ? 'Auditoría' : 'Diana'}: ${state.mainDocument.name.substring(0, 30) || 'Documento'}`,
      date: new Date().toLocaleString(),
      rawOutput: responseText,
      mainDocName: state.mainDocument.name,
      tool: state.activeTool,
      parsed: Parser.parse(responseText, state.activeTool)
    };

    // Save to history list
    state.history.unshift(state.currentAudit);
    // Keep max 20 runs
    if (state.history.length > 20) state.history.pop();
    saveHistory();

    // Render results
    renderResults(state.currentAudit.parsed);
    showToast('Auditoría completada exitosamente.');

    // Automatically switch to the structured results tab
    switchTab('dictamen');

    // For Diana: run dedicated independent modules after the main audit
    if (state.activeTool === 'diana') {
      renderResumenEjecutivo(); // initial pass with main audit data
      if (state.supportDocuments.length >= 2) runCoherenceCheck();
      if (state.baseDocument.text) runMatrizComparacion();
    }

  } catch (err) {
    console.error(err);
    consoleEl.textContent += `\n\n=== ERROR DE EJECUCIÓN ===\n${err.message}`;
    showToast(`Error al conectar con la API: ${err.message}`);
  } finally {
    state.isAuditing = false;
    document.getElementById('btn-start-audit').disabled = false;
    document.getElementById('btn-start-audit').textContent = 'Iniciar Auditoría';
  }
}

// Compare Literal Tool
async function runComparison() {
  const textA = document.getElementById('compare-text-a').value.trim();
  const textB = document.getElementById('compare-text-b').value.trim();

  if (!textA || !textB) {
    showToast('Error: Escribe o pega ambos textos para comparar.');
    return;
  }

  const compareBtn = document.getElementById('btn-compare');
  compareBtn.disabled = true;
  compareBtn.innerHTML = '<span class="spinner"></span> Comparando';

  const resultsBox = document.getElementById('compare-results-box');
  resultsBox.innerHTML = '<div class="empty-state"><span class="spinner"></span><div style="margin-top: 10px;">Analizando apartes y diferencias...</div></div>';

  const compPrompt = `Eres un auditor jurídico-técnico senior en contratación estatal colombiana. Tu misión ahora es ejecutar el MODO COMPARACIÓN LITERAL.
Realiza una comparación literal línea por línea de los dos fragmentos indicados por el usuario, preservando el texto original de cada uno.
Detecta omisiones, adiciones y reordenamientos, incluso mínimos.

FORMATO DE SALIDA (obligatorio):
Debes retornar una tabla Markdown estructurada con las columnas siguientes exactamente:
| Fragmento A | Fragmento B | ¿Idéntico? | Diferencia puntual | Tipo (forma/fondo) | Impacto | Corrección recomendada |

No agregues explicaciones fuera de la tabla. Sé preciso y técnico.`;

  const userContent = `FRAGMENTO A:
${textA}

FRAGMENTO B:
${textB}`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    let url = '', body = {};

    if (state.provider === 'openai') {
      url = '/api/openai';
      body = { model: state.model.openai, messages: [{ role: 'system', content: compPrompt }, { role: 'user', content: userContent }], temperature: 0.1 };
    } else {
      url = '/api/gemini';
      body = { model: state.model.gemini, contents: [{ role: 'user', parts: [{ text: `System instructions:\n${compPrompt}\n\nUser Input:\n${userContent}` }] }], generationConfig: { temperature: 0.1 } };
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    let replyText = '';

    if (state.provider === 'openai') {
      replyText = data.choices?.[0]?.message?.content || '';
    } else {
      replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Build Table UI
    renderComparisonTable(replyText);

  } catch (err) {
    showToast(`Error al comparar: ${err.message}`);
    resultsBox.innerHTML = `<div class="empty-state" style="color:var(--severity-high)">Error en comparación: ${err.message}</div>`;
  } finally {
    compareBtn.disabled = false;
    compareBtn.textContent = 'Comparar Literalmente';
  }
}

// ── Módulo de Coherencia entre Documentos ────────────────────────────────────
// Llamada independiente a la API para analizar coherencia entre documentos cargados.
// No depende del output del audit principal: siempre produce resultados propios.
async function runCoherenceCheck() {
  const panel = document.getElementById('conflictos-panel-container');
  if (!panel) return;
  if (state.supportDocuments.length < 2) {
    panel.innerHTML = '<p class="empty-state-desc" style="padding:10px 0;">Carga al menos 2 documentos para analizar coherencia.</p>';
    return;
  }

  panel.innerHTML = `<div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;">
    <span class="spinner"></span>
    <span style="font-size:0.8rem;color:var(--text-muted);">Analizando coherencia entre ${state.supportDocuments.length} documentos...</span>
  </div>`;

  const MAX_CHARS = 9000;
  const docBlocks = state.supportDocuments.map((doc, i) =>
    `=== DOCUMENTO ${i + 1}: ${doc.name} ===\n${doc.text.substring(0, MAX_CHARS)}\n=== FIN DOCUMENTO ${i + 1} ===`
  ).join('\n\n');

  const sysPrompt = `Eres un auditor experto en contratación pública colombiana. Tu ÚNICA tarea es analizar la COHERENCIA entre múltiples documentos de un expediente contractual. Compara los documentos entre sí y detecta TODAS las inconsistencias, contradicciones o diferencias. Revisa: valores económicos (CDP, presupuesto, cotizaciones), fechas y plazos, objeto del contrato, cantidades e ítems, condiciones técnicas mínimas, identificación presupuestal, supervisión e interventoría, y cualquier otro dato relevante. Cita los valores exactos de cada documento. No inventes información.`;

  const userPrompt = `Analiza la coherencia entre estos ${state.supportDocuments.length} documentos. Detecta TODAS las inconsistencias o contradicciones entre ellos:\n\n${docBlocks}\n\nEntrega el resultado en este formato:\n\n## Documentos Analizados\nLista los documentos.\n\n## Inconsistencias Detectadas\nPara cada inconsistencia: campo afectado, qué dice cada documento, nivel de alerta (Alta/Media/Baja). Si no hay inconsistencias escribe exactamente: "No se detectaron inconsistencias."\n\n## Datos Coherentes\nCampos donde los documentos coinciden.\n\n## Conclusión\nEvaluación final de la coherencia del expediente.`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    let url = '', body = {};

    if (state.provider === 'openai') {
      url = '/api/openai';
      body = { model: state.model.openai, messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }], temperature: 0.1 };
    } else {
      url = '/api/gemini';
      body = { model: state.model.gemini, contents: [{ role: 'user', parts: [{ text: sysPrompt + '\n\n' + userPrompt }] }], generationConfig: { temperature: 0.1 } };
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) { const t = await response.text(); throw new Error(`HTTP ${response.status}: ${t}`); }

    const data = await response.json();
    const replyText = state.provider === 'openai'
      ? (data.choices?.[0]?.message?.content || '')
      : (data.candidates?.[0]?.content?.parts?.[0]?.text || '');

    renderCoherenceResults(replyText);

  } catch (err) {
    console.error('Coherence check error:', err);
    panel.innerHTML = `<p style="font-size:0.75rem;color:var(--severity-high);padding:0.5rem 0;">Error al analizar coherencia: ${err.message.substring(0, 120)}</p>`;
  }
}

function renderCoherenceResults(text) {
  const panel = document.getElementById('conflictos-panel-container');
  if (!panel || !text) return;

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Parse sections from the AI response
  const sections = { docs: '', inconsistencias: '', coherentes: '', conclusion: '' };
  let current = '';
  const lines = text.split('\n');

  for (const line of lines) {
    const t = line.trim();
    const n = t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[#*_]/g, '').trim();
    if (n.startsWith('documento') && n.length < 40) { current = 'docs'; continue; }
    if (n.includes('inconsistencia')) { current = 'inconsistencias'; continue; }
    if (n.includes('coherente') || n.includes('datos coher') || n.includes('coincid')) { current = 'coherentes'; continue; }
    if (n.includes('conclusi') || n.includes('conclusion')) { current = 'conclusion'; continue; }
    if (current) sections[current] += line + '\n';
  }

  // If parsing didn't work well, show raw text as a single card
  const hasContent = Object.values(sections).some(v => v.trim());
  if (!hasContent) {
    panel.innerHTML = `<div class="conflict-card coherence-card">
      <div class="conflict-title"><span>🔍 Análisis de Coherencia</span></div>
      <div class="conflict-description" style="white-space:pre-wrap;font-size:0.78rem;">${esc(text)}</div>
    </div>`;
    return;
  }

  let html = '<div class="conflictos-list">';

  // Inconsistencies
  const incoText = sections.inconsistencias.trim();
  if (incoText) {
    const noIssues = incoText.toLowerCase().includes('no se detect') || incoText.toLowerCase().includes('no se identific');
    if (noIssues) {
      html += `<div class="conflict-card" style="border-color:rgba(16,185,129,0.25);background:rgba(16,185,129,0.04);">
        <div class="conflict-title" style="color:var(--accent-success);"><span>✓ Sin Inconsistencias</span></div>
        <div class="conflict-description">${esc(incoText)}</div>
      </div>`;
    } else {
      // Split individual inconsistencies by numbered items or bullet points
      const items = incoText.split(/\n(?=\s*[-*•]\s|\s*\d+\.\s)/).filter(s => s.trim());
      items.forEach((item, idx) => {
        const t = item.trim();
        if (!t) return;
        const sevMatch = t.match(/\b(alta|media|baja)\b/i);
        const sev = sevMatch ? sevMatch[1].toLowerCase() : 'media';
        const borderColor = sev === 'alta' ? 'var(--severity-high)' : sev === 'baja' ? 'var(--severity-low)' : 'var(--severity-medium)';
        const bg = sev === 'alta' ? 'rgba(248,113,113,0.07)' : sev === 'baja' ? 'rgba(96,165,250,0.06)' : 'rgba(251,191,36,0.06)';
        const sevBadge = `<span class="severity-badge sev-${sev}" style="margin-left:0.5rem;">${sev.charAt(0).toUpperCase() + sev.slice(1)}</span>`;
        html += `<div class="conflict-card" style="border-color:${borderColor};background:${bg};">
          <div class="conflict-title" style="color:${borderColor};"><span>⚠ Inconsistencia ${idx + 1}${sevBadge}</span></div>
          <div class="conflict-description" style="white-space:pre-wrap;">${esc(t.replace(/^[-*•\d.\s]+/, ''))}</div>
        </div>`;
      });
    }
  }

  // Coherent data
  if (sections.coherentes.trim()) {
    html += `<div class="conflict-card" style="border-color:rgba(16,185,129,0.25);background:rgba(16,185,129,0.04);">
      <div class="conflict-title" style="color:var(--accent-success);"><span>✓ Datos Coherentes entre Documentos</span></div>
      <div class="conflict-description" style="white-space:pre-wrap;">${esc(sections.coherentes.trim())}</div>
    </div>`;
  }

  // Conclusion
  if (sections.conclusion.trim()) {
    html += `<div class="conflict-card" style="border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.05);">
      <div class="conflict-title" style="color:var(--primary);"><span>📋 Conclusión de Coherencia</span></div>
      <div class="conflict-description" style="white-space:pre-wrap;">${esc(sections.conclusion.trim())}</div>
    </div>`;
  }

  html += '</div>';
  panel.innerHTML = html;

  // Re-run button at the bottom
  const rerunBtn = document.createElement('button');
  rerunBtn.className = 'btn btn-secondary';
  rerunBtn.style.cssText = 'margin-top:0.75rem;font-size:0.72rem;padding:0.35rem 0.75rem;';
  rerunBtn.innerHTML = '<i data-lucide="refresh-cw" style="width:12px;"></i> Re-analizar Coherencia';
  rerunBtn.onclick = () => runCoherenceCheck();
  panel.appendChild(rerunBtn);
  if (window.lucide) window.lucide.createIcons();

  // ── Guardar resultados en state para el Resumen Ejecutivo ─────────────────
  const noIssues = !incoText ||
    incoText.toLowerCase().includes('no se detect') ||
    incoText.toLowerCase().includes('no se identific');

  state.coherenceResults = [];
  if (!noIssues && incoText) {
    const raw = incoText.split(/\n(?=\s*[-*•]\s|\s*\d+\.\s)/).filter(s => s.trim());
    (raw.length ? raw : [incoText]).forEach(item => {
      const t = item.trim().replace(/^[-*•\d.\s]+/, '');
      if (!t) return;
      const sm = t.match(/\b(alta|media|baja)\b/i);
      state.coherenceResults.push({ text: t, severity: sm ? sm[1].toLowerCase() : 'alta' });
    });
  }
  renderResumenEjecutivo();

  // ── Reflejar incoherencias en el tab "Incompletos y Alertas" ──────────────
  const racccaBox = document.getElementById('raccca-render-list');
  if (!racccaBox) return;

  // Remove any previously injected coherence alerts to avoid duplicates
  racccaBox.querySelectorAll('.coherence-alert-card').forEach(el => el.remove());
  racccaBox.querySelectorAll('.coherence-alert-header').forEach(el => el.remove());

  if (noIssues) return;

  // Header separator
  const header = document.createElement('div');
  header.className = 'coherence-alert-header';
  header.style.cssText = 'font-size:0.68rem;font-weight:700;color:var(--severity-high);text-transform:uppercase;letter-spacing:0.05em;margin-top:1rem;padding-top:0.75rem;border-top:1px solid rgba(248,113,113,0.2);margin-bottom:0.35rem;';
  header.textContent = '⚠ Incoherencias entre Documentos Soporte';
  racccaBox.appendChild(header);

  // One alert card per inconsistency
  const incoItems = incoText.split(/\n(?=\s*[-*•]\s|\s*\d+\.\s)/).filter(s => s.trim());
  (incoItems.length ? incoItems : [incoText]).forEach(item => {
    const t = item.trim().replace(/^[-*•\d.\s]+/, '');
    if (!t) return;

    const sevMatch = t.match(/\b(alta|media|baja)\b/i);
    const sev = sevMatch ? sevMatch[1].toLowerCase() : 'alta';
    const sevCls = sev === 'alta' ? 'sev-alta' : sev === 'baja' ? 'sev-baja' : 'sev-media';

    const card = document.createElement('div');
    card.className = 'comment-card coherence-alert-card';
    card.style.borderLeft = `3px solid ${sev === 'alta' ? 'var(--severity-high)' : sev === 'baja' ? 'var(--severity-low)' : 'var(--severity-medium)'}`;
    card.innerHTML = `
      <div class="comment-meta" style="margin-bottom:0.3rem;">
        <span class="severity-badge ${sevCls}">${sev.charAt(0).toUpperCase() + sev.slice(1)}</span>
        <span style="font-size:0.63rem;color:var(--text-muted);margin-left:0.4rem;">Incoherencia entre soportes</span>
      </div>
      <div class="comment-text" style="font-size:0.75rem;">${esc(t)}</div>
    `;
    racccaBox.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

// ── Módulo de Comparación contra Formato Base ─────────────────────────────────
// Llamada independiente a la API para verificar título por título del formato base
// contra el documento cargado. Usa el prompt exacto del usuario sin alteraciones.
async function runMatrizComparacion() {
  if (state.activeTool !== 'diana') return;

  const baseText = state.baseDocument.text;
  if (!baseText) {
    const tbody = document.getElementById('findings-tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;font-size:0.8rem;color:var(--severity-medium);">No se ha cargado el Formato Base. Cárgalo en la barra lateral para ejecutar este módulo.</td></tr>`;
    return;
  }
  if (state.supportDocuments.length === 0) {
    showToast('No hay documentos cargados para comparar.');
    return;
  }

  // Loading state in matrix tab
  const tbody = document.getElementById('findings-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2.5rem;"><span class="spinner"></span><div style="margin-top:0.75rem;font-size:0.8rem;color:var(--text-muted);">Comparando documento contra el Formato Base...</div></td></tr>`;
  switchTab('matriz');

  const MAX_DOC = 18000;
  const MAX_BASE = 20000;

  const docText = state.supportDocuments.map((doc, i) =>
    `=== DOCUMENTO ${i + 1}: ${doc.name} ===\n${doc.text.substring(0, MAX_DOC)}\n`
  ).join('\n');

  // Prompt exacto del usuario — no modificar ni alterar
  const MATRIZ_PROMPT = `Actúa como un auditor experto en contratación pública colombiana y control documental de documentos de necesidad de contratación. Tu función es revisar los documentos de necesidad que el usuario cargue y compararlos contra el documento base incluido en tus conocimientos, denominado "Formato de Radicación de Necesidad de Contratación ante la Unidad de Compras Públicas" y la coherencia entre documentos.
Debes verificar si el documento entregado conserva la estructura, títulos, subtítulos, tablas, anexos y elementos sustanciales del formato base. Tu revisión debe enfocarse especialmente en detectar si el documento analizado eliminó, omitió, modificó,  o alteró el orden de alguno de los títulos o apartados exigidos.
Lo primero que haces es  verificar cada título del formato base mediante búsqueda textual específica dentro del documento revisado. No puedes clasificar un título como "No cumple" únicamente porque no aparezca en el primer fragmento visible o porque el documento esté truncado. Si el archivo es extenso, busca expresamente cada sección por palabras clave y variantes de nombre. Solo marca "No cumple" cuando hayas confirmado que el título no aparece en el documento. Si el título aparece más adelante, evalúa su contenido como "Cumple" o "Cumple parcialmente".
Diferencia entre "no encontrado por limitación de lectura" y "omitido en el documento". Si no puedes verificar el documento completo, debes advertirlo expresamente.
Durante la revisión del documento de necesidad, estudios previos, anexos técnicos, fichas técnicas, presupuesto o cualquier documento soporte, deberás generar una alerta expresa cuando se evidencie cualquiera de las siguientes situaciones: 1. Referencia al impuesto de timbre marca como Alerta Alta. 2. Inclusión de marcas específicas en bienes o servicios Cuando se evidencie una marca específica, marca la alerta grave.
Documento base de comparación. Usa como referencia obligatoria el formato base cargado en tus conocimientos. Este documento contiene, entre otros, los siguientes bloques principales:
Requerimiento: bien, servicio, obra u otro.
Datos del solicitante.
Anexos.
Documentos o constancias técnicas especiales.
Necesidad.
Descripción de la necesidad.
Antecedentes.
Alternativas estudiadas para satisfacer la necesidad.
Alcance de la necesidad.
Coherencia con los instrumentos de planeación.
Propuesta de obligaciones específicas.
Requisitos ambientales.
Requisitos en materia de seguridad y salud en el trabajo.
Condiciones técnicas mínimas del contratista.
Criterios adicionales y condiciones técnicas del contratista de mayor valor o calidad.
Plazo de ejecución del contrato.
Fecha estimada en la que se requiere la obra, bien o servicio terminado.
Periodicidad y forma de entrega.
Acuerdos de Niveles de Servicio — ANS.
Riesgos previsibles.
Observaciones generales.
Territorialización del bien o servicio solicitado.
Valor estimado y justificación.
Identificación presupuestal.
Supervisión o interventoría.
Información de las personas designadas por la dependencia solicitante.
Firma, elaboró, revisó y aprobó.
Instrucciones de auditoría
Cuando el usuario cargue un documento de necesidad, realiza la revisión siguiendo estos pasos:
Identifica el tipo de documento cargado.
Confirma si corresponde a un documento de necesidad, formato de radicación, solicitud de contratación o documento equivalente.
Compara la estructura contra el formato base.
Revisa título por título, subtítulo por subtítulo y tabla por tabla.
Detecta omisiones.
Advierte expresamente si falta alguno de los títulos, subtítulos, tablas o campos del formato base. No minimices omisiones. Si falta un título completo, clasifícalo como hallazgo relevante.
Detecta modificaciones de nombres.
Si el documento conserva el contenido pero cambió el nombre del título, indícalo como "título modificado o renombrado" y explica cuál era el nombre original y cuál aparece en el documento revisado.
Detecta eliminaciones indebidas.
Si el documento eliminó una tabla o sección que solo podía eliminarse en casos específicos, por ejemplo anexos de obra pública, arrendamiento, consultoría o prestación de servicios profesionales, verifica si el documento justifica que no aplica. Si no hay justificación clara, márcalo como posible eliminación indebida.
Diferencia entre ausencia total y ausencia parcial.
Clasifica cada hallazgo así:
Cumple: el título y su contenido están presentes.
Cumple parcialmente: el título está presente, pero falta contenido, tabla, explicación o soporte.
No cumple: el título o elemento fue omitido.
No aplica justificado: el documento explica razonablemente que la sección no aplica.
No aplica no justificado: la sección fue eliminada o marcada como no aplicable sin explicación suficiente.
Evalúa coherencia interna.
Verifica si la necesidad, el alcance, el plazo, las obligaciones, el presupuesto, los riesgos y la supervisión guardan relación entre sí.
No inventes información.
Si un dato no aparece en el documento, debes decir: "No se evidencia en el documento revisado".
No corrijas el documento directamente salvo que el usuario lo pida.
Tu tarea principal es auditar, advertir omisiones y emitir recomendaciones.
Usa lenguaje profesional, claro y preventivo.
Evita afirmaciones absolutas cuando no tengas certeza. Usa expresiones como "se evidencia", "no se evidencia", "podría requerir ajuste", "se recomienda incorporar".
Formato obligatorio de respuesta
Entrega siempre la auditoría en este formato:
Informe de auditoría documental
1. Resultado general
Indica una de estas categorías:
Cumple integralmente
Cumple con observaciones
Cumple parcialmente
No cumple por omisiones relevantes
Incluye un resumen breve de máximo cinco líneas.
2. Matriz de comparación contra el formato base
Presenta una tabla con estas columnas:
No.\tTítulo o elemento del formato base\tEstado\tObservación\tRecomendación
En "Estado" usa únicamente:
Cumple / Cumple parcialmente / No cumple / No aplica justificado / No aplica no justificado.
3. Títulos omitidos o eliminados
Incluye una lista expresa de los títulos que no aparecen en el documento revisado.
Si no hay omisiones, responde:
"No se identificaron títulos omitidos frente al formato base."
4. Títulos modificados o renombrados
Incluye una tabla así:

Título original del formato base\tTítulo encontrado en el documento revisado\tObservación

Si no hay cambios, responde:
"No se identificaron títulos modificados o renombrados."
Cuando te entregué otros documentos indícame si hay coherencia entre los mismos o en su contenido.
5. Elementos incompletos
Identifica secciones que existen, pero están vacías, incompletas o sin soporte suficiente.
6. Alertas críticas
Incluye alertas cuando falten elementos relevantes como:
Descripción de la necesidad.
Antecedentes.
Alcance de la necesidad.
Coherencia con POAI o Plan Anual de Adquisiciones.
Obligaciones específicas.
Requisitos ambientales.
Requisitos de seguridad y salud en el trabajo.
Condiciones técnicas mínimas.
Plazo de ejecución.
Riesgos previsibles.
Valor estimado y justificación.
Identificación presupuestal.
Supervisión o interventoría.
Clasifica cada alerta como:
Alta: puede afectar la viabilidad o estructuración del proceso contractual.
Media: requiere ajuste para mejorar completitud o trazabilidad.
Baja: aspecto formal o de presentación.
7. Recomendaciones finales
Entrega recomendaciones concretas para que el documento quede alineado con el formato base.
8. Conclusión
Finaliza con una conclusión breve indicando si el documento puede continuar su trámite o si requiere ajustes previos.
Restricciones
revisa que exista coherencia con los demas documentos, de no existir manda una alerta critica y grave indicando las incoherencias con los otros documentos.
No debes omitir hallazgos por considerarlos menores.
No debes asumir que una sección "no aplica" si el documento no lo justifica.
No debes inventar anexos, soportes, valores, fechas, responsables ni justificaciones.`;

  const userContent = `DOCUMENTO BASE DE REFERENCIA (Formato de Radicación de Necesidad de Contratación ante la Unidad de Compras Públicas):
--- INICIO DOCUMENTO BASE ---
${baseText.substring(0, MAX_BASE)}
--- FIN DOCUMENTO BASE ---

DOCUMENTOS APORTADOS AL EXPEDIENTE A AUDITAR:
--- INICIO DOCUMENTOS ---
${docText}
--- FIN DOCUMENTOS ---`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    let url = '', body = {};

    if (state.provider === 'openai') {
      url = '/api/openai';
      body = { model: state.model.openai, messages: [{ role: 'system', content: MATRIZ_PROMPT }, { role: 'user', content: userContent }], temperature: 0.1 };
    } else {
      url = '/api/gemini';
      body = { model: state.model.gemini, contents: [{ role: 'user', parts: [{ text: MATRIZ_PROMPT + '\n\n' + userContent }] }], generationConfig: { temperature: 0.1 } };
    }

    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    if (!response.ok) { const t = await response.text(); throw new Error(`HTTP ${response.status}: ${t.substring(0, 200)}`); }

    const data = await response.json();
    const replyText = state.provider === 'openai'
      ? (data.choices?.[0]?.message?.content || '')
      : (data.candidates?.[0]?.content?.parts?.[0]?.text || '');

    // Parse the full 8-section response and render all tabs
    const parsedData = Parser.parseDiana(replyText);
    state.matrizComparacionData = parsedData;
    renderResults(parsedData);
    renderResumenEjecutivo();
    showToast('Comparación con Formato Base completada.');

  } catch (err) {
    console.error('Matrix comparison error:', err);
    if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:1.5rem;color:var(--severity-high);font-size:0.8rem;">Error al ejecutar comparación: ${err.message.substring(0, 150)}</td></tr>`;
  }
}

// ── Panel Resumen Ejecutivo ───────────────────────────────────────────────────
// Lee de los tres módulos (audit principal, coherencia, matriz) y consolida
// todos los hallazgos críticos en una sola vista por severidad.
function renderResumenEjecutivo() {
  const container = document.getElementById('resumen-ejecutivo-container');
  if (!container || state.activeTool !== 'diana') return;

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const findings = []; // {text, severity, source}

  // ── 1. Alertas del módulo principal (o de la matriz si ya corrió) ──────────
  const mainParsed = state.currentAudit?.parsed;
  const matrizParsed = state.matrizComparacionData;
  const baseParsed = matrizParsed || mainParsed; // matriz es más confiable

  if (baseParsed?.alertas?.length) {
    baseParsed.alertas.forEach(al => findings.push({
      text: al.text, severity: (al.severity || 'media').toLowerCase(), source: 'auditoria'
    }));
  }

  // ── 2. Elementos incompletos ───────────────────────────────────────────────
  if (baseParsed?.faltantes?.length) {
    baseParsed.faltantes.forEach(f => findings.push({
      text: typeof f === 'string' ? f : f.text || String(f),
      severity: 'media', source: 'incompleto'
    }));
  }

  // ── 3. Títulos omitidos ────────────────────────────────────────────────────
  if (baseParsed?.comentarios?.length) {
    baseParsed.comentarios.forEach(c => findings.push({
      text: c.text || String(c), severity: 'alta', source: 'omitido'
    }));
  }

  // ── 4. Matriz: filas con No cumple / Cumple parcialmente ──────────────────
  if (baseParsed?.matriz?.length) {
    baseParsed.matriz.forEach(row => {
      const estado = (row.evidenciaSoporte || '').toLowerCase();
      const titulo = row.ubicacion || '';
      const obs    = row.diagnostico || row.correccion || '';
      const text   = titulo ? `${titulo}${obs ? ' — ' + obs : ''}` : obs;
      if (!text) return;
      if (estado.includes('no cumple') || estado.includes('no aplica no')) {
        findings.push({ text, severity: 'alta', source: 'matriz' });
      } else if (estado.includes('parcialmente') || estado.includes('observaciones')) {
        findings.push({ text, severity: 'media', source: 'matriz' });
      }
    });
  }

  // ── 5. Incoherencias entre documentos ─────────────────────────────────────
  state.coherenceResults.forEach(r => findings.push({
    text: r.text, severity: r.severity || 'alta', source: 'coherencia'
  }));

  if (!findings.length) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon"><i data-lucide="layout-dashboard"></i></div>
      <div class="empty-state-title">Sin hallazgos disponibles aún</div>
      <div class="empty-state-desc">El resumen se actualiza automáticamente a medida que cada módulo completa su análisis.</div>
    </div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Deduplicar por texto similar (primeros 80 chars)
  const seen = new Set();
  const unique = findings.filter(f => {
    const key = f.text.substring(0, 80).toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });

  const sevOrder = { alta: 0, media: 1, baja: 2 };
  unique.sort((a, b) => (sevOrder[a.severity] ?? 1) - (sevOrder[b.severity] ?? 1));

  const altas  = unique.filter(f => f.severity === 'alta');
  const medias = unique.filter(f => f.severity === 'media');
  const bajas  = unique.filter(f => f.severity === 'baja');

  // Veredicto
  let verdict = 'Puede continuar con observaciones menores';
  let vCls = 'verdict-ok', vIcon = '✓';
  if (altas.length > 0) {
    verdict = 'Requiere ajustes antes de continuar el trámite';
    vCls = 'verdict-fail'; vIcon = '⚠';
  } else if (medias.length >= 3) {
    verdict = 'Puede continuar con ajustes recomendados';
    vCls = 'verdict-warn'; vIcon = '⚡';
  }

  const conclusion = baseParsed?.conclusion || mainParsed?.conclusion || '';

  const sourceTag = src => {
    const map = {
      coherencia: ['Coherencia','source-coherencia'],
      matriz:     ['Matriz','source-matriz'],
      auditoria:  ['Auditoría','source-auditoria'],
      incompleto: ['Incompleto','source-incompleto'],
      omitido:    ['Omitido','source-omitido']
    };
    const [lbl, cls] = map[src] || ['General','source-auditoria'];
    return `<span class="source-tag ${cls}">${lbl}</span>`;
  };

  const card = f => `
    <div class="resumen-finding-card">
      <div class="resumen-finding-meta">
        <span class="severity-badge sev-${f.severity}">${f.severity.charAt(0).toUpperCase()+f.severity.slice(1)}</span>
        ${sourceTag(f.source)}
      </div>
      <div class="resumen-finding-text">${esc(f.text)}</div>
    </div>`;

  const section = (title, items, color) => !items.length ? '' : `
    <div class="resumen-section">
      <div class="resumen-section-title" style="color:${color};">
        ${title} <span class="resumen-section-count">${items.length}</span>
      </div>
      <div class="resumen-findings-list">${items.map(card).join('')}</div>
    </div>`;

  container.innerHTML = `
    <div class="resumen-verdict-card ${vCls}">
      <div class="resumen-verdict-icon">${vIcon}</div>
      <div>
        <div class="resumen-verdict-label">Veredicto Consolidado</div>
        <div class="resumen-verdict-text">${esc(verdict)}</div>
        ${conclusion ? `<div class="resumen-verdict-sub">${esc(conclusion.substring(0,250))}${conclusion.length>250?'…':''}</div>` : ''}
      </div>
    </div>
    <div class="resumen-stats-row">
      <div class="resumen-stat-chip chip-alta"><span>${altas.length}</span> Críticos</div>
      <div class="resumen-stat-chip chip-media"><span>${medias.length}</span> Medios</div>
      <div class="resumen-stat-chip chip-baja"><span>${bajas.length}</span> Bajos</div>
      <div class="resumen-stat-chip chip-total"><span>${unique.length}</span> Total</div>
    </div>
    ${section('Hallazgos Críticos', altas,  'var(--severity-high)')}
    ${section('Hallazgos Medios',   medias, 'var(--severity-medium)')}
    ${section('Hallazgos Bajos',    bajas,  'var(--severity-low)')}
  `;
  if (window.lucide) window.lucide.createIcons();
}

// Render parsed results to their specific tabs
function renderResults(parsed) {
  if (!parsed) return;

  const isAuditor = state.activeTool === 'auditor';

  // 1. Dictamen Ejecutivo / Resultado General
  const dictamenCard = document.getElementById('dictamen-badge-container');
  const dictamenText = document.getElementById('dictamen-text-content');

  let badgeClass = 'status-no-verificable';
  let badgeLabel = 'No Verificable';

  if (isAuditor) {
    if (parsed.dictamen.status === 'consistente') {
      badgeClass = 'status-consistente';
      badgeLabel = 'Consistente con Ajustes';
    } else if (parsed.dictamen.status === 'inconsistente') {
      badgeClass = 'status-inconsistente';
      badgeLabel = 'Inconsistente';
    }

    dictamenCard.innerHTML = `<span class="dictamen-status ${badgeClass}">${badgeLabel}</span>`;
    dictamenText.textContent = parsed.dictamen.text;
  } else {
    // For Diana: Resultado general
    if (parsed.dictamen.status === 'consistente') {
      badgeClass = 'status-consistente';
      badgeLabel = 'Cumple Integralmente';
    } else if (parsed.dictamen.status === 'no-verificable') {
      badgeClass = 'status-no-verificable';
      badgeLabel = 'Cumple con Observaciones';
    } else if (parsed.dictamen.status === 'inconsistente') {
      const lower = parsed.dictamen.text.toLowerCase();
      if (lower.includes('omisiones relevantes') || lower.includes('no cumple')) {
        badgeLabel = 'No Cumple por Omisiones';
        badgeClass = 'status-inconsistente';
      } else {
        badgeLabel = 'Cumple Parcialmente';
        badgeClass = 'status-inconsistente';
      }
    }

    dictamenCard.innerHTML = `<span class="dictamen-status ${badgeClass}">${badgeLabel}</span>`;
    dictamenText.innerHTML = `<strong>Resumen:</strong><br>${parsed.dictamen.text}`;

    // Add Conclusión at the bottom of the Dictamen card for Diana
    if (parsed.conclusion) {
      dictamenText.innerHTML += `<div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed var(--border-color);">
        <strong style="color: var(--primary);"><i data-lucide="help-circle" style="width:14px; display:inline-block; vertical-align:middle; margin-right:4px;"></i> Conclusión de Trámite:</strong><br>
        <span style="font-style: italic; font-size: 0.85rem; color: var(--text-primary);">${parsed.conclusion}</span>
      </div>`;
    }
  }

  // 2. Ficha Maestra / Recomendaciones Estructurales
  const fichaGrid = document.getElementById('ficha-maestra-grid');
  fichaGrid.innerHTML = '';

  if (isAuditor) {
    if (parsed.ficha && parsed.ficha.length > 0) {
      parsed.ficha.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'ficha-item';
        itemEl.innerHTML = `
          <span class="ficha-label">${item.label}</span>
          <span class="ficha-value">${item.value}</span>
          ${item.location ? `<span class="ficha-location">Ubicación: ${item.location}</span>` : ''}
        `;
        fichaGrid.appendChild(itemEl);
      });
    } else {
      fichaGrid.innerHTML = '<div class="empty-state">No se extrajo ficha maestra del documento.</div>';
    }
  } else {
    // For Diana: Render Recomendaciones finales
    if (parsed.recomendaciones && parsed.recomendaciones.length > 0) {
      parsed.recomendaciones.forEach((rec, idx) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'ficha-item';
        itemEl.style.borderLeft = '3px solid var(--primary)';
        itemEl.innerHTML = `
          <span class="ficha-label">Recomendación ${idx + 1}</span>
          <span class="ficha-value" style="font-size:0.8rem; line-height:1.4;">${rec}</span>
        `;
        fichaGrid.appendChild(itemEl);
      });
    } else {
      fichaGrid.innerHTML = '<div class="empty-state">No se generaron recomendaciones específicas.</div>';
    }
  }

  // 3. Matriz de Hallazgos / Matriz de Comparación
  renderFindingsTable(parsed.matriz);

  // 4. Support Conflicts Panel
  const conflictsPanel = document.getElementById('conflictos-panel-container');
  conflictsPanel.innerHTML = '';

  if (isAuditor) {
    // Auditor mode: render from parsed output
    const conflictsToRender = parsed.conflictos || [];
    if (conflictsToRender.length > 0) {
      const listDiv = document.createElement('div');
      listDiv.className = 'conflictos-list';
      conflictsToRender.forEach((desc, idx) => {
        const card = document.createElement('div');
        card.className = 'conflict-card';
        card.innerHTML = `<div class="conflict-title"><span>⚠️ Conflicto ${idx + 1}</span></div><div class="conflict-description">${desc}</div>`;
        listDiv.appendChild(card);
      });
      conflictsPanel.appendChild(listDiv);
    } else {
      conflictsPanel.innerHTML = '<p class="empty-state-desc" style="padding:10px 0;">No se identificaron conflictos materiales entre los soportes aportados.</p>';
    }
  } else {
    // Diana mode: coherence is handled by a dedicated independent API call
    if (state.supportDocuments.length >= 2) {
      conflictsPanel.innerHTML = '<div style="display:flex;align-items:center;gap:0.75rem;padding:0.5rem 0;"><span class="spinner"></span><span style="font-size:0.8rem;color:var(--text-muted);">Analizando coherencia entre ' + state.supportDocuments.length + ' documentos cargados...</span></div>';
    } else {
      conflictsPanel.innerHTML = '<p class="empty-state-desc" style="padding:10px 0;">Carga al menos 2 documentos para obtener el análisis de coherencia entre ellos.</p>';
    }
  }

  // 5. Redlines / Títulos Modificados
  const redlinesList = document.getElementById('redlines-render-list');
  redlinesList.innerHTML = '';

  if (isAuditor) {
    if (parsed.redlines && parsed.redlines.length > 0) {
      parsed.redlines.forEach(red => {
        const item = document.createElement('div');
        item.className = 'redline-item';

        let diffContent = '';
        if (red.original) {
          diffContent += `<span class="diff-del">- ${red.original}</span>`;
        }
        diffContent += `<span class="diff-ins">+ ${red.replacement}</span>`;

        item.innerHTML = `
          <div class="redline-item-header">
            <span class="redline-title">${red.title}</span>
            <button class="btn-icon" title="Copiar Reemplazo" onclick="copyTextToClipboard(\`${red.replacement.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            </button>
          </div>
          <div class="redline-diff-box">${diffContent}</div>
        `;
        redlinesList.appendChild(item);
      });
    } else {
      redlinesList.innerHTML = '<div class="empty-state">No se generaron redlines listos.</div>';
    }
  } else {
    // For Diana: Render Títulos Modificados o Renombrados as a table
    if (parsed.redlines && parsed.redlines.length > 0) {
      const tableDiv = document.createElement('div');
      tableDiv.className = 'table-responsive';
      tableDiv.innerHTML = `
        <table class="findings-table">
          <thead>
            <tr>
              <th>Título Original en Formato Base</th>
              <th>Título Encontrado en Documento</th>
              <th>Observación / Estado</th>
            </tr>
          </thead>
          <tbody>
            ${parsed.redlines.map(red => `
              <tr>
                <td style="font-weight: 700; color: var(--severity-medium);">${red.original}</td>
                <td style="font-weight: 700; color: var(--accent-success);">${red.replacement}</td>
                <td>${red.reason || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      redlinesList.appendChild(tableDiv);
    } else {
      redlinesList.innerHTML = '<div class="empty-state">No se identificaron títulos modificados o renombrados frente al formato base.</div>';
    }
  }

  // 6. Word Comments / Títulos Omitidos
  const commentsList = document.getElementById('comments-render-list');
  commentsList.innerHTML = '';

  if (isAuditor) {
    if (parsed.comentarios && parsed.comentarios.length > 0) {
      parsed.comentarios.forEach(com => {
        const card = document.createElement('div');
        card.className = 'comment-card';

        const copyVal = `[${com.location}]: ${com.text}`;

        card.innerHTML = `
          <div class="comment-meta">
            <span class="comment-location">${com.location}</span>
            <button class="btn-icon" title="Copiar Comentario" onclick="copyTextToClipboard(\`${copyVal.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
          </button>
          </div>
          <div class="comment-text">${com.text}</div>
        `;
        commentsList.appendChild(card);
      });
    } else {
      commentsList.innerHTML = '<div class="empty-state">No se encontraron comentarios para Word.</div>';
    }
  } else {
    // For Diana: Render Títulos Omitidos o Eliminados list
    if (parsed.comentarios && parsed.comentarios.length > 0) {
      parsed.comentarios.forEach((com, idx) => {
        const card = document.createElement('div');
        card.className = 'comment-card';
        card.style.borderLeft = '3px solid var(--severity-high)';
        card.innerHTML = `
          <div class="comment-meta">
            <span class="comment-location" style="color:var(--severity-high);">❌ Omisión ${idx + 1}</span>
          </div>
          <div class="comment-text">${com.text}</div>
        `;
        commentsList.appendChild(card);
      });
    } else {
      commentsList.innerHTML = '<div class="empty-state" style="color:var(--accent-success); font-weight:600; padding:20px 0; text-align:center;">No se identificaron títulos omitidos frente al formato base.</div>';
    }
  }

  // 7. Faltantes Checklist / Elementos Incompletos
  const missingList = document.getElementById('faltantes-checklist');
  missingList.innerHTML = '';

  if (parsed.faltantes && parsed.faltantes.length > 0) {
    parsed.faltantes.forEach((text, index) => {
      const item = document.createElement('div');
      item.className = 'checklist-item';

      const chkId = `chk-missing-${index}`;

      item.innerHTML = `
        <input type="checkbox" id="${chkId}" class="checklist-checkbox">
        <label for="${chkId}" class="checklist-text">${text}</label>
      `;

      // Click toggler for aesthetics
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const chk = item.querySelector('input');
          chk.checked = !chk.checked;
          item.classList.toggle('checked', chk.checked);
        } else {
          item.classList.toggle('checked', e.target.checked);
        }
      });

      missingList.appendChild(item);
    });
  } else {
    missingList.innerHTML = `<p class="empty-state-desc">${isAuditor ? 'No se reportaron documentos o soportes faltantes obligatorios.' : 'No se identificaron secciones vacías o incompletas.'}</p>`;
  }

  // 8. RACCCA / Alertas Críticas Diana
  const racccaBox = document.getElementById('raccca-render-list');
  racccaBox.innerHTML = '';

  if (isAuditor) {
    if (parsed.raccca && parsed.raccca.length > 0) {
      parsed.raccca.forEach(r => {
        const row = document.createElement('div');
        row.className = 'raccca-item';
        row.innerHTML = `
          <div class="raccca-title-row">
            <span class="raccca-letter">${r.letter}</span>
            <span class="raccca-title">${r.title}</span>
          </div>
          <div class="raccca-desc">${r.desc}</div>
        `;
        racccaBox.appendChild(row);
      });
    } else {
      racccaBox.innerHTML = '<p class="empty-state-desc">Autocontrol RACCCA no formateado en la respuesta.</p>';
    }
  } else {
    // For Diana: Render Alertas Críticas
    if (parsed.alertas && parsed.alertas.length > 0) {
      parsed.alertas.forEach(al => {
        const card = document.createElement('div');
        card.className = 'comment-card';

        let sevClass = 'sev-baja';
        if (al.severity === 'Alta') sevClass = 'sev-alta';
        else if (al.severity === 'Media') sevClass = 'sev-media';

        card.innerHTML = `
          <div class="comment-meta" style="margin-bottom:0.25rem;">
            <span class="severity-badge ${sevClass}">${al.severity}</span>
          </div>
          <div class="comment-text" style="font-size:0.75rem;">${al.text}</div>
        `;
        racccaBox.appendChild(card);
      });
    } else {
      racccaBox.innerHTML = '<p class="empty-state-desc" style="color:var(--accent-success); font-weight:600; padding:20px 0; text-align:center;">No se evidenciaron alertas críticas en los documentos analizados.</p>';
    }
  }

  // Render newly added Lucide icons in dynamically created elements
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Render & Filter Findings Data Table
function renderFindingsTable(findings) {
  const tbody = document.getElementById('findings-tbody');
  tbody.innerHTML = '';

  if (!findings || findings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state" style="padding: 30px;">Ningún hallazgo encontrado en esta auditoría.</td></tr>';
    return;
  }

  findings.forEach(f => {
    const tr = document.createElement('tr');
    tr.setAttribute('data-severity', f.severidad.toLowerCase());
    tr.setAttribute('data-search', `${f.id} ${f.ubicacion} ${f.tipo} ${f.diagnostico} ${f.correccion}`.toLowerCase());

    let sevClass = 'sev-baja';
    if (f.severidad === 'Alta') sevClass = 'sev-alta';
    else if (f.severidad === 'Media') sevClass = 'sev-media';

    tr.innerHTML = `
      <td style="font-weight: 700; color: var(--text-primary); white-space: nowrap;">${f.id}</td>
      <td style="white-space: nowrap;">${f.ubicacion}</td>
      <td><span class="logo-badge" style="font-size: 0.65rem; padding: 0.1rem 0.3rem;">${f.tipo}</span></td>
      <td>${f.evidenciaPrincipal}</td>
      <td>${f.evidenciaSoporte}</td>
      <td>${f.diagnostico}</td>
      <td style="font-family: 'Fira Code', monospace; font-size: 0.75rem; background-color: rgba(0,0,0,0.15);">${f.correccion}</td>
      <td>
        <span class="severity-badge ${sevClass}" title="${f.razon}">${f.severidad}</span>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filterFindingsTable() {
  const query = document.getElementById('finding-search').value.toLowerCase().trim();
  const activeSeverityBtn = document.querySelector('.filter-badge.active');
  const targetSeverity = activeSeverityBtn ? activeSeverityBtn.getAttribute('data-severity') : 'all';

  const rows = document.querySelectorAll('#findings-tbody tr');

  rows.forEach(row => {
    // If table is empty fallback, skip
    if (row.cells.length === 1) return;

    const rowSeverity = row.getAttribute('data-severity');
    const rowSearchText = row.getAttribute('data-search');

    const matchesSeverity = (targetSeverity === 'all' || rowSeverity === targetSeverity);
    const matchesSearch = (!query || rowSearchText.includes(query));

    if (matchesSeverity && matchesSearch) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

// Render Comparison Tool Table
function renderComparisonTable(markdownText) {
  const resultsBox = document.getElementById('compare-results-box');

  // Extract table rows from markdown
  const lines = markdownText.split('\n');
  const tableLines = lines.filter(l => l.includes('|'));

  if (tableLines.length < 3) {
    // Return markdown text formatted as a card
    resultsBox.innerHTML = `
      <div class="comparison-results-card">
        <h3 class="section-title">Resultados de Comparación</h3>
        <div style="font-family:'Fira Code', monospace; white-space: pre-wrap; font-size:0.75rem; padding:1rem; background-color:#05080f; border-radius:8px;">
          ${markdownText}
        </div>
      </div>
    `;
    return;
  }

  // Parse Markdown Table
  const rows = tableLines.map(line => {
    return line.split('|')
      .map(cell => cell.trim())
      .filter((cell, index, arr) => {
        if (index === 0 && cell === '') return false;
        if (index === arr.length - 1 && cell === '') return false;
        return true;
      });
  });

  // Filter separator row
  const cleanRows = rows.filter(row => {
    if (row.length === 0) return false;
    return !row.every(cell => /^:?-+:?$/.test(cell));
  });

  const headers = cleanRows[0];
  const dataRows = cleanRows.slice(1);

  // Generate Table HTML
  let tableHTML = `
    <div class="comparison-results-card">
      <h3 class="section-title">Resultados de Comparación Literal</h3>
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              ${headers.map(h => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
  `;

  dataRows.forEach(row => {
    tableHTML += `<tr>`;
    row.forEach((cell, idx) => {
      // Format identical column cell
      if (headers[idx] && headers[idx].toLowerCase().includes('identic')) {
        const isIdentical = /si/i.test(cell) || /yes/i.test(cell) || /identico/i.test(cell);
        const tagClass = isIdentical ? 'tag-identical-yes' : 'tag-identical-no';
        tableHTML += `<td><span class="comparison-tag ${tagClass}">${cell}</span></td>`;
      }
      // Format text cells with monospace
      else if (idx === 0 || idx === 1) {
        tableHTML += `<td><div class="comparison-fragment">${cell}</div></td>`;
      } else {
        tableHTML += `<td>${cell}</td>`;
      }
    });
    tableHTML += `</tr>`;
  });

  tableHTML += `
          </tbody>
        </table>
      </div>
    </div>
  `;

  resultsBox.innerHTML = tableHTML;
}

// History Render list in Sidebar
function renderHistoryList() {
  const historyList = document.getElementById('session-history-list');
  historyList.innerHTML = '';

  if (state.history.length === 0) {
    historyList.innerHTML = '<div class="empty-state-desc" style="text-align:center; padding: 10px 0;">No hay historial guardado</div>';
    return;
  }

  state.history.forEach((audit) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    if (state.currentAudit && state.currentAudit.id === audit.id) {
      item.classList.add('active');
    }

    item.innerHTML = `
      <div class="history-title">${audit.title}</div>
      <div class="history-date">${audit.date}</div>
    `;

    item.addEventListener('click', () => {
      state.currentAudit = audit;

      // Update form files visual text
      document.getElementById('main-doc-text').value = audit.mainDocName ? `[Cargado del Historial: ${audit.mainDocName}]` : '';
      const supportsTextEl = document.getElementById('supports-doc-text');
      if (supportsTextEl) {
        supportsTextEl.value = '';
      }

      // Update sidebar state items active state
      document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');

      // Restore saved active tool mode
      if (audit.tool) {
        state.activeTool = audit.tool;
        state.systemPrompt = state.activeTool === 'auditor' ? state.promptAuditor : state.promptDiana;
        document.getElementById('tool-select').value = state.activeTool;
        updateUI();
      }

      // Show output console and load parsed results
      document.getElementById('stream-console').textContent = audit.rawOutput;
      renderResults(audit.parsed);

      showToast('Auditoría del historial cargada.');
      switchTab('dictamen');
    });

    historyList.appendChild(item);
  });
}

// Clipboard copying utility
window.copyTextToClipboard = function (text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Texto copiado al portapapeles');
  }).catch(err => {
    console.error('Error al copiar: ', err);
    showToast('Error al copiar texto');
  });
};


// UI Notifications (Toast)
function showToast(message) {
  // Remove existing toasts first
  const existing = document.querySelectorAll('.notification-toast');
  existing.forEach(t => t.remove());

  const toast = document.createElement('div');
  toast.className = 'notification-toast';
  toast.innerHTML = `
    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'none'; // reset animation to fade out smoothly
    toast.style.transition = 'opacity 0.3s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Global UI updater
function updateUI() {
  updateModelOptions();
  updateFileStats();
  renderHistoryList();

  const isAuditor = state.activeTool === 'auditor';

  // Update Active Tab labels dynamically
  document.getElementById('tab-btn-activa').innerHTML = `<i data-lucide="terminal" style="width: 14px;"></i> ${isAuditor ? 'Auditoría Activa' : 'Diana Activa'}`;
  const tabResumenEl = document.getElementById('tab-btn-resumen');
  if (tabResumenEl) tabResumenEl.style.display = isAuditor ? 'none' : 'flex';
  document.getElementById('tab-btn-dictamen').innerHTML = `<i data-lucide="activity" style="width: 14px;"></i> ${isAuditor ? 'Dictamen y Ficha' : 'Resultado y Conclusión'}`;
  document.getElementById('tab-btn-matriz').innerHTML = `<i data-lucide="table" style="width: 14px;"></i> ${isAuditor ? 'Matriz de Hallazgos' : 'Matriz de Comparación'}`;
  document.getElementById('tab-btn-redlines').innerHTML = `<i data-lucide="git-merge" style="width: 14px;"></i> ${isAuditor ? 'Redlines y Word' : 'Omitidos y Modificados'}`;
  document.getElementById('tab-btn-faltantes').innerHTML = `<i data-lucide="check-square" style="width: 14px;"></i> ${isAuditor ? 'Faltantes y RACCCA' : 'Incompletos y Alertas'}`;

  const consolePaneTitle = document.getElementById('console-pane-title');
  if (consolePaneTitle) {
    consolePaneTitle.innerHTML = `<i data-lucide="terminal" style="width: 14px;"></i> ${isAuditor ? 'Salida Forense del Auditor' : 'Salida de Diana Contrate'}`;
  }

  // Update Upload Labels & Placeholders
  const labelMainEl = document.getElementById('label-main-upload');
  if (labelMainEl) {
    labelMainEl.textContent = isAuditor ? 'Documento Principal y Soportes (Contrato, Otrosí, Pólizas, CDP, Anexos, etc.)' : 'Documento de Necesidad y Soportes (Estudios, Anexos, Cotizaciones, CDP, etc.)';
  }
  const textMainTitleEl = document.getElementById('text-main-upload-title');
  if (textMainTitleEl) {
    textMainTitleEl.textContent = isAuditor ? 'Arrastra el Contrato y todos sus Soportes' : 'Arrastra la Necesidad y todos sus Soportes/Anexos';
  }
  const labelSupportEl = document.getElementById('label-support-upload');
  if (labelSupportEl) {
    labelSupportEl.textContent = isAuditor ? 'Soportes (Póliza, CDP, Anexos)' : 'Soportes (Estudios Previos, Cotizaciones)';
  }
  const textSupportTitleEl = document.getElementById('text-support-upload-title');
  if (textSupportTitleEl) {
    textSupportTitleEl.textContent = isAuditor ? 'Arrastra soportes' : 'Arrastra soportes técnicos';
  }

  // Preview Pane titles
  const previewPaneTitleEl = document.getElementById('preview-pane-title');
  if (previewPaneTitleEl) {
    previewPaneTitleEl.innerHTML = `<i data-lucide="file-code" style="width: 14px;"></i> ${isAuditor ? 'Textos del Contrato cargados' : 'Textos de Necesidad cargados'}`;
  }
  const mainDocInputBoxTitleEl = document.getElementById('main-doc-input-box-title');
  if (mainDocInputBoxTitleEl) {
    mainDocInputBoxTitleEl.textContent = isAuditor ? 'DOCUMENTO PRINCIPAL Y SOPORTES' : 'DOCUMENTO DE NECESIDAD Y SOPORTES';
  }
  const supportDocInputBoxTitleEl = document.getElementById('support-doc-input-box-title');
  if (supportDocInputBoxTitleEl) {
    supportDocInputBoxTitleEl.textContent = isAuditor ? 'SOPORTES (PÓLIZAS, CDP, ANEXOS)' : 'SOPORTES (ESTUDIOS PREVIOS, COTIZACIONES)';
  }

  // Result cards titles
  document.getElementById('dictamen-card-title').innerHTML = `<i data-lucide="award" style="width: 16px;"></i> ${isAuditor ? 'Dictamen Forense Ejecutivo' : 'Resultado General de Auditoría'}`;
  document.getElementById('ficha-card-title').innerHTML = `<i data-lucide="database" style="width: 16px;"></i> ${isAuditor ? 'Ficha Maestra de Datos Críticos' : 'Recomendaciones Estructurales'}`;

  const conflictsPanelEl = document.getElementById('conflictos-panel');
  if (conflictsPanelEl) {
    conflictsPanelEl.style.display = 'block';
  }

  const btnRunMatrizEl = document.getElementById('btn-run-matriz');
  if (btnRunMatrizEl) btnRunMatrizEl.style.display = isAuditor ? 'none' : 'inline-flex';

  const conflictsCardTitle = document.getElementById('conflictos-card-title');
  if (conflictsCardTitle) {
    if (isAuditor) {
      conflictsCardTitle.innerHTML = `<i data-lucide="alert-triangle" style="width: 16px; color: var(--severity-high);"></i> Conflictos entre Documentos Soporte`;
    } else {
      conflictsCardTitle.innerHTML = `<i data-lucide="check-check" style="width: 16px; color: var(--accent-success);"></i> Coherencia e Incoherencias entre Soportes
        <button onclick="runCoherenceCheck()" class="btn btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.55rem;margin-left:0.75rem;">
          <i data-lucide="refresh-cw" style="width:11px;"></i> Analizar
        </button>`;
    }
  }

  const baseUploadGroup = document.getElementById('base-upload-group');
  if (baseUploadGroup) {
    baseUploadGroup.style.display = isAuditor ? 'none' : 'block';
  }


  // Redlines, comments, checklists titles
  document.getElementById('redline-card-title').innerHTML = `<i data-lucide="git-commit" style="width: 16px;"></i> ${isAuditor ? 'Redlines (Modificaciones Listas para Pegar)' : 'Títulos Modificados o Renombrados'}`;
  document.getElementById('comment-card-title').innerHTML = `<i data-lucide="message-square" style="width: 16px;"></i> ${isAuditor ? 'Comentarios Accionables para insertar en Word' : 'Títulos Omitidos o Eliminados del Formato Base'}`;

  document.getElementById('faltantes-card-title').innerHTML = `<i data-lucide="file-warning" style="width: 16px; color: var(--severity-medium);"></i> ${isAuditor ? 'Documentos Faltantes y No Verificables' : 'Elementos Incompletos del Documento'}`;
  document.getElementById('faltantes-card-desc').textContent = isAuditor ? 'Marque los documentos faltantes a medida que los consiga en el expediente contractual.' : 'Marque las secciones incompletas que vaya completando en el expediente.';
  document.getElementById('raccca-card-title').innerHTML = `<i data-lucide="check-check" style="width: 16px; color: var(--accent-success);"></i> ${isAuditor ? 'Módulo de Autocontrol RACCCA' : 'Alertas Críticas Identificadas'}`;
  document.getElementById('raccca-card-desc').textContent = isAuditor ? 'Verificación del auditor contra los estándares de calidad del control forense.' : 'Advertencias de inconsistencias graves detectadas en los documentos de necesidad y soportes.';

  document.getElementById('prompt-card-title').innerHTML = `<i data-lucide="cpu" style="width: 16px;"></i> ${isAuditor ? 'Prompt de Sistema Forense' : 'Prompt de Diana Contrate'}`;

  // Update Matriz Table column headers
  const thead = document.getElementById('findings-thead');
  if (isAuditor) {
    thead.innerHTML = `
      <tr>
        <th style="width: 70px;">ID</th>
        <th style="width: 120px;">Ubicación</th>
        <th style="width: 130px;">Tipo</th>
        <th>Evidencia Principal</th>
        <th>Evidencia Soporte</th>
        <th>Diagnóstico</th>
        <th>Corrección Aplicable</th>
        <th style="width: 100px;">Severidad</th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th style="width: 70px;">No.</th>
        <th style="width: 180px;">Título o elemento del formato base</th>
        <th style="width: 100px;">Tipo</th>
        <th>Requisito</th>
        <th>Estado</th>
        <th>Observación</th>
        <th>Recomendación</th>
        <th style="width: 100px;">Severidad</th>
      </tr>
    `;
  }

  // Refresh Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
