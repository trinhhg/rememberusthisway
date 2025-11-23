document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG & STATE ===
  const STORAGE_KEY = 'trinh_hg_settings_v2';
  const INPUT_STATE_KEY = 'trinh_hg_input_state_v2';

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
    }, 2500);
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special chars for Regex
  }

  // --- LOGIC TÌM VÀ THAY THẾ CHÍNH ---
  function performReplace(text) {
    if (!text) return '';
    const mode = state.modes[state.currentMode];
    const rules = mode.pairs.filter(p => p.find && p.find.length > 0);

    let result = text;

    for (const rule of rules) {
      try {
        let pattern = escapeRegExp(rule.find);
        
        // Logic Whole Word (Từ hoàn chỉnh)
        if (mode.wholeWord) {
          // Chỉ thêm \b nếu ký tự bắt đầu/kết thúc là ký tự từ (\w)
          const startBound = /^\w/.test(rule.find) ? "\\b" : "";
          const endBound = /\w$/.test(rule.find) ? "\\b" : "";
          pattern = `${startBound}${pattern}${endBound}`;
        }

        const flags = 'g' + (mode.matchCase ? '' : 'i'); // 'u' flag can be tricky, stick to 'g' or 'gi'
        const regex = new RegExp(pattern, flags);

        const replaceVal = rule.replace; // Giữ nguyên, không trim() để cho phép thay bằng Space

        result = result.replace(regex, (match) => {
          // Logic giữ Case (nếu không bật Match Case)
          if (!mode.matchCase) {
             // Basic capitalization preservation check
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
    return result.split(/\n/).map(l => l.trim()).filter(l => l).join('\n\n');
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
    
    // Update Toggle Buttons Text/Style
    els.matchCaseBtn.textContent = `Match Case: ${mode.matchCase ? 'BẬT' : 'Tắt'}`;
    els.matchCaseBtn.classList.toggle('active', mode.matchCase);
    
    els.wholeWordBtn.textContent = `Whole Word: ${mode.wholeWord ? 'BẬT' : 'Tắt'}`;
    els.wholeWordBtn.classList.toggle('active', mode.wholeWord);
  }

  // QUAN TRỌNG: Sửa lỗi thứ tự danh sách
  // append = true: Thêm xuống cuối (dùng khi load từ data)
  // append = false: Thêm lên đầu (dùng khi bấm nút Thêm Mới để tiện nhập)
  function addPairToUI(find = '', replace = '', append = false) {
    const item = document.createElement('div');
    item.className = 'punctuation-item';
    
    item.innerHTML = `
      <input type="text" class="find" placeholder="Tìm (VD: ,)" value="${find.replace(/"/g, '&quot;')}">
      <input type="text" class="replace" placeholder="Thay thế (để trống = xóa)" value="${replace.replace(/"/g, '&quot;')}">
      <button class="remove" tabindex="-1">×</button>
    `;

    // Remove event
    item.querySelector('.remove').onclick = () => {
      item.remove();
      checkEmptyState();
      saveTempInput(); // Save state immediately on remove
    };

    // Auto save input state on type
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
    // Load pairs theo đúng thứ tự mảng (dùng append=true)
    if (mode.pairs && mode.pairs.length > 0) {
      mode.pairs.forEach(p => addPairToUI(p.find, p.replace, true));
    } else {
      // Nếu chưa có gì, không tự thêm dòng trống nữa để UI sạch, hoặc thêm 1 dòng nếu muốn
      // addPairToUI(); 
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
      find: item.querySelector('.find').value, // Trim find is usually ok, but let's keep raw
      replace: item.querySelector('.replace').value // NEVER TRIM REPLACE (Space issue)
    })).filter(p => p.find !== ''); // Chỉ lưu cặp có từ khóa tìm kiếm

    state.modes[state.currentMode].pairs = newPairs;
    saveState();
    showNotification('Đã lưu cài đặt!', 'success');
  }

  // === SPLIT CHAPTER LOGIC ===
  function renderSplitOutputs(count) {
    els.splitWrapper.innerHTML = '';
    for(let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'split-item';
        div.innerHTML = `
            <div class="split-header">
                <span>Phần ${i}</span>
                <span id="out-${i}-count">0w</span>
            </div>
            <textarea id="out-${i}-text" class="custom-scrollbar" readonly></textarea>
            <button class="btn btn-secondary copy-btn" data-target="out-${i}-text">Sao chép phần ${i}</button>
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

    // Detect Chapter Header
    const lines = text.split('\n');
    const firstLine = lines[0].trim();
    let chapterHeader = '';
    let contentBody = text;
    
    // Simple detection: Starts with "Chương" or "Chapter"
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
        // Nếu phần hiện tại đã đủ và không phải là phần cuối cùng
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

    // Fill to UI
    for(let i = 0; i < currentSplitMode; i++) {
        const el = document.getElementById(`out-${i+1}-text`);
        const countEl = document.getElementById(`out-${i+1}-count`);
        if(el) {
            // Add header to sub-parts like: Chương 1.1, Chương 1.2
            let partHeader = '';
            if (chapterHeader) {
                // Try to inject .1, .2 after number
                partHeader = chapterHeader.replace(/(\d+)/, `$1.${i+1}`) + '\n\n';
            }
            
            el.value = (parts[i] ? partHeader + parts[i] : '');
            if(countEl) countEl.textContent = countWords(el.value) + 'w';
        }
    }
    showNotification('Đã chia thành công!', 'success');
  }

  // === UTILS ===
  function countWords(str) {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  }
  
  function updateCounters() {
    document.getElementById('input-word-count').textContent = countWords(els.inputText.value) + ' words';
    document.getElementById('output-word-count').textContent = countWords(els.outputText.value) + ' words';
    document.getElementById('split-input-word-count').textContent = countWords(els.splitInput.value) + 'w';
  }

  // === PERSISTENCE FOR INPUTS (Không mất khi F5) ===
  function saveTempInput() {
    const inputState = {
      inputText: els.inputText.value,
      splitInput: els.splitInput.value,
      // Save current unsaved pairs UI
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
        // Restore temp pairs if they exist, otherwise load from settings
        // Ưu tiên load từ settings đã lưu để tránh conflict logic, 
        // nhưng nếu user đang nhập dở thì nên load temp. 
        // Logic đơn giản ở đây: Load Setting chính thức -> User tự nhập lại nếu chưa Save.
        // Để an toàn và đơn giản, ta load Setting chính thức.
    }
    updateCounters();
  }

  // === EVENT LISTENERS SETUP ===
  function initEvents() {
    // Tabs
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // Toolbar Buttons
    els.matchCaseBtn.onclick = () => {
      state.modes[state.currentMode].matchCase = !state.modes[state.currentMode].matchCase;
      saveState(); updateModeButtons();
    };
    els.wholeWordBtn.onclick = () => {
      state.modes[state.currentMode].wholeWord = !state.modes[state.currentMode].wholeWord;
      saveState(); updateModeButtons();
    };

    // Mode CRUD
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

    // Pair Actions
    document.getElementById('add-pair').onclick = () => addPairToUI('', '', false); // false = prepend to top
    document.getElementById('save-settings').onclick = saveCurrentPairsToState;

    // Replace Action
    document.getElementById('replace-button').onclick = () => {
        saveCurrentPairsToState(); // Auto save before running
        const out = performReplace(els.inputText.value);
        els.outputText.value = out;
        updateCounters();
        showNotification('Đã thay thế xong!');
    };

    document.getElementById('copy-button').onclick = () => {
        if(!els.outputText.value) return;
        navigator.clipboard.writeText(els.outputText.value);
        showNotification('Đã sao chép kết quả!');
    };

    // Split Actions
    document.querySelectorAll('.split-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.split-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentSplitMode = parseInt(btn.dataset.split);
            renderSplitOutputs(currentSplitMode);
        });
    });

    document.getElementById('split-action-btn').onclick = performSplit;

    // Import/Export
    document.getElementById('export-settings').onclick = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], {type : 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'settings_trinh_hg.json';
        a.click();
    };

    document.getElementById('import-settings').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    if(data.modes) {
                        state = data;
                        saveState(); renderModeSelect(); loadSettingsToUI();
                        showNotification('Nhập dữ liệu thành công!');
                    }
                } catch(err) { alert('File lỗi!'); }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Input monitoring
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
  renderSplitOutputs(2); // Default 2 splits
  initEvents();
});
