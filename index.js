document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG & STATE ===
  const STORAGE_KEY = 'trinh_hg_settings_v3';
  const INPUT_STATE_KEY = 'trinh_hg_input_state_v3';

  const defaultState = {
    currentMode: 'default',
    modes: {
      default: { pairs: [], matchCase: false, wholeWord: false }
    }
  };

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
  let currentSplitMode = 2;

  // DOM ELEMENTS
  const els = {
    modeSelect: document.getElementById('mode-select'),
    list: document.getElementById('punctuation-list'),
    inputText: document.getElementById('input-text'),
    outputText: document.getElementById('output-text'),
    splitInput: document.getElementById('split-input-text'),
    splitWrapper: document.getElementById('split-outputs-wrapper'),
    splitWorkspace: document.querySelector('.split-workspace'),
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

  // --- LOGIC TÌM VÀ THAY THẾ CHÍNH (Có đếm) ---
  function performReplace(text) {
    if (!text) return { text: '', count: 0 };
    const mode = state.modes[state.currentMode];
    const rules = mode.pairs.filter(p => p.find && p.find.length > 0);

    let result = text;
    let totalCount = 0;

    for (const rule of rules) {
      try {
        let pattern = escapeRegExp(rule.find);
        
        if (mode.wholeWord) {
          const startBound = /^\w/.test(rule.find) ? "\\b" : "";
          const endBound = /\w$/.test(rule.find) ? "\\b" : "";
          pattern = `${startBound}${pattern}${endBound}`;
        }

        const flags = 'g' + (mode.matchCase ? '' : 'i');
        const regex = new RegExp(pattern, flags);
        const replaceVal = rule.replace; 

        result = result.replace(regex, (match) => {
          totalCount++; // Tăng biến đếm mỗi khi thay thế
          if (!mode.matchCase) {
             if (match === match.toUpperCase()) return replaceVal.toUpperCase();
             if (match === match.toLowerCase()) return replaceVal.toLowerCase();
             if (match[0] === match[0].toUpperCase() && replaceVal.length > 0) {
                return replaceVal.charAt(0).toUpperCase() + replaceVal.slice(1);
             }
          }
          return replaceVal;
        });

      } catch (e) {
        console.warn('Regex Error:', rule.find, e);
      }
    }

    // Format paragraphs: Cách nhau 1 dòng
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
    
    // Xử lý quote để hiển thị đúng trong input value
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
    inputs.forEach(inp => inp.addEventListener('input', saveTempInput));

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

  function saveCurrentPairsToState() {
    const items = Array.from(els.list.children);
    const newPairs = items.map(item => ({
      find: item.querySelector('.find').value,
      replace: item.querySelector('.replace').value 
    })).filter(p => p.find !== '');

    state.modes[state.currentMode].pairs = newPairs;
    saveState();
    showNotification('Đã lưu cài đặt!', 'success');
  }

  // === SPLIT CHAPTER LOGIC ===
  function renderSplitOutputs(count) {
    els.splitWrapper.innerHTML = '';
    
    // Cập nhật Class cho Workspace để CSS xử lý layout
    if (count === 2) {
      els.splitWorkspace.className = 'split-workspace custom-scrollbar mode-2';
    } else {
      els.splitWorkspace.className = 'split-workspace custom-scrollbar mode-multi';
    }

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
    showNotification('Đã chia thành công!', 'success');
  }

  // === CSV IMPORT LOGIC (FIXED) ===
  function importCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        
        // Kiểm tra header cơ bản
        if (!lines[0].includes('find,replace,mode')) {
            return showNotification('File không đúng định dạng (thiếu header find,replace,mode)!', 'error');
        }

        let count = 0;
        let errors = 0;

        // Bỏ qua dòng đầu (header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Regex để bắt 3 nhóm trong dấu ngoặc kép: "group1","group2","group3"
            // File của bạn: "find","replace","mode"
            const match = line.match(/^"(.*)","(.*)","(.*)"$/);

            if (match) {
                const find = match[1];
                const replace = match[2];
                const modeName = match[3];

                if (!state.modes[modeName]) {
                    state.modes[modeName] = { pairs: [], matchCase: false, wholeWord: false };
                }

                state.modes[modeName].pairs.push({ find, replace });
                count++;
            } else {
                // Thử parse kiểu không có quote (fallback)
                const parts = line.split(',');
                if(parts.length >= 3) {
                     // Logic đơn giản cho fallback
                } else {
                    errors++;
                }
            }
        }

        saveState();
        renderModeSelect();
        loadSettingsToUI();
        
        if (count > 0) {
            showNotification(`Đã nhập thành công ${count} cặp từ!`, 'success');
        } else {
            showNotification('Không đọc được dữ liệu nào hợp lệ!', 'error');
        }
    };
    reader.onerror = () => showNotification('Lỗi khi đọc file!', 'error');
    reader.readAsText(file);
  }

  // === UTILS ===
  function countWords(str) {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  }
  
  function updateCounters() {
    document.getElementById('input-word-count').textContent = 'Words: ' + countWords(els.inputText.value);
    document.getElementById('output-word-count').textContent = 'Words: ' + countWords(els.outputText.value);
    document.getElementById('split-input-word-count').textContent = 'Words: ' + countWords(els.splitInput.value);
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

  // === EVENT LISTENERS SETUP ===
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
      } else if (state.modes[name]) alert('Tên đã tồn tại!');
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
    document.getElementById('save-settings').onclick = saveCurrentPairsToState;

    // REPLACE BUTTON - Có đếm số lượng
    document.getElementById('replace-button').onclick = () => {
        saveCurrentPairsToState(); 
        const result = performReplace(els.inputText.value);
        els.outputText.value = result.text;
        updateCounters();
        showNotification(`Đã thay thế ${result.count} vị trí!`, 'success');
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

    document.getElementById('export-settings').onclick = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'settings_trinh_hg.json';
        a.click();
    };

    // Nút Import được viết lại để gọi hàm importCSV
    document.getElementById('import-settings').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv';
        input.onchange = e => {
            if(e.target.files.length > 0) {
                importCSV(e.target.files[0]);
            }
        };
        input.click();
    };

    [els.inputText, els.splitInput].forEach(el => {
        el.addEventListener('input', () => {
            updateCounters();
            saveTempInput();
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
