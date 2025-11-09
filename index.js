document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  // Translations (giữ nguyên)
  const translations = { /* ... giữ nguyên toàn bộ translations.vn ... */ 
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

  // === ESCAPE REGEXP ===
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // === REPLACE TEXT - 100% NHƯ JOYDEEPDEB ===
  function replaceText(inputText, pairs, useMatchCase) {
    if (!inputText) return '';
    let text = inputText;

    // Tạo danh sách regex + replacement
    const rules = pairs
      .filter(p => p.find && p.find.trim())
      .map(p => ({
        find: p.find.trim(),
        replace: p.replace || '',
        isRegex: p.isRegex || false
      }));

    if (rules.length === 0) return text;

    // Xử lý từng rule theo thứ tự
    for (const rule of rules) {
      try {
        let pattern;
        let flags = 'g';

        if (rule.isRegex) {
          pattern = rule.find;
          flags += useMatchCase ? '' : 'i';
          flags += 'u'; // Unicode support
        } else {
          pattern = escapeRegExp(rule.find);
          flags += useMatchCase ? '' : 'i';
          flags += 'u';
        }

        const regex = new RegExp(pattern, flags);

        text = text.replace(regex, (match) => {
          let repl = rule.replace;

          // Giữ case nếu không match case
          if (!useMatchCase) {
            if (match === match.toUpperCase()) {
              repl = repl.toUpperCase();
            } else if (match === match.toLowerCase()) {
              repl = repl.toLowerCase();
            } else if (match[0] === match[0].toUpperCase()) {
              repl = repl.charAt(0).toUpperCase() + repl.slice(1);
            }
          }

          return repl;
        });
      } catch (e) {
        console.warn('Invalid regex:', rule.find, e);
      }
    }

    // Post-process: Chuẩn hóa khoảng trắng, xuống dòng
    text = text
      .replace(/\s+/g, ' ')           // Gộp space
      .replace(/\n\s+/g, '\n')        // Xóa space đầu dòng
      .replace(/\s+\n/g, '\n')        // Xóa space cuối dòng
      .replace(/\n{3,}/g, '\n\n')     // Tối đa 2 dòng trống
      .trim();

    return text;
  }

  // === CSV EXPORT ===
  function exportSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: {} };
      let csv = 'find,replace,mode\n';

      Object.keys(settings.modes).forEach(mode => {
        const modeData = settings.modes[mode];
        if (modeData.pairs && modeData.pairs.length > 0) {
          modeData.pairs.forEach(pair => {
            if (pair.find) {
              const findEsc = pair.find.replace(/"/g, '""');
              const replaceEsc = (pair.replace || '').replace(/"/g, '""');
              csv += `"${findEsc}","${replaceEsc}","${mode}"\n`;
            }
          });
        }
      });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
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

  // === CSV IMPORT ===
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
          const text = ev.target.result;
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
          if (lines.length < 1 || !lines[0].includes('find,replace,mode')) {
            throw new Error('CSV không đúng định dạng');
          }

          const newSettings = { modes: {} };
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].match(/("([^"]*)")|([^,]+)/g);
            if (!cols || cols.length < 3) continue;

            let find = cols[0].replace(/^"|"$/g, '').replace(/""/g, '"');
            let replace = cols[1].replace(/^"|"$/g, '').replace(/""/g, '"');
            let mode = cols[2].replace(/^"|"$/g, '').replace(/""/g, '"');

            if (!find) continue;
            if (!newSettings.modes[mode]) {
              newSettings.modes[mode] = { pairs: [], matchCase: false };
            }
            newSettings.modes[mode].pairs.push({ find, replace });
          }

          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
          loadModes();
          showNotification(translations[currentLang].settingsImported, 'success');
        } catch (err) {
          console.error(err);
          showNotification(translations[currentLang].importError, 'error');
        }
      };
      reader.readAsText(file, 'UTF-8');
    };
    input.click();
  }

  // === LOAD/SAVE MODES ===
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

    if (modeData.pairs.length === 0) {
      addPair('', '');
    } else {
      modeData.pairs.forEach(p => addPair(p.find, p.replace));
    }

    matchCaseEnabled = modeData.matchCase || false;
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

  // === UI & EVENTS (giữ nguyên, chỉ thay export/import) ===
  function updateLanguage(lang) { /* giữ nguyên */ }
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

  // === INPUT STATE ===
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
    ['input-text', 'split-input-text'].forEach(id => updateWordCount(id, id.replace('text', 'word-count')));
  }

  // === INIT ===
  function init() {
    updateLanguage('vn');
    loadModes();
    updateSplitModeUI(2);
    attachButtonEvents();
    restoreInputState();

    // Thay JSON → CSV
    document.getElementById('export-settings').onclick = exportSettings;
    document.getElementById('import-settings').onclick = importSettings;
  }

  // === GỌI INIT ===
  init();

  // === GỌI CÁC HÀM KHÁC (giữ nguyên attachButtonEvents, split, etc.) ===
  // ... (giữ nguyên phần attachButtonEvents, split logic như cũ)
  // (Bạn có thể giữ nguyên phần còn lại của file cũ từ `attachButtonEvents` trở xuống)
});
