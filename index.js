document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG & STATE ===
  const STORAGE_KEY = 'trinh_hg_settings_v6'; // Đổi key mới để reset sạch lỗi cũ
  const INPUT_STATE_KEY = 'trinh_hg_input_state_v6';

  const defaultState = {
    currentMode: 'default',
    activeTab: 'settings', // Thêm state lưu tab hiện tại
    modes: {
      default: { pairs: [], matchCase: false, wholeWord: false }
    }
  };

  let state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultState;
  
  // Đảm bảo cấu trúc data cũ tương thích
  if (!state.activeTab) state.activeTab = 'settings';

  let currentSplitMode = 2;
  let saveTimeout;

  // DOM ELEMENTS
  const els = {
    modeSelect: document.getElementById('mode-select'),
    list: document.getElementById('punctuation-list'),
    inputText: document.getElementById('input-text'),
    outputText: document.getElementById('output-text'), // Đây là DIV
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

  // Helper để lấy text nodes (Logic mượn từ file tham khảo)
  function getTextNodesSnapshot(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
        // Bỏ qua các node bên trong thẻ đã được replace rồi (để tránh replace chồng chéo lên thẻ HTML)
        if (node.parentElement && node.parentElement.classList.contains('replaced')) continue;
        nodes.push(node);
    }
    return nodes;
  }

  // --- LOGIC TÌM VÀ THAY THẾ CHÍNH (UPDATE: DOM BASED) ---
  // Logic này tạo ra DOM ảo, thay thế trực tiếp Node để highlight chính xác 100%
  function performReplaceWithHighlight(rawText) {
    if (!rawText) return { html: '', count: 0 };

    const mode = state.modes[state.currentMode];
    // Filter cặp rỗng
    const rules = mode.pairs.filter(p => p.find && p.find.length > 0);
    // Sort: Ưu tiên từ dài replace trước để tránh lỗi chồng từ
    rules.sort((a, b) => b.find.length - a.find.length);

    // Tạo một DIV ảo để chứa text và xử lý DOM
    const tempDiv = document.createElement('div');
    tempDiv.innerText = rawText; // innerText tự động escape HTML an toàn

    let totalCount = 0;

    for (const rule of rules) {
        const findStr = rule.find;
        const replaceStr = rule.replace;
        const isMatchCase = mode.matchCase;
        const isWholeWord = mode.wholeWord;

        // Lấy tất cả text node hiện tại trong tempDiv
        const nodes = getTextNodesSnapshot(tempDiv);

        for (const textNode of nodes) {
             if (!textNode.nodeValue) continue;
             let node = textNode;

             // Vòng lặp để tìm hết các từ trong node này
             while (node && node.nodeValue) {
                 const currentText = node.nodeValue;
                 // Tìm vị trí match
                 let idx = -1;
                 
                 // Xây dựng regex tìm kiếm trên string của node
                 try {
                     let pattern = escapeRegExp(findStr);
                     let flags = isMatchCase ? '' : 'i';
                     
                     // Kiểm tra Whole Word thủ công hoặc dùng Regex Boundary
                     // Tuy nhiên Regex Boundary \b không hoạt động tốt với unicode tiếng Việt
                     // Nên ta dùng logic kiểm tra ký tự liền kề
                     
                     // Tìm match đầu tiên bằng Regex exec để lấy đúng index
                     const regex = new RegExp(pattern, flags + 'g'); // Global để test nhưng ta chỉ lấy match đầu
                     const match = regex.exec(currentText);
                     
                     if (match) {
                         idx = match.index;
                         // Logic Whole Word check
                         if (isWholeWord) {
                             const charBefore = idx > 0 ? currentText[idx - 1] : '';
                             const charAfter = idx + findStr.length < currentText.length ? currentText[idx + findStr.length] : '';
                             // Chấp nhận biên từ là: whitespace, punctuation, start/end string
                             const isWordChar = /[\p{L}\p{N}_]/u;
                             if (isWordChar.test(charBefore) || isWordChar.test(charAfter)) {
                                 // Skip match này bằng cách cắt bỏ phần trước đó và tìm lại? 
                                 // Đơn giản là bỏ qua trong lần while này (phức tạp), 
                                 // hoặc đơn giản hơn: Ta dùng regex lookbehind/ahead nếu browser support.
                                 // Ở đây ta dùng logic đơn giản: Nếu fail whole word, ta coi như không tìm thấy ở vị trí này
                                 // Nhưng indexof không hỗ trợ regex.
                                 // => Giải pháp: Regex chuẩn
                             }
                         }
                     }
                 } catch (e) { console.error(e); }

                 // Cách đơn giản và hiệu quả nhất: Dùng indexOf (case insensitive if needed)
                 const searchIn = isMatchCase ? currentText : currentText.toLowerCase();
                 const searchFor = isMatchCase ? findStr : findStr.toLowerCase();
                 idx = searchIn.indexOf(searchFor);

                 if (idx === -1) break; // Không tìm thấy trong node này nữa

                 // Check Whole Word thủ công
                 if (isWholeWord) {
                    const charBefore = idx > 0 ? currentText[idx - 1] : '';
                    const charAfter = idx + findStr.length < currentText.length ? currentText[idx + findStr.length] : '';
                    const isWordChar = /[\p{L}\p{N}_]/u;
                    if (isWordChar.test(charBefore) || isWordChar.test(charAfter)) {
                        // Đây là match giả (ví dụ tìm "an" trong "bạn"), cần nhảy qua nó
                        // Cắt node để bỏ qua phần này
                        const nextSearchNode = node.splitText(idx + findStr.length);
                        node = nextSearchNode; 
                        continue;
                    }
                 }

                 // === LOGIC XỬ LÝ VIẾT HOA THÔNG MINH ===
                 let finalReplace = replaceStr;
                 const originalMatch = currentText.substr(idx, findStr.length);
                 
                 if (!isMatchCase) {
                    // Nếu gốc là VIẾT HOA HẾT
                    if (originalMatch === originalMatch.toUpperCase() && originalMatch !== originalMatch.toLowerCase()) {
                        finalReplace = replaceStr.toUpperCase();
                    }
                    // Nếu gốc là Viết Hoa Chữ Đầu
                    else if (originalMatch[0] === originalMatch[0].toUpperCase()) {
                        finalReplace = replaceStr.charAt(0).toUpperCase() + replaceStr.slice(1);
                    }
                 }

                 // Context Aware (Sau dấu chấm câu)
                 // Kiểm tra prefix trong cùng node
                 const prefix = currentText.substring(0, idx);
                 // Hoặc nếu prefix rỗng, phải check node trước đó (phức tạp, ở đây làm mức cơ bản trong cùng node)
                 if (/(^|[\.\?\!])\s*$/.test(prefix)) {
                      if(finalReplace.length > 0) 
                        finalReplace = finalReplace.charAt(0).toUpperCase() + finalReplace.slice(1);
                 }

                 // === THỰC HIỆN REPLACE TRÊN DOM ===
                 // 1. Tách node tại vị trí tìm thấy
                 const matchNode = node.splitText(idx);
                 // 2. Tách phần sau từ tìm thấy để giữ lại xử lý tiếp
                 const afterNode = matchNode.splitText(findStr.length);

                 // 3. Tạo thẻ span highlight
                 const span = document.createElement('span');
                 span.className = 'replaced';
                 span.textContent = finalReplace;

                 // 4. Thay thế node văn bản gốc bằng span
                 matchNode.parentNode.replaceChild(span, matchNode);
                 
                 totalCount++;
                 
                 // Tiếp tục vòng lặp với phần văn bản còn lại
                 node = afterNode;
             }
        }
    }

    return { html: tempDiv.innerHTML, count: totalCount };
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

  // Sửa logic thêm cặp: append = false (Thêm lên đầu - Mặc định cho nút Thêm), true (Thêm xuống cuối - cho Load data)
  function addPairToUI(find = '', replace = '', append = false) {
    const item = document.createElement('div');
    item.className = 'punctuation-item';
    
    // Xử lý escape quote cho value input
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

    if (append) {
        els.list.appendChild(item); // Load cũ thêm xuống dưới
    } else {
        els.list.insertBefore(item, els.list.firstChild); // Thêm mới chèn lên đầu
    }
    checkEmptyState();
  }

  function loadSettingsToUI() {
    els.list.innerHTML = '';
    const mode = state.modes[state.currentMode];
    if (mode.pairs && mode.pairs.length > 0) {
      // Khi load từ storage, ta append từng cái xuống dưới để giữ đúng thứ tự đã lưu
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
    // Lưu theo thứ tự DOM hiện tại (Trên xuống dưới)
    const newPairs = items.map(item => ({
      find: item.querySelector('.find').value,
      replace: item.querySelector('.replace').value 
    })).filter(p => p.find !== '');

    state.modes[state.currentMode].pairs = newPairs;
    saveState();
    if (!silent) showNotification('Đã lưu cài đặt!', 'success');
  }

  // === SPLIT LOGIC (Giữ nguyên vì đã ổn) ===
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
            if (chapterHeader) {
                partHeader = chapterHeader.replace(/(\d+)/, `$1.${i+1}`) + '\n\n';
            }
            el.value = (parts[i] ? partHeader + parts[i] : '');
            if(countEl) countEl.textContent = 'Words: ' + countWords(el.value);
        }
    }
    els.splitInput.value = '';
    updateCounters();
    saveTempInput();
    showNotification('Đã chia thành công!', 'success');
  }

  // === CSV EXPORT & IMPORT ===
  function exportCSV() {
    saveCurrentPairsToState(true);
    let csvContent = "\uFEFFfind,replace,mode\n"; 
    Object.keys(state.modes).forEach(modeName => {
        const mode = state.modes[modeName];
        if (mode.pairs && mode.pairs.length > 0) {
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
        let text = e.target.result;
        const lines = text.split(/\r?\n/);
        if (!lines[0].toLowerCase().includes('find,replace,mode')) {
            return showNotification('File không đúng định dạng!', 'error');
        }
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const match = line.match(/^"(.*)","(.*)","(.*)"$/);
            if (match) {
                const find = match[1].replace(/""/g, '"');
                const replace = match[2].replace(/""/g, '"');
                const modeName = match[3];
                if (!state.modes[modeName]) {
                    state.modes[modeName] = { pairs: [], matchCase: false, wholeWord: false };
                }
                state.modes[modeName].pairs.push({ find, replace });
                count++;
            }
        }
        saveState();
        renderModeSelect();
        loadSettingsToUI();
        if (count > 0) showNotification(`Đã nhập thành công ${count} cặp từ!`, 'success');
        else showNotification('Không tìm thấy dữ liệu hợp lệ!', 'error');
    };
    reader.readAsText(file);
  }

  // === UTILS & EVENTS ===
  function countWords(str) {
    return str.trim() ? str.trim().split(/\s+/).length : 0;
  }
  
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

  // Chuyển tab và lưu state
  function switchTab(tabId) {
      document.querySelectorAll('.tab-button').forEach(b => {
          b.classList.toggle('active', b.dataset.tab === tabId);
      });
      document.querySelectorAll('.tab-content').forEach(c => {
          c.classList.toggle('active', c.id === tabId);
      });
      state.activeTab = tabId;
      saveState();
  }

  function initEvents() {
    // Tab event
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
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
    document.getElementById('save-settings').onclick = () => saveCurrentPairsToState(false);

    document.getElementById('replace-button').onclick = () => {
        saveCurrentPairsToState(true);
        // THỰC HIỆN LOGIC MỚI
        const result = performReplaceWithHighlight(els.inputText.value);
        els.outputText.innerHTML = result.html; // Gán HTML để hiện highlight

        updateCounters();
        saveTempInput();
        showNotification(`Đã thay thế ${result.count} vị trí!`, 'info');
    };

    document.getElementById('copy-button').onclick = () => {
        // Lấy innerText để copy text thuần (không dính html tags)
        if(!els.outputText.innerText) return;
        navigator.clipboard.writeText(els.outputText.innerText);
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
  
  // Khôi phục tab cũ sau khi reload
  if(state.activeTab) {
      switchTab(state.activeTab);
  }
  
  initEvents();
});
