document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  const translations = {
    vn: {
      appTitle: 'Tiện Ích Của Trịnh Hg',
      contactText1: '- Gia hạn tài khoản: ',
      settingsTab: 'Settings',
      replaceTab: 'Replace',
      splitTab: 'Chia Chương',
      settingsTitle: 'Cài đặt tìm kiếm và thay thế',
      modeLabel: 'Chọn chế độ:',
      default: 'Mặc định',
      addMode: 'Thêm chế độ mới',
      copyMode: 'Sao Chép Chế Độ',
      matchCaseOn: 'Match Case: Bật',
      matchCaseOff: 'Match Case: Tắt',
      findPlaceholder: 'Tìm ví dụ dấu phẩy',
      replacePlaceholder: 'Thay thế ví dụ dấu chấm phẩy',
      removeButton: 'Xóa',
      addPair: 'Thêm',
      saveSettings: 'Lưu cài đặt',
      replaceTitle: 'Thay thế Dấu câu',
      inputText: 'Dán văn bản của bạn vào đây...',
      replaceButton: 'Thay thế',
      outputText: 'Kết quả sẽ xuất hiện ở đây...',
      copyButton: 'Sao chép',
      splitTitle: 'Chia Chương',
      splitInputText: 'Dán văn bản của bạn vào đây...',
      splitButton: 'Chia Chương',
      output1Text: 'Kết quả chương 1 sẽ xuất hiện ở đây...',
      output2Text: 'Kết quả chương 2 sẽ xuất hiện ở đây...',
      output3Text: 'Kết quả chương 3 sẽ xuất hiện ở đây...',
      output4Text: 'Kết quả chương 4 sẽ xuất hiện ở đây...',
      output5Text: 'Kết quả chương 5 sẽ xuất hiện ở đây...',
      output6Text: 'Kết quả chương 6 sẽ xuất hiện ở đây...',
      output7Text: 'Kết quả chương 7 sẽ xuất hiện ở đây...',
      output8Text: 'Kết quả chương 8 sẽ xuất hiện ở đây...',
      output9Text: 'Kết quả chương 9 sẽ xuất hiện ở đây...',
      output10Text: 'Kết quả chương 10 sẽ xuất hiện ở đây...',
      noPairsToSave: 'Không có cặp nào để lưu!',
      settingsSaved: 'Đã lưu cài đặt cho chế độ "{mode}"!',
      newModePrompt: 'Nhập tên chế độ mới:',
      invalidModeName: 'Tên chế độ không hợp lệ hoặc đã tồn tại!',
      modeCreated: 'Đã tạo chế độ "{mode}"!',
      switchedMode: 'Đã chuyển sang chế độ "{mode}"',
      noTextToReplace: 'Không có văn bản để thay thế!',
      noPairsConfigured: 'Không có cặp tìm-thay thế nào được cấu hình!',
      textReplaced: 'Đã thay thế văn bản thành công!',
      textCopied: 'Đã sao chép văn bản vào clipboard!',
      failedToCopy: 'Không thể sao chép văn bản!',
      noTextToCopy: 'Không có văn bản để sao chép!',
      modeDeleted: 'Đã xóa chế độ "{mode}"!',
      renamePrompt: 'Nhập tên mới cho chế độ:',
      renameSuccess: 'Đã đổi tên chế độ thành "{mode}"!',
      renameError: 'Lỗi khi đổi tên chế độ!',
      noTextToSplit: 'Không có văn bản để chia!',
      splitSuccess: 'Đã chia chương thành công!',
      exportSettings: 'Xuất Cài Đặt',
      importSettings: 'Nhập Cài Đặt',
      settingsExported: 'Đã xuất cài đặt thành công!',
      settingsImported: 'Đã nhập cài đặt thành công!',
      importError: 'Lỗi khi nhập cài đặt!',
      wordCount: 'Words: {count}'
    }
  };

  let currentLang = 'vn';
  let matchCaseEnabled = false;
  let currentMode = 'default';
  let currentSplitMode = 2;
  const LOCAL_STORAGE_KEY = 'local_settings_csv';
  const INPUT_STORAGE_KEY = 'input_state';

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function replaceText(inputText, pairs, useMatchCase) {
    if (!inputText) return '';
    let text = inputText;

    const rules = pairs
      .filter(p => p.find && p.find.trim())
      .map(p => ({ find: p.find.trim(), replace: p.replace || '' }));

    if (rules.length === 0) return text;

    for (const rule of rules) {
      try {
        const pattern = escapeRegExp(rule.find);
        const flags = 'gu' + (useMatchCase ? '' : 'i');
        const regex = new RegExp(pattern, flags);
        text = text.replace(regex, (match) => {
          let repl = rule.replace;
          if (!useMatchCase) {
            if (match === match.toUpperCase()) repl = repl.toUpperCase();
            else if (match === match.toLowerCase()) repl = repl.toLowerCase();
            else if (match[0] === match[0].toUpperCase()) {
              repl = repl.charAt(0).toUpperCase() + repl.slice(1);
            }
          }
          return repl;
        });
      } catch (e) {
        console.warn('Invalid pattern:', rule.find);
      }
    }

    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s+/g, '\n')
      .replace(/\s+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function exportSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
      let csv = '\uFEFFfind,replace,mode\n';
      Object.keys(settings.modes).forEach(mode => {
        settings.modes[mode].pairs.forEach(p => {
          if (p.find) {
            const findEsc = p.find.replace(/"/g, '""');
            const replaceEsc = (p.replace || '').replace(/"/g, '""');
            csv += `"${findEsc}","${replaceEsc}","${mode}"\n`;
          }
        });
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'settings.csv';
      a.click();
      URL.revokeObjectURL(url);
      showNotification(translations[currentLang].settingsExported, 'success');
    } catch (err) {
      showNotification(translations[currentLang].importError, 'error');
    }
  }

  function importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target.result.replace(/^\uFEFF/, '');
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
          if (!lines[0].includes('find,replace,mode')) throw new Error('Invalid CSV');
          const newSettings = { modes: {} };
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].match(/("([^"]*)")|([^,]+)/g);
            if (!cols || cols.length < 3) continue;
            let find = cols[0].replace(/^"|"$/g, '').replace(/""/g, '"');
            let replace = cols[1].replace(/^"|"$/g, '').replace(/""/g, '"');
            let mode = cols[2].replace(/^"|"$/g, '').replace(/""/g, '"');
            if (!find) continue;
            if (!newSettings.modes[mode]) newSettings.modes[mode] = { pairs: [], matchCase: false };
            newSettings.modes[mode].pairs.push({ find, replace });
          }
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
          loadModes();
          showNotification(translations[currentLang].settingsImported, 'success');
        } catch (err) {
          showNotification(translations[currentLang].importError, 'error');
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  }

  function loadModes() {
    const select = document.getElementById('mode-select');
    const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
    const modes = Object.keys(settings.modes).sort();
    select.innerHTML = '';
    modes.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      select.appendChild(opt);
    });
    select.value = currentMode;
    loadSettings();
    updateModeButtons();
  }

  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
    const modeData = settings.modes[currentMode] || { pairs: [], matchCase: false };
    const list = document.getElementById('punctuation-list');
    list.innerHTML = '';
    if (modeData.pairs.length === 0) addPair('', '');
    else modeData.pairs.forEach(p => addPair(p.find, p.replace));
    matchCaseEnabled = modeData.matchCase;
    updateButtonStates();
  }

  function saveSettings() {
    const pairs = Array.from(document.querySelectorAll('.punctuation-item')).map(item => ({
      find: item.querySelector('.find').value,
      replace: item.querySelector('.replace').value
    })).filter(p => p.find);

    if (pairs.length === 0) {
      showNotification(translations[currentLang].noPairsToSave, 'error');
      return;
    }

    const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
    settings.modes[currentMode] = { pairs, matchCase: matchCaseEnabled };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    showNotification(translations[currentLang].settingsSaved.replace('{mode}', currentMode), 'success');
  }

  function addPair(find = '', replace = '') {
    const list = document.getElementById('punctuation-list');
    const item = document.createElement('div');
    item.className = 'punctuation-item';

    const findInp = document.createElement('input');
    findInp.type = 'text';
    findInp.className = 'find';
    findInp.placeholder = translations[currentLang].findPlaceholder;
    findInp.value = find;

    const replaceInp = document.createElement('input');
    replaceInp.type = 'text';
    replaceInp.className = 'replace';
    replaceInp.placeholder = translations[currentLang].replacePlaceholder;
    replaceInp.value = replace;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove';
    removeBtn.textContent = translations[currentLang].removeButton;
    removeBtn.onclick = () => { item.remove(); saveInputState(); };

    item.appendChild(findInp);
    item.appendChild(replaceInp);
    item.appendChild(removeBtn);
    list.insertBefore(item, list.firstChild);

    findInp.oninput = replaceInp.oninput = saveInputState;
  }

  function updateSplitModeUI(mode) {
    currentSplitMode = mode;
    const container = document.querySelector('.split-container');
    const sections = Array.from({ length: 8 }, (_, i) => document.getElementById(`output${i + 3}-section`));
    const buttons = document.querySelectorAll('.split-mode-button');

    container.classList.remove(...Array.from({ length: 9 }, (_, i) => `split-${i + 2}`));
    container.classList.add(`split-${mode}`);

    buttons.forEach(btn => btn.classList.toggle('active', parseInt(btn.dataset.splitMode) === mode));
    sections.forEach((sec, i) => { if (sec) sec.style.display = mode > i + 2 ? 'block' : 'none'; });

    ['split-input-text', ...Array.from({ length: 10 }, (_, i) => `output${i + 1}-text`)].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
        updateWordCount(id, id === 'split-input-text' ? 'split-input-word-count' : `${id}-word-count`);
      }
    });
    saveInputState();
  }

  function attachButtonEvents() {
    // Match Case
    document.getElementById('match-case')?.addEventListener('click', () => {
      matchCaseEnabled = !matchCaseEnabled;
      updateButtonStates();
      saveSettings();
    });

    // Mode Select
    document.getElementById('mode-select')?.addEventListener('change', (e) => {
      currentMode = e.target.value;
      loadSettings();
      showNotification(translations[currentLang].switchedMode.replace('{mode}', currentMode), 'success');
      updateModeButtons();
    });

    // Add Mode
    document.getElementById('add-mode')?.addEventListener('click', () => {
      const newMode = prompt(translations[currentLang].newModePrompt);
      if (!newMode || newMode === 'default' || newMode.includes('mode_') || newMode.trim() === '') {
        showNotification(translations[currentLang].invalidModeName, 'error');
        return;
      }
      const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
      if (settings.modes[newMode]) {
        showNotification(translations[currentLang].invalidModeName, 'error');
        return;
      }
      settings.modes[newMode] = { pairs: [], matchCase: false };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      currentMode = newMode;
      loadModes();
      showNotification(translations[currentLang].modeCreated.replace('{mode}', newMode), 'success');
    });

    // Copy Mode
    document.getElementById('copy-mode')?.addEventListener('click', () => {
      const newMode = prompt(translations[currentLang].newModePrompt);
      if (!newMode || newMode === 'default' || newMode.includes('mode_') || newMode.trim() === '') {
        showNotification(translations[currentLang].invalidModeName, 'error');
        return;
      }
      const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
      if (settings.modes[newMode]) {
        showNotification(translations[currentLang].invalidModeName, 'error');
        return;
      }
      const currentData = settings.modes[currentMode] || { pairs: [], matchCase: false };
      settings.modes[newMode] = JSON.parse(JSON.stringify(currentData));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      currentMode = newMode;
      loadModes();
      showNotification(translations[currentLang].modeCreated.replace('{mode}', newMode), 'success');
    });

    // Delete Mode
    document.getElementById('delete-mode')?.addEventListener('click', () => {
      if (currentMode === 'default') {
        showNotification('Không thể xóa chế độ mặc định!', 'error');
        return;
      }
      if (confirm(`Xóa chế độ "${currentMode}"?`)) {
        const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
        delete settings.modes[currentMode];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
        currentMode = 'default';
        loadModes();
        showNotification(translations[currentLang].modeDeleted.replace('{mode}', currentMode), 'success');
      }
    });

    // Rename Mode
    document.getElementById('rename-mode')?.addEventListener('click', () => {
      if (currentMode === 'default') {
        showNotification('Không thể đổi tên chế độ mặc định!', 'error');
        return;
      }
      const newName = prompt(translations[currentLang].renamePrompt, currentMode);
      if (!newName || newName === 'default' || newName.includes('mode_') || newName.trim() === '' || newName === currentMode) {
        showNotification(translations[currentLang].renameError, 'error');
        return;
      }
      const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
      if (settings.modes[newName]) {
        showNotification('Tên chế độ đã tồn tại!', 'error');
        return;
      }
      settings.modes[newName] = settings.modes[currentMode];
      delete settings.modes[currentMode];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      currentMode = newName;
      loadModes();
      showNotification(translations[currentLang].renameSuccess.replace('{mode}', newName), 'success');
    });

    // Add Pair
    document.getElementById('add-pair')?.addEventListener('click', () => addPair());

    // Save Settings
    document.getElementById('save-settings')?.addEventListener('click', saveSettings);

    // Replace Button
    document.getElementById('replace-button')?.addEventListener('click', () => {
      const input = document.getElementById('input-text');
      if (!input?.value) return showNotification(translations[currentLang].noTextToReplace, 'error');
      const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
      const pairs = settings.modes[currentMode]?.pairs || [];
      if (pairs.length === 0) return showNotification(translations[currentLang].noPairsConfigured, 'error');
      const output = replaceText(input.value, pairs, matchCaseEnabled);
      const outputEl = document.getElementById('output-text');
      outputEl.value = output;
      input.value = '';
      updateWordCount('input-text', 'input-word-count');
      updateWordCount('output-text', 'output-word-count');
      showNotification(translations[currentLang].textReplaced, 'success');
      saveInputState();
    });

    // Copy Button
    document.getElementById('copy-button')?.addEventListener('click', () => {
      const el = document.getElementById('output-text');
      if (!el?.value) return showNotification(translations[currentLang].noTextToCopy, 'error');
      navigator.clipboard.writeText(el.value).then(() => {
        showNotification(translations[currentLang].textCopied, 'success');
      }).catch(() => showNotification(translations[currentLang].failedToCopy, 'error'));
    });

    // Split Button
    document.getElementById('split-button')?.addEventListener('click', () => {
      const input = document.getElementById('split-input-text');
      if (!input?.value) return showNotification(translations[currentLang].noTextToSplit, 'error');
      const lines = input.value.split('\n');
      const firstMatch = lines[0].match(/^[Cc]hương\s+(\d+)(?::\s*(.*))?$/m);
      let chapterNum = 1, chapterTitle = '', startIdx = 0;
      if (firstMatch) {
        chapterNum = parseInt(firstMatch[1]);
        chapterTitle = firstMatch[2] ? `: ${firstMatch[2]}` : '';
        startIdx = 1;
      }
      const content = lines.slice(startIdx).join('\n');
      const paragraphs = content.split('\n').filter(p => p.trim());
      const totalWords = countWords(content);
      const wordsPerPart = Math.floor(totalWords / currentSplitMode);
      let parts = [], wordCount = 0, start = 0;
      for (let i = 0; i < paragraphs.length; i++) {
        wordCount += countWords(paragraphs[i]);
        if (parts.length < currentSplitMode - 1 && wordCount >= wordsPerPart * (parts.length + 1)) {
          parts.push(paragraphs.slice(start, i + 1).join('\n\n'));
          start = i + 1;
        }
      }
      parts.push(paragraphs.slice(start).join('\n\n'));
      Array.from({ length: currentSplitMode }, (_, i) => i + 1).forEach(i => {
        const el = document.getElementById(`output${i}-text`);
        if (el) {
          el.value = `Chương ${chapterNum}.${i}${chapterTitle}\n\n${parts[i - 1] || ''}`;
          updateWordCount(`output${i}-text`, `output${i}-word-count`);
        }
      });
      input.value = '';
      updateWordCount('split-input-text', 'split-input-word-count');
      showNotification(translations[currentLang].splitSuccess, 'success');
      saveInputState();
    });

    // Copy Buttons 1-10
    for (let i = 1; i <= 10; i++) {
      document.getElementById(`copy-button${i}`)?.addEventListener('click', () => {
        const el = document.getElementById(`output${i}-text`);
        if (!el?.value) return showNotification(translations[currentLang].noTextToCopy, 'error');
        navigator.clipboard.writeText(el.value).then(() => showNotification(translations[currentLang].textCopied, 'success'));
      });
    }

    // Split Mode Buttons
    document.querySelectorAll('.split-mode-button').forEach(btn => {
      btn.addEventListener('click', () => updateSplitModeUI(parseInt(btn.dataset.splitMode)));
    });

    // Export / Import
    document.getElementById('export-settings').onclick = exportSettings;
    document.getElementById('import-settings').onclick = importSettings;

    // Tab Buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === btn.dataset.tab));
        document.querySelectorAll('.tab-button').forEach(b => b.classList.toggle('active', b === btn));
      });
    });

    // Input listeners
    ['input-text', 'split-input-text'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        updateWordCount(id, id === 'input-text' ? 'input-word-count' : 'split-input-word-count');
        saveInputState();
      });
    });
  }

  function updateButtonStates() {
    const btn = document.getElementById('match-case');
    if (btn) {
      btn.textContent = matchCaseEnabled ? translations.vn.matchCaseOn : translations.vn.matchCaseOff;
      btn.classList.toggle('active', matchCaseEnabled);
    }
  }

  function updateModeButtons() {
    const rename = document.getElementById('rename-mode');
    const del = document.getElementById('delete-mode');
    if (currentMode !== 'default') {
      rename.style.display = del.style.display = 'inline-block';
    } else {
      rename.style.display = del.style.display = 'none';
    }
  }

  function showNotification(msg, type = 'success') {
    const container = document.getElementById('notification-container');
    const n = document.createElement('div');
    n.className = `notification ${type}`;
    n.textContent = msg;
    container.appendChild(n);
    setTimeout(() => n.remove(), 3000);
  }

  function countWords(text) {
    return text.trim() ? text.split(/\s+/).filter(w => w).length : 0;
  }

  function updateWordCount(id, counterId) {
    const el = document.getElementById(id);
    const c = document.getElementById(counterId);
    if (el && c) c.textContent = translations.vn.wordCount.replace('{count}', countWords(el.value));
  }

  function saveInputState() {
    const state = {
      inputText: document.getElementById('input-text')?.value || '',
      splitInputText: document.getElementById('split-input-text')?.value || '',
      punctuationItems: Array.from(document.querySelectorAll('.punctuation-item')).map(item => ({
        find: item.querySelector('.find')?.value || '',
        replace: item.querySelector('.replace')?.value || ''
      }))
    };
    localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(state));
  }

  function restoreInputState() {
    const state = JSON.parse(localStorage.getItem(INPUT_STORAGE_KEY));
    if (!state) return;
    if (state.inputText) document.getElementById('input-text').value = state.inputText;
    if (state.splitInputText) document.getElementById('split-input-text').value = state.splitInputText;
    if (state.punctuationItems) {
      const list = document.getElementById('punctuation-list');
      list.innerHTML = '';
      state.punctuationItems.reverse().forEach(p => addPair(p.find, p.replace));
    }
    updateWordCount('input-text', 'input-word-count');
    updateWordCount('split-input-text', 'split-input-word-count');
  }

  function init() {
    loadModes();
    updateSplitModeUI(2);
    attachButtonEvents();
    restoreInputState();
  }

  init();
});
