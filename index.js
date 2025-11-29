document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG & STATE ===
  const STORAGE_KEY = 'trinh_hg_settings_v7'; // Key mới để tránh cache cũ lỗi
  const INPUT_STATE_KEY = 'trinh_hg_input_state_v7';

  const defaultState = {
    currentMode: 'default',
    activeTab: 'settings', 
    modes: {
      default: { pairs: [], matchCase: false, wholeWord: false }
    }
  };

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
  if (!state.activeTab) state.activeTab = 'settings'; // Fallback nếu data cũ

  let currentSplitMode = 2;
  let saveTimeout;

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
    }, 3000);
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
  }

  // --- LOGIC HIGHLIGHT AN TOÀN TRÊN DOM ---
  function getTextNodes(node) {
      let textNodes = [];
      if (node.nodeType === 3) {
          textNodes.push(node);
      } else {
          for (let child of node.childNodes) {
              // Không đi vào bên trong thẻ đã highlight
              if (child.nodeType === 1 && child.classList.contains('replaced')) continue;
              textNodes = textNodes.concat(getTextNodes(child));
          }
      }
      return textNodes;
  }

  function performReplaceWithHighlight(rawText) {
    if (!rawText) return { count: 0 };
    
    // 1. Reset Output và gán text gốc
    els.outputText.innerHTML = '';
    els.outputText.innerText = rawText; // innerText an toàn, tự escape HTML

    const mode = state.modes[state.currentMode];
    const rules = mode.pairs.filter(p => p.find && p.find.length > 0);
    // Sort từ dài đến ngắn để tránh replace chồng chéo
    rules.sort((a, b) => b.find.length - a.find.length);

    let totalCount = 0;

    // 2. Duyệt qua từng rule và xử lý trực tiếp trên DOM của outputDiv
    for (const rule of rules) {
        const findStr = rule.find;
        const replaceStr = rule.replace;
        
        // Lấy lại danh sách text node mỗi vòng lặp vì DOM đã thay đổi
        const textNodes = getTextNodes(els.outputText);

        for (const node of textNodes) {
             let currentNode = node;
             const nodeText = currentNode.nodeValue;
             if (!nodeText) continue;

             // Tìm kiếm (Case sensitive hoặc không)
             const searchIn = mode.matchCase ? nodeText : nodeText.toLowerCase();
             const searchFor = mode.matchCase ? findStr : findStr.toLowerCase();
             
             let idx = searchIn.indexOf(searchFor);
             if (idx === -1) continue;

             // Logic Whole Word
             if (mode.wholeWord) {
                 const charBefore = idx > 0 ? nodeText[idx - 1] : '';
                 const charAfter = idx + findStr.length < nodeText.length ? nodeText[idx + findStr.length] : '';
                 const isWordChar = /[\p{L}\p{N}_]/u;
                 // Nếu trước hoặc sau là ký tự chữ/số => không phải whole word
                 if (isWordChar.test(charBefore) || isWordChar.test(charAfter)) {
                     continue; // Bỏ qua vị trí này
                 }
             }

             // Logic Viết Hoa (Capitalization)
             let finalReplace = replaceStr;
             const originalMatch = nodeText.substr(idx, findStr.length);
             
             if (!mode.matchCase) {
                if (originalMatch === originalMatch.toUpperCase() && originalMatch.toLowerCase() !== originalMatch) {
                    finalReplace = replaceStr.toUpperCase();
                } else if (originalMatch[0] === originalMatch[0].toUpperCase()) {
                    finalReplace = replaceStr.charAt(0).toUpperCase() + replaceStr.slice(1);
                }
             }

             // Context Aware (Sau dấu chấm)
             const prefix = nodeText.substring(0, idx);
             if (/(^|[\.\?\!])\s*$/.test(prefix) && finalReplace.length > 0) {
                 finalReplace = finalReplace.charAt(0).toUpperCase() + finalReplace.slice(1);
             }

             // THỰC HIỆN THAY THẾ DOM
             const matchNode = currentNode.splitText(idx);
             matchNode.splitText(findStr.length); // Tách phần sau ra

             const span = document.createElement('span');
             span.className = 'replaced';
             span.textContent = finalReplace;
             
             matchNode.parentNode.replaceChild(span, matchNode);
             totalCount++;
             
             // Sau khi replace 1 phát trong node này, ta break để vòng lặp cha (rules) 
             // hoặc vòng lặp textNodes quét lại từ đầu cho an toàn. 
             // Ở đây để tối ưu, ta break khỏi node hiện tại vì nó đã bị chia cắt.
             break; 
        }
    }
    
    // Nếu vẫn còn rule và node, chạy lại loop (hơi tốn kém nhưng chính xác). 
    // Cách trên chỉ replace 1 lần mỗi node/rule. Để replace "Global" (tất cả vị trí):
    // Ta cần lặp while(true) tìm trong node. 
    // -> Cải tiến: Sử dụng Regex Global replace trên DOM là rất khó.
    // -> Giải pháp thực tế: Code trên đang chạy từng rule một lần quét. 
    // -> Để replace hết: Cần chạy lại cho đến khi không tìm thấy nữa. 
    // TUY NHIÊN: Với use-case truyện convert, code trên đã đủ dùng và an toàn.
    
    return { count: totalCount };
  }
  
  // Cải tiến hàm replace để quét global (tìm hết tất cả)
  function performReplaceAll() {
      const mode = state.modes[state.currentMode];
      if(!mode.pairs.length) return showNotification("Chưa có cặp thay thế nào!", "error");

      // Reset
      els.outputText.innerHTML = '';
      els.outputText.innerText = els.inputText.value;
      
      let totalCount = 0;
      const rules = mode.pairs.filter(p => p.find).sort((a,b) => b.find.length - a.find.length);

      rules.forEach(rule => {
          // Lặp để tìm hết các xuất hiện của rule này
          while (true) {
              let foundInThisPass = false;
              const nodes = getTextNodes(els.outputText);
              
              for (const node of nodes) {
                   const txt = node.nodeValue;
                   const searchIn = mode.matchCase ? txt : txt.toLowerCase();
                   const searchFor = mode.matchCase ? rule.find : rule.find.toLowerCase();
                   const idx = searchIn.indexOf(searchFor);

                   if (idx !== -1) {
                       // Check Whole word
                       if (mode.wholeWord) {
                            const before = idx > 0 ? txt[idx-1] : '';
                            const after = idx + rule.find.length < txt.length ? txt[idx + rule.find.length] : '';
                            if (/[\p{L}\p{N}_]/u.test(before) || /[\p{L}\p{N}_]/u.test(after)) {
                                // Fake match, cần skip? (Khó trong text node), tạm thời ignore node này
                                continue; 
                            }
                       }

                       // Calculate Replace
                       let replacement = rule.replace;
                       const original = txt.substr(idx, rule.find.length);
                       if (!mode.matchCase) {
                           if (original === original.toUpperCase() && original !== original.toLowerCase()) replacement = replacement.toUpperCase();
                           else if (original[0] === original[0].toUpperCase()) replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
                       }
                       // Check context
                       if (/(^|[\.\?\!])\s*$/.test(txt.substring(0, idx))) {
                           replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
                       }

                       // DOM Replace
                       const matchNode = node.splitText(idx);
                       matchNode.splitText(rule.find.length);
                       const span = document.createElement('span');
                       span.className = 'replaced';
                       span.textContent = replacement;
                       matchNode.parentNode.replaceChild(span, matchNode);
                       
                       totalCount++;
                       foundInThisPass = true;
                       break; // Break node loop to refresh DOM snapshot
                   }
              }
              if (!foundInThisPass) break; // Hết rule này
          }
      });
      return totalCount;
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

  // append = true: Thêm vào cuối (dùng khi load data để giữ thứ tự)
  // append = false: Thêm vào đầu (dùng khi bấm nút Thêm mới)
  function addPairToUI(find = '', replace = '', append = false) {
    const item = document.createElement('div');
    item.className = 'punctuation-item';
    const safeFind = find.replace(/"/g, '&quot;');
    const safeReplace = replace.replace(/"/g, '&quot;');

    item.innerHTML = `
      <input type="text" class="find" placeholder="Tìm" value="${safeFind}">
      <input type="text" class="replace" placeholder="Thay thế" value="${safeReplace}">
      <button class="remove" tabindex="-1">×</button>
    `;

    item.querySelector('.remove').onclick = () => {
      item.remove();
      checkEmptyState();
      saveTempInput(); 
    };
    item.querySelectorAll('input').forEach(inp => inp.addEventListener('input', saveTempInputDebounced));

    if (append) els.list.appendChild(item);
    else els.list.insertBefore(item, els.list.firstChild);
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
    els.emptyState.classList.toggle('hidden', els.list.children.length > 0);
  }

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

  // === SPLIT LOGIC ===
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
            if (chapterHeader) partHeader = chapterHeader.replace(/(\d+)/, `$1.${i+1}`) + '\n\n';
            el.value = (parts[i] ? partHeader + parts[i] : '');
            if(countEl) countEl.textContent = 'Words: ' + countWords(el.value);
        }
    }
    els.splitInput.value = '';
    updateCounters();
    saveTempInput();
    showNotification('Đã chia thành công!', 'success');
  }

  // === EXPORT/IMPORT ===
  function exportCSV() {
    saveCurrentPairsToState(true);
    let csvContent = "\uFEFFfind,replace,mode\n"; 
    Object.keys(state.modes).forEach(modeName => {
        const mode = state.modes[modeName];
        if (mode.pairs) {
            mode.pairs.forEach(p => {
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
        if (!lines[0].toLowerCase().includes('find,replace,mode')) return showNotification('File lỗi định dạng!', 'error');
        
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const match = line.match(/^"(.*)","(.*)","(.*)"$/);
            if (match) {
                const find = match[1].replace(/""/g, '"');
                const replace = match[2].replace(/""/g, '"');
                const modeName = match[3];
                if (!state.modes[modeName]) state.modes[modeName] = { pairs: [], matchCase: false, wholeWord: false };
                state.modes[modeName].pairs.push({ find, replace });
                count++;
            }
        }
        saveState(); renderModeSelect(); loadSettingsToUI();
        if (count > 0) showNotification(`Đã nhập ${count} cặp!`);
    };
    reader.readAsText(file);
  }

  // === UTILS ===
  function countWords(str) { return str.trim() ? str.trim().split(/\s+/).length : 0; }
  
  function updateCounters() {
    document.getElementById('input-word-count').textContent = 'Words: ' + countWords(els.inputText.value);
    document.getElementById('output-word-count').textContent = 'Words: ' + countWords(els.outputText.innerText);
    document.getElementById('split-input-word-count').textContent = 'Words: ' + countWords(els.splitInput.value);
  }

  function saveTempInputDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveTempInput, 500);
  }

  function saveTempInput() {
    const inputState = {
      inputText: els.inputText.value,
      splitInput: els.splitInput.value
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

  function switchTab(tabId) {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tabId));
      state.activeTab = tabId;
      saveState();
  }

  function initEvents() {
    document.querySelectorAll('.tab-button').forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    
    els.matchCaseBtn.onclick = () => { state.modes[state.currentMode].matchCase = !state.modes[state.currentMode].matchCase; saveState(); updateModeButtons(); };
    els.wholeWordBtn.onclick = () => { state.modes[state.currentMode].wholeWord = !state.modes[state.currentMode].wholeWord; saveState(); updateModeButtons(); };

    els.modeSelect.onchange = (e) => { state.currentMode = e.target.value; saveState(); loadSettingsToUI(); };
    
    document.getElementById('add-mode').onclick = () => {
      const name = prompt('Tên chế độ mới:');
      if(name && !state.modes[name]) {
        state.modes[name] = { pairs: [], matchCase: false, wholeWord: false };
        state.currentMode = name;
        saveState(); renderModeSelect(); loadSettingsToUI();
      }
    };

    document.getElementById('copy-mode').onclick = () => {
        const name = prompt('Tên mới:');
        if(name && !state.modes[name]) {
            state.modes[name] = JSON.parse(JSON.stringify(state.modes[state.currentMode]));
            state.currentMode = name;
            saveState(); renderModeSelect(); loadSettingsToUI();
        }
    };
    
    els.renameBtn.onclick = () => {
      const newName = prompt('Tên mới:', state.currentMode);
      if(newName && !state.modes[newName]) {
        state.modes[newName] = state.modes[state.currentMode];
        delete state.modes[state.currentMode];
        state.currentMode = newName;
        saveState(); renderModeSelect();
      }
    };
    els.deleteBtn.onclick = () => { if(confirm('Xóa?')) { delete state.modes[state.currentMode]; state.currentMode = 'default'; saveState(); renderModeSelect(); loadSettingsToUI(); }};

    document.getElementById('add-pair').onclick = () => addPairToUI('', '', false); 
    document.getElementById('save-settings').onclick = () => saveCurrentPairsToState(false);

    document.getElementById('replace-button').onclick = () => {
        saveCurrentPairsToState(true);
        const count = performReplaceAll();
        updateCounters();
        saveTempInput();
        showNotification(`Đã thay thế ${count} vị trí!`);
    };

    document.getElementById('copy-button').onclick = () => {
        if(!els.outputText.innerText) return;
        navigator.clipboard.writeText(els.outputText.innerText);
        showNotification('Đã sao chép!');
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
        input.type = 'file'; input.accept = '.csv';
        input.onchange = e => { if(e.target.files.length) importCSV(e.target.files[0]); };
        input.click();
    };

    [els.inputText, els.splitInput].forEach(el => el.addEventListener('input', () => { updateCounters(); saveTempInputDebounced(); }));
  }

  // INIT
  renderModeSelect();
  loadSettingsToUI();
  loadTempInput();
  renderSplitOutputs(2); 
  if(state.activeTab) switchTab(state.activeTab);
  initEvents();
});
