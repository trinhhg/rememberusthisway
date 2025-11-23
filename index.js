document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG & STATE ===
  const STORAGE_KEY = 'trinh_hg_settings_v5';
  const INPUT_STATE_KEY = 'trinh_hg_input_state_v5';

  const defaultState = {
    currentMode: 'default',
    modes: {
      default: { pairs: [], matchCase: false, wholeWord: false }
    }
  };

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
  let currentSplitMode = 2;
  let saveTimeout; // Biến dùng cho debounce

  // DOM ELEMENTS
  const els = {
    modeSelect: document.getElementById('mode-select'),
    list: document.getElementById('punctuation-list'),
    inputText: document.getElementById('input-text'),
    outputText: document.getElementById('output-text'),
    splitInput: document.getElementById('split-input-text'),
    splitWrapper: document.getElementById('split-outputs-wrapper'),
    matchCaseBtn: document.getElementById('match-case'),
    wholeWordBtn: document.getElementById('whole-word'),
    renameBtn: document.getElementById('rename-mode'),
    deleteBtn: document.getElementById('delete-mode'),
    emptyState: document.getElementById('empty-state')
  };

  // === CORE FUNCTIONS ===

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // type: 'success' | 'error' | 'info'
  function showNotification(msg, type = 'success') {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.textContent = msg;
    container.appendChild(note);
    setTimeout(() => {
      note.style.opacity = '0';
      setTimeout(() => note.remove(), 300);
    }, 3000);
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  }

  // --- LOGIC TÌM VÀ THAY THẾ CHÍNH (CẢI TIẾN) ---
  function performReplace(text) {
    if (!text) return { text: '', count: 0 };
    const mode = state.modes[state.currentMode];
    const rules = mode.pairs.filter(p => p.find && p.find.length > 0);

    let result = text;
    let totalCount = 0;

    for (const rule of rules) {
      try {
        let patternStr = escapeRegExp(rule.find);
        
        // --- XỬ LÝ WHOLE WORD CHO TIẾNG VIỆT ---
        // Sử dụng Lookbehind (?<!...) và Lookahead (?!...) để kiểm tra biên giới từ.
        // \p{L} là chữ cái (bao gồm tiếng Việt), \p{N} là số.
        // Ý nghĩa: "find" phải không được đứng sau hoặc đứng trước một chữ cái/số.
        if (mode.wholeWord) {
             // Cần dùng RegExp flag 'u' để hỗ trợ \p{L}
             patternStr = `(?<![\\p{L}\\p{N}_])${patternStr}(?![\\p{L}\\p{N}_])`;
        }

        const flags = 'g' + 'u' + (mode.matchCase ? '' : 'i');
        const regex = new RegExp(patternStr, flags);
        const replaceVal = rule.replace; 

        // Hàm replace callback nhận vào: match, ...args, offset, string
        result = result.replace(regex, (match, ...args) => {
          totalCount++; 
          
          // Lấy offset và chuỗi gốc từ arguments (do số lượng args capture group có thể thay đổi)
          const offset = args[args.length - 2];
          const wholeString = args[args.length - 1];

          let finalReplace = replaceVal;

          // 1. Xử lý Match Case (Viết hoa giống từ tìm thấy)
          if (!mode.matchCase) {
             if (match === match.toUpperCase()) finalReplace = replaceVal.toUpperCase();
             else if (match === match.toLowerCase()) finalReplace = replaceVal.toLowerCase();
             else if (match[0] === match[0].toUpperCase() && replaceVal.length > 0) {
                finalReplace = replaceVal.charAt(0).toUpperCase() + replaceVal.slice(1);
             }
          }

          // 2. Xử lý Context-Aware Capitalization (Viết hoa sau dấu chấm/đầu dòng)
          // Chỉ thực hiện nếu từ thay thế có nội dung
          if (finalReplace.length > 0) {
              const textBefore = wholeString.slice(0, offset);
              
              // Regex kiểm tra:
              // - Đầu dòng (bao gồm đầu văn bản): ^ hoặc \n
              // - Sau dấu kết thúc câu (.|?|!) + khoảng trắng tùy ý: (\.|\?|!)\s*$
              const isStartOfLine = /^\s*$/.test(textBefore) || /\n\s*$/.test(textBefore);
              const isAfterPunctuation = /(\.|\?|!)\s*$/.test(textBefore);

              if (isStartOfLine || isAfterPunctuation) {
                  finalReplace = finalReplace.charAt(0).toUpperCase() + finalReplace.slice(1);
              }
          }

          return finalReplace;
        });

      } catch (e) {
        console.warn('Regex Error:', rule.find, e);
      }
    }

    // Format lại dòng trống dư thừa
    const formatted = result.split(/\n/).map(l => l.trim()).filter(l => l).join('\n\n');
    return { text: formatted, count: totalCount };
  }

  // === UI MANIPULATION ===

  function renderModeSelect() {
    els.modeSelect.innerHTML = '';
    Object.keys(state.modes).sort().forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      els.modeSelect.appendChild(opt);
    });
    els.modeSelect.value = state.currentMode;
    updateModeButtons();
  }

  function updateModeButtons() {
    const isDefault = state.currentMode === 'default';
    els.renameBtn.classList.toggle('hidden', isDefault);
    els.deleteBtn.classList.toggle('hidden', isDefault);
    
    const mode = state.modes[state.currentMode];
    
    els.matchCaseBtn.textContent = `Match Case: ${mode.matchCase ? 'BẬT' : 'Tắt'}`;
    els.matchCaseBtn.classList.toggle('active', mode.matchCase);
    
    els.wholeWordBtn.textContent = `Whole Word: ${mode.wholeWord ? 'BẬT' : 'Tắt'}`;
    els.wholeWordBtn.classList.toggle('active', mode.wholeWord);
  }

  function addPairToUI(find = '', replace = '', append = false) {
    const item = document.createElement('div');
    item.className = 'punctuation-item';
    
    const safeFind = find.replace(/"/g, '&quot;');
    const safeReplace = replace.replace(/"/g, '&quot;');

    item.innerHTML = `
      <input type="text" class="find" placeholder="Tìm (VD: ,)" value="${safeFind}">
      <input type="text" class="replace" placeholder="Thay thế (để trống = xóa)" value="${safeReplace}">
      <button class="remove" tabindex="-1">×</button>
    `;

    item.querySelector('.remove').onclick = () => {
      item.remove();
      checkEmptyState();
      saveTempInput(); 
    };

    const inputs = item.querySelectorAll('input');
    inputs.forEach(inp => inp.addEventListener('input', saveTempInputDebounced));

    if (append) {
      els.list.appendChild(item);
    } else {
      els.list.insertBefore(item, els.list.firstChild);
    }
    checkEmptyState();
  }

  function loadSettingsToUI() {
    els.list.innerHTML = '';
    const mode = state.modes[state.currentMode];
    if (mode.pairs && mode.pairs.length > 0) {
      mode.pairs.forEach(p => addPairToUI(p.find, p.replace, true));
    }
    updateModeButtons();
    checkEmptyState();
  }

  function checkEmptyState() {
    const hasItems = els.list.children.length > 0;
    els.emptyState.classList.toggle('hidden', hasItems);
  }

  // Silent: không hiện thông báo nếu true
  function saveCurrentPairsToState(silent = false) {
    const items = Array.from(els.list.children);
    const newPairs = items.map(item => ({
      find: item.querySelector('.find').value,
      replace: item.querySelector('.replace').value 
    })).filter(p => p.find !== '');

    state.modes[state.currentMode].pairs = newPairs;
    saveState();
    if (!silent) showNotification('Đã lưu cài đặt!', 'success');
  }

  // === SPLIT CHAPTER LOGIC ===
  function renderSplitOutputs(count) {
    els.splitWrapper.innerHTML = '';
    
    for(let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'split-box';
        div.innerHTML = `
            <div class="split-header">
                <span>Phần ${i}</span>
                <span id="out-${i}-count" class="badge">Words: 0</span>
            </div>
            <textarea id="out-${i}-text" class="custom-scrollbar" readonly></textarea>
            <div class="split-footer">
              <button class="btn btn-secondary full-width copy-btn" data-target="out-${i}-text">Sao chép phần ${i}</button>
            </div>
        `;
        els.splitWrapper.appendChild(div);
    }
    
    // Attach copy events
    els.splitWrapper.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.target;
            const el = document.getElementById(id);
            if(el.value) {
                navigator.clipboard.writeText(el.value);
                showNotification(`Đã sao chép Phần ${id.split('-')[1]}`, 'success');
            }
        });
    });
  }

  function performSplit() {
    const text = els.splitInput.value;
    if(!text.trim()) return showNotification('Chưa có nội dung để chia!', 'error');

    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    let chapterHeader = '';
    let contentBody = text;
    
    if (/^(Chương|Chapter)\s+\d+/.test(firstLine)) {
        chapterHeader = firstLine;
        contentBody = lines.slice(1).join('\n');
    }

    const paragraphs = contentBody.split('\n').filter(p => p.trim());
    const totalWords = countWords(contentBody);
    const targetWords = Math.ceil(totalWords / currentSplitMode);
    
    let parts = [];
    let currentPart = [];
    let currentCount = 0;

    for (let p of paragraphs) {
        const wCount = countWords(p);
        if (currentCount + wCount > targetWords && parts.length < currentSplitMode - 1) {
            parts.push(currentPart.join('\n\n'));
            currentPart = [p];
            currentCount = wCount;
        } else {
            currentPart.push(p);
            currentCount += wCount;
        }
    }
    if (currentPart.length) parts.push(currentPart.join('\n\n'));

    for(let i = 0; i < currentSplitMode; i++) {
        const el = document.getElementById(`out-${i+1}-text`);
        const countEl = document.getElementById(`out-${i+1}-count`);
        if(el) {
            let partHeader = '';
            if (chapterHeader) {
                partHeader = chapterHeader.replace(/(\d+)/, `$1.${i+1}`) + '\n\n';
            }
            el.value = (parts[i] ? partHeader + parts[i] : '');
            if(countEl) countEl.textContent = 'Words: ' + countWords(el.value);
        }
    }

    // Clear input after split
    els.splitInput.value = '';
    updateCounters();
    saveTempInput(); // Clear temp storage
    showNotification('Đã chia thành công!', 'success');
  }

  // === CSV EXPORT & IMPORT LOGIC ===

  // Xuất file CSV 3 cột: find, replace, mode
  function exportCSV() {
    let csvContent = "find,replace,mode\n";
    
    // Duyệt qua tất cả các mode
    Object.keys(state.modes).forEach(modeName => {
        const mode = state.modes[modeName];
        if (mode.pairs && mode.pairs.length > 0) {
            mode.pairs.forEach(p => {
                // Escape dấu ngoặc kép bằng 2 dấu ngoặc kép theo chuẩn CSV
                const safeFind = p.find ? p.find.replace(/"/g, '""') : '';
                const safeReplace = p.replace ? p.replace.replace(/"/g, '""') : '';
                csvContent += `"${safeFind}","${safeReplace}","${modeName}"\n`;
            });
        }
    });

    const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings_trinh_hg.csv';
    a.click();
  }

  function importCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        
        // Kiểm tra header đơn giản
        if (!lines[0].toLowerCase().includes('find,replace,mode')) {
            return showNotification('File không đúng định dạng (cần: find,replace,mode)!', 'error');
        }

        let count = 0;
        // Bắt đầu từ dòng 1 (bỏ header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Regex parse CSV có quote "..."
            // Match 3 nhóm dữ liệu trong ngoặc kép
            const match = line.match(/^"(.*)","(.*)","(.*)"$/);

            if (match) {
                // Replace "" thành " để restore dữ liệu gốc
                const find = match[1].replace(/""/g, '"');
                const replace = match[2].replace(/""/g, '"');
                const modeName = match[3];

                if (!state.modes[modeName]) {
                    state.modes[modeName] = { pairs: [], matchCase: false, wholeWord: false };
                }

                // Kiểm tra trùng lặp đơn giản nếu cần (hiện tại cứ push vào)
                state.modes[modeName].pairs.push({ find, replace });
                count++;
            }
        }

        saveState();
        renderModeSelect();
        loadSettingsToUI();
        
        if (count > 0) {
            showNotification(`Đã nhập thành công ${count} cặp từ!`, 'success');
        } else {
            showNotification('Không tìm thấy dữ liệu hợp lệ!', 'error');
        }
    };
    reader.readAsText(file);
  }

  // === UTILS & EVENTS ===
  function countWords(str) {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  }
  
  function updateCounters() {
    document.getElementById('input-word-count').textContent = 'Words: ' + countWords(els.inputText.value);
    document.getElementById('output-word-count').textContent = 'Words: ' + countWords(els.outputText.value);
    document.getElementById('split-input-word-count').textContent = 'Words: ' + countWords(els.splitInput.value);
  }

  // Debounce để tránh lưu localstorage quá nhiều lần liên tục
  function saveTempInputDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveTempInput, 500);
  }

  function saveTempInput() {
    const inputState = {
      inputText: els.inputText.value,
      splitInput: els.splitInput.value,
      tempPairs: Array.from(els.list.children).map(item => ({
          find: item.querySelector('.find').value,
          replace: item.querySelector('.replace').value
      }))
    };
    localStorage.setItem(INPUT_STATE_KEY, JSON.stringify(inputState));
  }

  function loadTempInput() {
    const saved = JSON.parse(localStorage.getItem(INPUT_STATE_KEY));
    if(saved) {
        if(saved.inputText) els.inputText.value = saved.inputText;
        if(saved.splitInput) els.splitInput.value = saved.splitInput;
    }
    updateCounters();
  }

  function initEvents() {
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    els.matchCaseBtn.onclick = () => {
      state.modes[state.currentMode].matchCase = !state.modes[state.currentMode].matchCase;
      saveState(); updateModeButtons();
    };
    els.wholeWordBtn.onclick = () => {
      state.modes[state.currentMode].wholeWord = !state.modes[state.currentMode].wholeWord;
      saveState(); updateModeButtons();
    };

    els.modeSelect.onchange = (e) => {
      state.currentMode = e.target.value;
      saveState(); loadSettingsToUI();
      showNotification(`Chuyển sang: ${state.currentMode}`);
    };
    
    document.getElementById('add-mode').onclick = () => {
      const name = prompt('Tên chế độ mới:');
      if(name && !state.modes[name]) {
        state.modes[name] = { pairs: [], matchCase: false, wholeWord: false };
        state.currentMode = name;
        saveState(); renderModeSelect(); loadSettingsToUI();
      }
    };

    document.getElementById('copy-mode').onclick = () => {
      const name = prompt('Tên chế độ sao chép:');
      if(name && !state.modes[name]) {
        state.modes[name] = JSON.parse(JSON.stringify(state.modes[state.currentMode]));
        state.currentMode = name;
        saveState(); renderModeSelect(); loadSettingsToUI();
      }
    };
    
    els.renameBtn.onclick = () => {
      const newName = prompt('Tên mới:', state.currentMode);
      if(newName && newName !== state.currentMode && !state.modes[newName]) {
        state.modes[newName] = state.modes[state.currentMode];
        delete state.modes[state.currentMode];
        state.currentMode = newName;
        saveState(); renderModeSelect();
      }
    };

    els.deleteBtn.onclick = () => {
      if(confirm(`Xóa chế độ ${state.currentMode}?`)) {
        delete state.modes[state.currentMode];
        state.currentMode = 'default';
        saveState(); renderModeSelect(); loadSettingsToUI();
      }
    };

    document.getElementById('add-pair').onclick = () => addPairToUI('', '', false); 
    document.getElementById('save-settings').onclick = () => saveCurrentPairsToState(false); // false = show notification

    document.getElementById('replace-button').onclick = () => {
        saveCurrentPairsToState(true); // Lưu thầm lặng
        const result = performReplace(els.inputText.value);
        els.outputText.value = result.text;
        
        // Clear Input
        els.inputText.value = '';
        updateCounters();
        saveTempInput();

        showNotification(`Đã thay thế ${result.count} vị trí!`, 'info');
    };

    document.getElementById('copy-button').onclick = () => {
        if(!els.outputText.value) return;
        navigator.clipboard.writeText(els.outputText.value);
        showNotification('Đã sao chép kết quả!', 'success');
    };

    document.querySelectorAll('.split-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.split-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSplitMode = parseInt(btn.dataset.split);
            renderSplitOutputs(currentSplitMode);
        });
    });

    document.getElementById('split-action-btn').onclick = performSplit;

    document.getElementById('export-settings').onclick = exportCSV;

    document.getElementById('import-settings').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = e => {
            if(e.target.files.length > 0) importCSV(e.target.files[0]);
        };
        input.click();
    };

    [els.inputText, els.splitInput].forEach(el => {
        el.addEventListener('input', () => {
            updateCounters();
            saveTempInputDebounced();
        });
    });
  }

  // === INIT ===
  renderModeSelect();
  loadSettingsToUI();
  loadTempInput();
  renderSplitOutputs(2); 
  initEvents();
});
