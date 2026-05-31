/**
 * Parser for Legal-Technical Contract Auditor Markdown Output
 */

const Parser = {
  /**
   * Parse the complete raw output text from LLM into structured sections
   * @param {string} text 
   * @param {string} tool Active tool ('auditor' or 'diana')
   * @returns {Object} Structured data
   */
  parse(text, tool = 'auditor') {
    if (!text) return null;

    if (tool === 'diana') {
      return this.parseDiana(text);
    }

    const sections = this.splitSections(text);
    
    return {
      dictamen: this.parseDictamen(sections.dictamen),
      ficha: this.parseFicha(sections.ficha),
      matriz: this.parseMatriz(sections.matriz),
      conflictos: this.parseConflictos(sections.conflictos),
      redlines: this.parseRedlines(sections.redlines),
      comentarios: this.parseComentarios(sections.comentarios),
      faltantes: this.parseFaltantes(sections.faltantes),
      raccca: this.parseRaccca(sections.raccca),
      raw: text // fallback or full view
    };
  },

  /**
   * Split text into sections based on headers and common keywords
   * @param {string} text 
   * @returns {Object} Raw text for each section
   */
  splitSections(text) {
    // We split by markdown headers (# or ## or ###)
    const lines = text.split('\n');
    const sections = {
      dictamen: '',
      ficha: '',
      matriz: '',
      conflictos: '',
      redlines: '',
      comentarios: '',
      faltantes: '',
      raccca: ''
    };

    let currentSection = null;
    let sectionBuffer = [];

    const flushBuffer = () => {
      if (currentSection && sectionBuffer.length > 0) {
        sections[currentSection] = sectionBuffer.join('\n').trim();
      }
      sectionBuffer = [];
    };

    for (let line of lines) {
      // Check if line looks like a header (allowing numbered formats, bold tags, and standard headers)
      const headerMatch = line.match(/^#{1,4}\s+(.*)$/i) || 
                          line.match(/^\*\*(Dictamen ejecutivo|Ficha maestra|Matriz exhaustiva|Conflictos entre soportes|Redlines listos|Comentarios pegables|Faltantes\/no verificables|Autocontrol RACCCA).*\*\*$/i) ||
                          line.match(/^(?:1\.|2\.|3\.|4\.|5\.|6\.|7\.|8\.)\s*(Dictamen ejecutivo|Ficha maestra|Matriz exhaustiva|Conflictos entre soportes|Redlines listos|Comentarios pegables|Faltantes\/no verificables|Autocontrol RACCCA)/i);
      
      if (headerMatch) {
        const headerTitle = headerMatch[1].toLowerCase();
        
        // Map header to section key
        let matchedSection = null;
        if (headerTitle.includes('dictamen')) {
          matchedSection = 'dictamen';
        } else if (headerTitle.includes('ficha') || headerTitle.includes('maestra')) {
          matchedSection = 'ficha';
        } else if (headerTitle.includes('matriz') || headerTitle.includes('hallazgo')) {
          matchedSection = 'matriz';
        } else if (headerTitle.includes('conflicto') || headerTitle.includes('choque')) {
          matchedSection = 'conflictos';
        } else if (headerTitle.includes('redline') || headerTitle.includes('reemplazo')) {
          matchedSection = 'redlines';
        } else if (headerTitle.includes('comentario') || headerTitle.includes('word')) {
          matchedSection = 'comentarios';
        } else if (headerTitle.includes('faltante') || headerTitle.includes('no verificable')) {
          matchedSection = 'faltantes';
        } else if (headerTitle.includes('raccca') || headerTitle.includes('autocontrol')) {
          matchedSection = 'raccca';
        }

        if (matchedSection) {
          flushBuffer();
          currentSection = matchedSection;
          // Skip the header line in the section content buffer for cleaner text
          continue;
        }
      }

      if (currentSection) {
        sectionBuffer.push(line);
      } else {
        // If we haven't hit a header yet, everything goes to dictamen by default
        if (line.trim()) {
          currentSection = 'dictamen';
          sectionBuffer.push(line);
        }
      }
    }
    flushBuffer();

    return sections;
  },

  /**
   * Parse Dictamen Ejecutivo Section
   * Extracts overall status and reason text
   */
  parseDictamen(text) {
    if (!text) return { status: 'no-verificable', text: 'No se generó dictamen ejecutivo.' };

    let status = 'no-verificable';
    const lowerText = text.toLowerCase();

    if (lowerText.includes('consistente con ajustes') || lowerText.includes('consistente con modificaciones')) {
      status = 'consistente';
    } else if (lowerText.includes('inconsistente')) {
      status = 'inconsistente';
    } else if (lowerText.includes('no verificable')) {
      status = 'no-verificable';
    }

    return {
      status,
      text: text.replace(/^\*\*Estado:\*\*\s*/i, '') // Clean bold header if exists
    };
  },

  /**
   * Parse Ficha Maestra Section
   * Extracts fields in bullet points or markdown tables
   */
  parseFicha(text) {
    if (!text) return [];

    const items = [];
    const lines = text.split('\n');

    // Try parsing bullet points: "* **Contrato (número/año):** [Ubicación] - Valor"
    for (let line of lines) {
      // Match format: - **Field Name**: [Location] Value or - **Field Name**: Value (Location)
      const listMatch = line.match(/^[-*+]\s+\*\*(.*?)\*\*:\s*(.*)$/i) || line.match(/^[-*+]\s+(.*?):\s*(.*)$/i);
      
      if (listMatch) {
        let label = listMatch[1].trim();
        let fullVal = listMatch[2].trim();
        
        // Look for location inside brackets [...] or parentheses (...)
        let location = '';
        const locMatch = fullVal.match(/\[(.*?)\]/) || fullVal.match(/\((Ubicación|Cláusula|Sección|Pág|Página).*?\)/i);
        
        if (locMatch) {
          location = locMatch[0].replace(/[\[\]]/g, '').trim();
          fullVal = fullVal.replace(locMatch[0], '').trim();
        }

        // Clean up trailing commas or dashes
        fullVal = fullVal.replace(/^[-:\s]+|[-:\s]+$/g, '').trim();

        items.push({
          label,
          value: fullVal || 'No especificado en el texto',
          location: location || null
        });
      }
    }

    // Fallback: If no bullet points were parsed but text exists, split by paragraphs
    if (items.length === 0 && text.trim()) {
      const paragraphs = text.split('\n\n').filter(p => p.trim());
      paragraphs.forEach((p, idx) => {
        const parts = p.split('\n');
        items.push({
          label: `Información ${idx + 1}`,
          value: parts.join(' '),
          location: null
        });
      });
    }

    return items;
  },

  /**
   * Parse Matriz de Hallazgos Section
   * Parses Markdown table and maps columns to JSON keys
   */
  parseMatriz(text) {
    if (!text) return [];

    // Find table start and end
    const lines = text.split('\n');
    const tableLines = [];
    let insideTable = false;

    for (let line of lines) {
      if (line.includes('|')) {
        insideTable = true;
        tableLines.push(line);
      } else if (insideTable) {
        // Table finished
        break;
      }
    }

    if (tableLines.length < 3) {
      return this.parseMatrizFallback(text);
    }

    // Parse the Markdown table rows
    const rows = tableLines.map(line => {
      return line.split('|')
        .map(cell => cell.trim())
        .filter((cell, index, arr) => {
          if (index === 0 && cell === '') return false;
          if (index === arr.length - 1 && cell === '') return false;
          return true;
        });
    });

    // Remove separator row (e.g. |---|---|)
    const cleanRows = rows.filter(row => {
      if (row.length === 0) return false;
      return !row.every(cell => /^:?-+:?$/.test(cell));
    });

    if (cleanRows.length < 2) return this.parseMatrizFallback(text);

    const headers = cleanRows[0];
    const dataRows = cleanRows.slice(1);

    return dataRows.map((row, rowIdx) => {
      const rowData = {
        id: `H-${rowIdx + 1}`,
        ubicacion: 'N/A',
        tipo: 'Interna/Interdocumental',
        evidenciaPrincipal: '',
        evidenciaSoporte: 'No verificable',
        diagnostico: '',
        correccion: '',
        severidad: 'Media',
        razon: ''
      };

      headers.forEach((header, index) => {
        const val = row[index] || '';
        const hKey = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (hKey.includes('id')) {
          rowData.id = val.replace(/[^a-zA-Z0-9-]/g, '') || rowData.id;
        } else if (hKey.includes('ubic') || hKey.includes('claus') || hKey.includes('numeral')) {
          rowData.ubicacion = val;
        } else if (hKey.includes('tipo')) {
          rowData.tipo = val;
        } else if (hKey.includes('principal') || hKey.includes('primario')) {
          rowData.evidenciaPrincipal = val;
        } else if (hKey.includes('soporte') || hKey.includes('contradic') || hKey.includes('anexo')) {
          rowData.evidenciaSoporte = val;
        } else if (hKey.includes('diagn') || hKey.includes('hallazgo') || hKey.includes('error')) {
          rowData.diagnostico = val;
        } else if (hKey.includes('corre') || hKey.includes('cambio') || hKey.includes('redac')) {
          rowData.correccion = val;
        } else if (hKey.includes('sever') || hKey.includes('nivel') || hKey.includes('impacto')) {
          // Severidad usually has Alta/Media/Baja
          let sev = 'Media';
          if (/alta/i.test(val)) sev = 'Alta';
          else if (/baja/i.test(val)) sev = 'Baja';
          
          rowData.severidad = sev;
          // Extract reason if present in the same cell (e.g. "Alta (Afecta objeto)")
          const reasonMatch = val.match(/\(([^)]+)\)/);
          rowData.razon = reasonMatch ? reasonMatch[1] : val;
        }
      });

      return rowData;
    });
  },

  /**
   * Fallback for Matriz de Hallazgos if no markdown table found
   */
  parseMatrizFallback(text) {
    if (!text || !text.trim()) return [];

    const findings = [];
    const blocks = text.split(/(?:^|\n)(?=ID:?|Hallazgo \d+|Hallazgo [A-Z]|[-*]\s+ID:?)/i);

    let idCounter = 1;
    for (let block of blocks) {
      if (!block.trim()) continue;
      
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const finding = {
        id: `H-${idCounter++}`,
        ubicacion: 'Ver descripción',
        tipo: 'General',
        evidenciaPrincipal: 'Ver bloque principal',
        evidenciaSoporte: 'No verificable',
        diagnostico: block,
        correccion: 'Revisión técnica requerida',
        severidad: 'Media',
        razon: 'Clasificación por defecto'
      };

      // Try parsing key-value pairs inside the block
      for (let line of lines) {
        const match = line.match(/^[-*]?\s*\*\*(.*?)\*\*:\s*(.*)$/i) || line.match(/^[-*]?\s*(.*?):\s*(.*)$/i);
        if (match) {
          const key = match[1].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const val = match[2].trim();

          if (key.includes('id')) finding.id = val;
          else if (key.includes('ubicacion')) finding.ubicacion = val;
          else if (key.includes('tipo')) finding.tipo = val;
          else if (key.includes('principal')) finding.evidenciaPrincipal = val;
          else if (key.includes('soporte')) finding.evidenciaSoporte = val;
          else if (key.includes('diagnostico')) finding.diagnostico = val;
          else if (key.includes('correccion')) finding.correccion = val;
          else if (key.includes('severidad')) {
            if (/alta/i.test(val)) finding.severidad = 'Alta';
            else if (/baja/i.test(val)) finding.severidad = 'Baja';
            finding.razon = val;
          }
        }
      }

      findings.push(finding);
    }

    return findings;
  },

  /**
   * Parse Conflictos entre Soportes Section
   */
  parseConflictos(text) {
    if (!text) return [];
    
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))
      .map(line => line.replace(/^[-*\d.\s]+/, ''));
  },

  /**
   * Parse Redlines listos para pegar Section
   */
  parseRedlines(text) {
    if (!text) return [];

    const redlines = [];
    
    // We split by markdown code blocks or header indicators
    const blocks = text.split(/(?=#{3,4}\s+|\n\*\*(?:Redline|Reemplazo|Hallazgo|ID)\s+\d+\*\*)/i);

    for (let block of blocks) {
      if (!block.trim()) continue;

      const titleMatch = block.match(/(?:#{3,4}\s+|\n\*\*)(.*?)(?:\*\*|\n|$)/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Reemplazo Textual';

      // Look for code blocks (fenced with ```)
      const codeBlockMatches = [...block.matchAll(/```(?:diff|text|txt)?\n([\s\S]*?)```/g)];
      
      if (codeBlockMatches.length > 0) {
        codeBlockMatches.forEach((match, idx) => {
          const codeContent = match[1];
          const lines = codeContent.split('\n');
          
          let original = '';
          let replacement = '';

          // Look for - and + indicators (standard diff)
          const minusLines = lines.filter(l => l.startsWith('-'));
          const plusLines = lines.filter(l => l.startsWith('+'));

          if (minusLines.length > 0 || plusLines.length > 0) {
            original = minusLines.map(l => l.substring(1).trim()).join('\n');
            replacement = plusLines.map(l => l.substring(1).trim()).join('\n');
          } else {
            // If it's a replacement but not diff format, look for "Texto original:" or similar keywords
            const origMatch = codeContent.match(/(?:texto original|original|eliminar|actual):\n([\s\S]*?)(?:\n\n|\n(?:reemplazo|nuevo|propuesto|corregido):\n|$)/i);
            const repMatch = codeContent.match(/(?:texto corregido|texto nuevo|reemplazo|nuevo|propuesto|corregido):\n([\s\S]*?)$/i);

            if (origMatch) original = origMatch[1].trim();
            if (repMatch) replacement = repMatch[1].trim();

            if (!original && !replacement) {
              replacement = codeContent.trim();
            }
          }

          redlines.push({
            title: codeBlockMatches.length > 1 ? `${title} (${idx + 1})` : title,
            original: original || null,
            replacement: replacement
          });
        });
      } else {
        // Fallback: No code block, try parsing text lines directly
        // Look for "Texto original:" or "Texto propuesto:" in raw text
        const origMatch = block.match(/(?:Texto Original|Original|Eliminar):\s*([\s\S]*?)(?=(?:Texto Propuesto|Texto Nuevo|Reemplazar por|Nuevo|Propuesto|Corregido):|$)/i);
        const repMatch = block.match(/(?:Texto Propuesto|Texto Nuevo|Reemplazar por|Nuevo|Propuesto|Corregido):\s*([\s\S]*?)$/i);

        if (origMatch || repMatch) {
          redlines.push({
            title,
            original: origMatch ? origMatch[1].trim() : null,
            replacement: repMatch ? repMatch[1].trim() : block.trim()
          });
        } else if (block.trim().length > 10) {
          // Last resort: add block as replacement
          redlines.push({
            title,
            original: null,
            replacement: block.trim()
          });
        }
      }
    }

    return redlines;
  },

  /**
   * Parse Comentarios pegables para Word
   */
  parseComentarios(text) {
    if (!text) return [];

    const comments = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (let line of lines) {
      if (line.startsWith('#')) continue;

      const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
      const cleanLine = isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;

      if (cleanLine.toLowerCase().includes('siguientes') || cleanLine.toLowerCase().includes('lista de') || cleanLine.length < 5) {
        continue;
      }

      // Try to extract location from brackets or bold text
      const commentMatch = cleanLine.match(/^\*\*\[(.*?)\]\*\*\s*[:\-]?\s*(.*)$/i) || 
                           cleanLine.match(/^\[(.*?)\]\s*[:\-]?\s*(.*)$/i) ||
                           cleanLine.match(/^\*\*(.*?)\*\*\s*[:\-]?\s*(.*)$/i);

      if (commentMatch) {
        comments.push({
          location: commentMatch[1].trim(),
          text: commentMatch[2].trim() || commentMatch[1].trim()
        });
      } else {
        comments.push({
          location: 'Comentario',
          text: cleanLine
        });
      }
    }

    return comments;
  },

  /**
   * Parse Faltantes/No Verificables Checklist
   */
  parseFaltantes(text) {
    if (!text || text.toLowerCase().includes('no se reportaron') || text.toLowerCase().includes('no hay')) return [];

    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
        return isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;
      })
      .filter(line => !line.toLowerCase().includes('siguientes') && !line.toLowerCase().includes('lista de') && line.length > 2);
  },

  /**
   * Parse Autocontrol RACCCA (6 lines)
   */
  parseRaccca(text) {
    if (!text) return [];

    const racccaList = [];
    const lines = text.split('\n');

    const racccaLetters = {
      r: { char: 'R', title: 'Relevancia' },
      a: { char: 'A', title: 'Exactitud' }, // Accuracy
      c: { char: 'C', title: 'Completitud' },
      cl: { char: 'C', title: 'Claridad' },
      co: { char: 'C', title: 'Coherencia' },
      ad: { char: 'A', title: 'Adecuación' }
    };

    // Keep track of matched letters to avoid duplicates and map accurately
    const seen = new Set();

    for (let line of lines) {
      // Match letter code and description: "Relevancia: ... " or "R - Relevancia: ..."
      const match = line.match(/^[-*]?\s*\*\*?(Relevancia|Exactitud|Completitud|Claridad|Coherencia|Adecuacion)\*\*?:?\s*(.*)$/i) ||
                    line.match(/^[-*]?\s*\*\*?([RACCCA])\*\*?[-:]?\s*(.*?):?\s*(.*)$/i);

      if (match) {
        let title = '';
        let desc = '';
        let letter = '';

        if (match.length === 3) {
          title = match[1].trim();
          desc = match[2].trim();
          letter = title.charAt(0).toUpperCase();
        } else {
          letter = match[1].toUpperCase();
          title = match[2] ? match[2].trim() : '';
          desc = match[3] ? match[3].trim() : '';
          
          if (!title) {
            // Fill title based on letter mapping
            if (letter === 'R') title = 'Relevancia';
            else if (letter === 'A' && !seen.has('Exactitud')) title = 'Exactitud';
            else if (letter === 'A') title = 'Adecuación';
            else if (letter === 'C' && !seen.has('Completitud')) title = 'Completitud';
            else if (letter === 'C' && !seen.has('Claridad')) title = 'Claridad';
            else if (letter === 'C') title = 'Coherencia';
          }
        }

        seen.add(title);
        racccaList.push({
          letter: letter.charAt(0),
          title,
          desc
        });
      }
    }

    // Fallback: If RACCCA wasn't formatted strictly, split by lines starting with letters
    if (racccaList.length === 0 && text.trim()) {
      text.split('\n').filter(l => l.trim()).forEach(line => {
        const cleanLine = line.replace(/^[-*\s]+/, '');
        const firstLetter = cleanLine.charAt(0).toUpperCase();
        if ('RACCCA'.includes(firstLetter)) {
          const parts = cleanLine.split(/[-:]/);
          racccaList.push({
            letter: firstLetter,
            title: parts[0] ? parts[0].trim() : 'Chequeo',
            desc: parts.slice(1).join('-').trim() || cleanLine
          });
        }
      });
    }

    return racccaList;
  },

  /**
   * Parse complete output text for Diana Contrate tool
   */
  parseDiana(text) {
    if (!text) return null;

    const sections = this.splitSectionsDiana(text);

    return {
      dictamen: this.parseResultadoDiana(sections.resultado),
      ficha: [], 
      matriz: this.parseMatrizDiana(sections.matriz),
      conflictos: this.parseCoherenciaDiana(sections.coherencia, sections.modificados), 
      redlines: this.parseModificadosDiana(sections.modificados), // Map to modified titles
      comentarios: this.parseOmitidosDiana(sections.omitidos), // Map to omitted titles
      faltantes: this.parseIncompletosDiana(sections.incompletos), // Map to elements incomplete
      alertas: this.parseAlertasDiana(sections.alertas), 
      recomendaciones: this.parseRecomendacionesDiana(sections.recomendaciones), 
      conclusion: sections.conclusion || 'No se generó conclusión final.',
      raw: text
    };
  },

  /**
   * Parse coherence and inconsistencies between support documents in Diana mode
   */
  parseCoherenciaDiana(coherenciaText, modificadosText) {
    const list = [];

    // 1. Parse from dedicated coherencia section
    if (coherenciaText && coherenciaText.trim()) {
      const lines = coherenciaText.split('\n').map(l => l.trim()).filter(Boolean);
      let currentPara = [];
      
      for (let line of lines) {
        if (line.startsWith('#')) continue;
        
        if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
          if (currentPara.length > 0) {
            list.push(currentPara.join(' '));
            currentPara = [];
          }
          list.push(line.replace(/^[-*\d.\s]+/, ''));
        } else {
          currentPara.push(line);
        }
      }
      if (currentPara.length > 0) {
        list.push(currentPara.join(' '));
      }
    }

    // 2. Also check if there's any non-table content in modificadosText that talks about coherence or supports
    if (modificadosText && modificadosText.trim()) {
      const lines = modificadosText.split('\n').map(l => l.trim()).filter(Boolean);
      let currentPara = [];
      
      for (let line of lines) {
        if (line.startsWith('#')) continue;
        
        // If it's a table row, skip
        if (line.includes('|')) {
          if (currentPara.length > 0) {
            const pText = currentPara.join(' ');
            const lower = pText.toLowerCase();
            if (lower.includes('coherencia') || lower.includes('soporte') || lower.includes('incoherencia') || lower.includes('diferencia') || lower.includes('contradic')) {
              list.push(pText);
            }
            currentPara = [];
          }
          continue;
        }
        
        if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
          if (currentPara.length > 0) {
            const pText = currentPara.join(' ');
            const lower = pText.toLowerCase();
            if (lower.includes('coherencia') || lower.includes('soporte') || lower.includes('incoherencia') || lower.includes('diferencia') || lower.includes('contradic')) {
              list.push(pText);
            }
            currentPara = [];
          }
          const cleanLine = line.replace(/^[-*\d.\s]+/, '');
          const lower = cleanLine.toLowerCase();
          if (lower.includes('coherencia') || lower.includes('soporte') || lower.includes('incoherencia') || lower.includes('diferencia') || lower.includes('contradic')) {
            list.push(cleanLine);
          }
        } else {
          currentPara.push(line);
        }
      }
      if (currentPara.length > 0) {
        const pText = currentPara.join(' ');
        const lower = pText.toLowerCase();
        if (lower.includes('coherencia') || lower.includes('soporte') || lower.includes('incoherencia') || lower.includes('diferencia') || lower.includes('contradic')) {
          list.push(pText);
        }
      }
    }

    return list;
  },

  /**
   * Split sections for Diana Contrate output format
   */
  splitSectionsDiana(text) {
    const lines = text.split('\n');
    const sections = {
      resultado: '',
      matriz: '',
      omitidos: '',
      modificados: '',
      coherencia: '',
      incompletos: '',
      alertas: '',
      recomendaciones: '',
      conclusion: ''
    };

    let currentSection = null;
    let sectionBuffer = [];

    const flushBuffer = () => {
      if (currentSection && sectionBuffer.length > 0) {
        sections[currentSection] = sectionBuffer.join('\n').trim();
      }
      sectionBuffer = [];
    };

    for (let line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentSection) {
          sectionBuffer.push(line);
        }
        continue;
      }

      let matchedSection = null;
      const isBullet = /^[-*+]\s+/.test(trimmed);
      const isTableRow = trimmed.startsWith('|');

      if (!isBullet && !isTableRow) {
        let clean = trimmed;
        clean = clean.replace(/^#+\s*/, '');
        clean = clean.replace(/^[\s*_~`]+/g, '').replace(/[\s*_~`:]+$/g, '');
        clean = clean.replace(/^(?:\d+\.)+\s*/, '');
        clean = clean.replace(/^\d+[\s\).]+/g, '');
        
        const s = clean.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (s.length < 60) {
          if (s.startsWith('resultado general') || s === 'resultado' || s === 'resultado general de auditoria' || s === 'resultado general de auditoría') {
            matchedSection = 'resultado';
          } else if (s.startsWith('matriz') || s.includes('comparacion') || s.includes('comparan')) {
            matchedSection = 'matriz';
          } else if (s.includes('omitido') || s.includes('eliminado')) {
            matchedSection = 'omitidos';
          } else if (s.includes('coherencia') || s.includes('incoherencia') || s.includes('soportes')) {
            matchedSection = 'coherencia';
          } else if (s.includes('modificado') || s.includes('renombrado')) {
            matchedSection = 'modificados';
          } else if (s.includes('incompleto')) {
            matchedSection = 'incompletos';
          } else if (s.includes('alerta')) {
            matchedSection = 'alertas';
          } else if (s.includes('recomendacion')) {
            matchedSection = 'recomendaciones';
          } else if (s.startsWith('conclusion') || s === 'conclusion' || s.startsWith('conclusión')) {
            matchedSection = 'conclusion';
          }
        }
      }

      if (matchedSection) {
        flushBuffer();
        currentSection = matchedSection;
        continue;
      }

      if (currentSection) {
        sectionBuffer.push(line);
      } else {
        currentSection = 'resultado';
        sectionBuffer.push(line);
      }
    }
    flushBuffer();

    return sections;
  },

  parseResultadoDiana(text) {
    if (!text) return { status: 'no-verificable', text: 'No se generó el resultado general.' };

    let status = 'no-verificable';
    const lowerText = text.toLowerCase();

    if (lowerText.includes('cumple integralmente')) {
      status = 'consistente';
    } else if (lowerText.includes('cumple con observaciones')) {
      status = 'no-verificable';
    } else if (lowerText.includes('cumple parcialmente')) {
      status = 'inconsistente';
    } else if (lowerText.includes('no cumple por omisiones')) {
      status = 'inconsistente';
    }

    return {
      status,
      text: text.replace(/^\*\*Resultado:\*\*\s*/i, '').replace(/\*\*/g, '').trim()
    };
  },

  parseMatrizDiana(text) {
    if (!text) return [];

    const lines = text.split('\n');
    const tableLines = [];
    let insideTable = false;

    for (let line of lines) {
      if (line.includes('|')) {
        insideTable = true;
        tableLines.push(line);
      } else if (insideTable) {
        break;
      }
    }

    if (tableLines.length < 3) return [];

    const rows = tableLines.map(line => {
      return line.split('|')
        .map(cell => cell.trim())
        .filter((cell, index, arr) => {
          if (index === 0 && cell === '') return false;
          if (index === arr.length - 1 && cell === '') return false;
          return true;
        });
    });

    const cleanRows = rows.filter(row => {
      if (row.length === 0) return false;
      return !row.every(cell => /^:?-+:?$/.test(cell));
    });

    if (cleanRows.length < 2) return [];

    const headers = cleanRows[0];
    const dataRows = cleanRows.slice(1);

    return dataRows.map((row, index) => {
      const rowData = {
        id: `E-${index + 1}`,
        ubicacion: 'N/A', 
        tipo: 'Formato Base',
        evidenciaPrincipal: 'Formato de Necesidad',
        evidenciaSoporte: 'Cumple', 
        diagnostico: '', 
        correccion: '', 
        severidad: 'Baja',
        razon: ''
      };

      headers.forEach((header, idx) => {
        const val = row[idx] || '';
        const hKey = header.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (hKey.includes('no') || hKey === 'n') {
          rowData.id = val.replace(/[^0-9]/g, '') || `E-${index + 1}`;
        } else if (hKey.includes('titulo') || hKey.includes('elemento')) {
          rowData.ubicacion = val;
        } else if (hKey.includes('estado')) {
          rowData.evidenciaSoporte = val;
          let sev = 'Baja';
          const valLower = val.toLowerCase();
          if (valLower.includes('cumple parcialmente') || valLower.includes('no aplica no justificado')) {
            sev = 'Media';
          } else if (valLower.includes('no cumple')) {
            sev = 'Alta';
          }
          rowData.severidad = sev;
          rowData.razon = val;
        } else if (hKey.includes('observa')) {
          rowData.diagnostico = val;
        } else if (hKey.includes('recomenda')) {
          rowData.correccion = val;
        }
      });

      return rowData;
    });
  },

  parseModificadosDiana(text) {
    if (!text || text.toLowerCase().includes('no se identificaron')) return [];

    const lines = text.split('\n');
    const tableLines = [];
    let insideTable = false;

    for (let line of lines) {
      if (line.includes('|')) {
        insideTable = true;
        tableLines.push(line);
      } else if (insideTable) {
        break;
      }
    }

    if (tableLines.length < 3) {
      // Fallback for bulleted list format
      const list = [];
      const listLines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      for (let line of listLines) {
        const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
        const cleanLine = isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;
        
        if (cleanLine.toLowerCase().includes('siguientes') || cleanLine.toLowerCase().includes('lista de') || cleanLine.length < 4) {
          continue;
        }

        let original = '';
        let found = '';
        let obs = cleanLine;

        const arrowMatch = cleanLine.match(/(.*?)\s*[-=]>\s*(.*)/);
        const renameMatch = cleanLine.match(/título original\s+["']?(.*?)["']?\s+se\s+(?:renombró|cambió|modificó)\s+como\s+["']?(.*?)["']?/i);

        if (renameMatch) {
          original = renameMatch[1];
          found = renameMatch[2];
        } else if (arrowMatch) {
          original = arrowMatch[1];
          found = arrowMatch[2];
        } else {
          const colonMatch = cleanLine.match(/(.*?)\s*:\s*(.*)/);
          if (colonMatch) {
            original = colonMatch[1];
            found = colonMatch[2];
          } else {
            original = cleanLine;
            found = 'Modificado';
          }
        }

        list.push({
          title: original,
          original: original,
          replacement: found,
          reason: obs
        });
      }
      return list;
    }

    const rows = tableLines.map(line => {
      return line.split('|')
        .map(cell => cell.trim())
        .filter((cell, index, arr) => {
          if (index === 0 && cell === '') return false;
          if (index === arr.length - 1 && cell === '') return false;
          return true;
        });
    });

    const cleanRows = rows.filter(row => {
      if (row.length === 0) return false;
      return !row.every(cell => /^:?-+:?$/.test(cell));
    });

    if (cleanRows.length < 2) return [];

    const headers = cleanRows[0];
    const dataRows = cleanRows.slice(1);

    return dataRows.map(row => {
      const original = row[0] || '';
      const found = row[1] || '';
      const obs = row[2] || '';
      
      return {
        title: original,
        original: original,
        replacement: found,
        reason: obs
      };
    });
  },

  parseOmitidosDiana(text) {
    if (!text || text.toLowerCase().includes('no se identificaron') || text.toLowerCase().includes('no hay')) return [];
    
    const list = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (let line of lines) {
      if (line.startsWith('#')) continue;
      
      const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
      let clean = isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;
      clean = clean.replace(/\*\*/g, '').trim();
      
      if (clean.toLowerCase().includes('siguientes') || clean.toLowerCase().includes('lista de') || clean.length < 3) {
        continue;
      }
      
      list.push({
        location: 'Omisión',
        text: clean.includes('no se encontró') || clean.includes('omitido') || clean.includes('falta') ? clean : `El título/sección "${clean}" no se encontró en el documento. Se exige en el Formato Base.`
      });
    }
    return list;
  },

  parseIncompletosDiana(text) {
    if (!text || text.toLowerCase().includes('no se identificaron') || text.toLowerCase().includes('no hay')) return [];
    
    const list = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (let line of lines) {
      if (line.startsWith('#')) continue;
      
      const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
      let clean = isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;
      clean = clean.replace(/\*\*/g, '').trim();
      
      if (clean.toLowerCase().includes('siguientes') || clean.toLowerCase().includes('lista de') || clean.length < 3) {
        continue;
      }
      
      list.push(clean);
    }
    return list;
  },

  parseAlertasDiana(text) {
    if (!text || text.toLowerCase().includes('no se evidenciaron') || text.toLowerCase().includes('no hay')) return [];
    
    const alerts = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);

    for (let line of lines) {
      if (line.startsWith('#')) continue;
      
      const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
      let textVal = isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;
      const cleanTextVal = textVal.replace(/\*\*/g, '').trim();
      
      if (cleanTextVal.toLowerCase().includes('siguientes') || cleanTextVal.toLowerCase().includes('lista de') || cleanTextVal.length < 5) {
        continue;
      }
      
      let severity = 'Media';
      const lower = cleanTextVal.toLowerCase();
      
      if (lower.includes('alta') || lower.includes('timbre') || lower.includes('marca')) {
        severity = 'Alta';
      } else if (lower.includes('baja') || lower.includes('leve')) {
        severity = 'Baja';
      }
      
      alerts.push({
        severity,
        text: cleanTextVal
      });
    }
    return alerts;
  },

  parseRecomendacionesDiana(text) {
    if (!text || text.toLowerCase().includes('no se') || text.toLowerCase().includes('no hay')) return [];
    
    const list = [];
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (let line of lines) {
      if (line.startsWith('#')) continue;
      
      const isListItem = line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./);
      let clean = isListItem ? line.replace(/^[-*\d.\s]+/, '').trim() : line;
      clean = clean.replace(/\*\*/g, '').trim();
      
      if (clean.toLowerCase().includes('siguientes') || clean.toLowerCase().includes('lista de') || clean.length < 3) {
        continue;
      }
      
      list.push(clean);
    }
    return list;
  }
};

// Export to window if running in browser
if (typeof window !== 'undefined') {
  window.Parser = Parser;
}
