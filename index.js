document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  // Translations object
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
  let currentSplitMode = 2; // Mặc định là Chia 2
  const LOCAL_STORAGE_KEY = 'local_settings';
  const INPUT_STORAGE_KEY = 'input_state';

  // Lưu trạng thái input vào localStorage
  function saveInputState() {
    const state = {
      inputText: document.getElementById('input-text')?.value || '',
      splitInputText: document.getElementById('split-input-text')?.value || '',
      outputText: document.getElementById('output-text')?.value || '',
      output1Text: document.getElementById('output1-text')?.value || '',
      output2Text: document.getElementById('output2-text')?.value || '',
      output3Text: document.getElementById('output3-text')?.value || '',
      output4Text: document.getElementById('output4-text')?.value || '',
      output5Text: document.getElementById('output5-text')?.value || '',
      output6Text: document.getElementById('output6-text')?.value || '',
      output7Text: document.getElementById('output7-text')?.value || '',
      output8Text: document.getElementById('output8-text')?.value || '',
      output9Text: document.getElementById('output9-text')?.value || '',
      output10Text: document.getElementById('output10-text')?.value || '',
      punctuationItems: Array.from(document.querySelectorAll('.punctuation-item')).map(item => ({
        find: item.querySelector('.find')?.value || '',
        replace: item.querySelector('.replace')?.value || ''
      }))
    };
    localStorage.setItem(INPUT_STORAGE_KEY, JSON.stringify(state));
    console.log('Đã lưu trạng thái input vào localStorage');
  }

  // Khôi phục trạng thái input từ localStorage
  function restoreInputState() {
    const state = JSON.parse(localStorage.getItem(INPUT_STORAGE_KEY));
    if (!state) return;

    if (state.inputText && document.getElementById('input-text')) {
      document.getElementById('input-text').value = state.inputText;
      updateWordCount('input-text', 'input-word-count');
    }
    if (state.splitInputText && document.getElementById('split-input-text')) {
      document.getElementById('split-input-text').value = state.splitInputText;
      updateWordCount('split-input-text', 'split-input-word-count');
    }
    if (state.outputText && document.getElementById('output-text')) {
      document.getElementById('output-text').value = state.outputText;
      updateWordCount('output-text', 'output-word-count');
    }
    if (state.output1Text && document.getElementById('output1-text')) {
      document.getElementById('output1-text').value = state.output1Text;
      updateWordCount('output1-text', 'output1-word-count');
    }
    if (state.output2Text && document.getElementById('output2-text')) {
      document.getElementById('output2-text').value = state.output2Text;
      updateWordCount('output2-text', 'output2-word-count');
    }
    if (state.output3Text && document.getElementById('output3-text')) {
      document.getElementById('output3-text').value = state.output3Text;
      updateWordCount('output3-text', 'output3-word-count');
    }
    if (state.output4Text && document.getElementById('output4-text')) {
      document.getElementById('output4-text').value = state.output4Text;
      updateWordCount('output4-text', 'output4-word-count');
    }
    if (state.output5Text && document.getElementById('output5-text')) {
      document.getElementById('output5-text').value = state.output5Text;
      updateWordCount('output5-text', 'output5-word-count');
    }
    if (state.output6Text && document.getElementById('output6-text')) {
      document.getElementById('output6-text').value = state.output6Text;
      updateWordCount('output6-text', 'output6-word-count');
    }
    if (state.output7Text && document.getElementById('output7-text')) {
      document.getElementById('output7-text').value = state.output7Text;
      updateWordCount('output7-text', 'output7-word-count');
    }
    if (state.output8Text && document.getElementById('output8-text')) {
      document.getElementById('output8-text').value = state.output8Text;
      updateWordCount('output8-text', 'output8-word-count');
    }
    if (state.output9Text && document.getElementById('output9-text')) {
      document.getElementById('output9-text').value = state.output9Text;
      updateWordCount('output9-text', 'output9-word-count');
    }
    if (state.output10Text && document.getElementById('output10-text')) {
      document.getElementById('output10-text').value = state.output10Text;
      updateWordCount('output10-text', 'output10-word-count');
    }
    if (state.punctuationItems && state.punctuationItems.length > 0) {
      const list = document.getElementById('punctuation-list');
      if (list) {
        list.innerHTML = '';
        state.punctuationItems.slice().reverse().forEach(pair => {
          addPair(pair.find, pair.replace);
        });
      }
    }
    console.log('Đã khôi phục trạng thái input từ localStorage');
  }

  // Hàm escapeHtml
  function escapeHtml(str) {
    try {
      if (typeof str !== 'string') return '';
      const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;'
      };
      return str.replace(/[&<>"']/g, match => htmlEntities[match]);
    } catch (error) {
      console.error('Lỗi trong escapeHtml:', error);
      return str || '';
    }
  }

  // Hàm escapeRegExp
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Hàm thay thế văn bản
  function replaceText(inputText, pairs, matchCase) {
    let outputText = inputText;

    // Tạo map find: replace
    const map = {};
    pairs.forEach(pair => {
      let find = pair.find;
      let replace = pair.replace !== null ? pair.replace : '';
      if (!find) return;
      if (!matchCase) {
        find = find.toLowerCase(); // Normalize key if case-insensitive
      }
      map[find] = replace;
    });

    // Gộp tất cả find vào regex chung
    const escapedKeys = Object.keys(map).map(k => escapeRegExp(k));
    if (escapedKeys.length === 0) return outputText;
    const regexFlags = matchCase ? 'g' : 'gi';
    const regex = new RegExp(escapedKeys.join('|'), regexFlags);

    // Replace một lần
    outputText = outputText.replace(regex, (matched) => {
      const key = matchCase ? matched : matched.toLowerCase();
      let replacement = map[key];
      if (!matchCase) {
        if (matched === matched.toUpperCase()) {
          replacement = replacement.toUpperCase();
        } else if (matched === matched.toLowerCase()) {
          replacement = replacement.toLowerCase();
        } else if (matched[0] === matched[0].toUpperCase()) {
          replacement = replacement.charAt(0).toUpperCase() + replacement.slice(1).toLowerCase();
        }
      }
      return replacement;
    });

    // Step 2: Capitalize first letter of replaced words at start of line or after ". "
    pairs.forEach(pair => {
      let replace = pair.replace !== null ? pair.replace : '';
      if (!replace) return;

      if (replace === replace.toUpperCase() || /[A-Z]/.test(replace.slice(1))) {
        return;
      }

      const escapedReplace = escapeRegExp(replace);
      const pattern = new RegExp(`(^|\\n|\\.\\s)(${escapedReplace})`, matchCase ? 'g' : 'gi');
      outputText = outputText.replace(pattern, (match, prefix, word) => {
        return `${prefix}${word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()}`;
      });
    });

    // Step 3: Format paragraphs
    const paragraphs = outputText.split('\n').filter(p => p.trim());
    return paragraphs.join('\n\n');
  }

  function updateLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    const elements = {
      appTitle: document.getElementById('app-title'),
      contactText1: document.getElementById('contact-text1'),
      settingsTab: document.getElementById('settings-tab'),
      replaceTab: document.getElementById('replace-tab'),
      splitTab: document.getElementById('split-tab'),
      settingsTitle: document.getElementById('settings-title'),
      modeLabel: document.getElementById('mode-label'),
      addMode: document.getElementById('add-mode'),
      copyMode: document.getElementById('copy-mode'),
      matchCase: document.getElementById('match-case'),
      findPlaceholder: document.getElementById('find-placeholder'),
      replacePlaceholder: document.getElementById('replace-placeholder'),
      removeButton: document.getElementById('remove-button'),
      addPair: document.getElementById('add-pair'),
      saveSettings: document.getElementById('save-settings'),
      replaceTitle: document.getElementById('replace-title'),
      inputText: document.getElementById('input-text'),
      replaceButton: document.getElementById('replace-button'),
      outputText: document.getElementById('output-text'),
      copyButton: document.getElementById('copy-button'),
      splitTitle: document.getElementById('split-title'),
      splitInputText: document.getElementById('split-input-text'),
      splitButton: document.getElementById('split-button'),
      output1Text: document.getElementById('output1-text'),
      output2Text: document.getElementById('output2-text'),
      output3Text: document.getElementById('output3-text'),
      output4Text: document.getElementById('output4-text'),
      output5Text: document.getElementById('output5-text'),
      output6Text: document.getElementById('output6-text'),
      output7Text: document.getElementById('output7-text'),
      output8Text: document.getElementById('output8-text'),
      output9Text: document.getElementById('output9-text'),
      output10Text: document.getElementById('output10-text'),
      copyButton1: document.getElementById('copy-button1'),
      copyButton2: document.getElementById('copy-button2'),
      copyButton3: document.getElementById('copy-button3'),
      copyButton4: document.getElementById('copy-button4'),
      copyButton5: document.getElementById('copy-button5'),
      copyButton6: document.getElementById('copy-button6'),
      copyButton7: document.getElementById('copy-button7'),
      copyButton8: document.getElementById('copy-button8'),
      copyButton9: document.getElementById('copy-button9'),
      copyButton10: document.getElementById('copy-button10'),
      exportSettings: document.getElementById('export-settings'),
      importSettings: document.getElementById('import-settings')
    };

    if (elements.appTitle) elements.appTitle.textContent = translations[lang].appTitle;
    if (elements.contactText1) {
      const textNode = Array.from(elements.contactText1.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        textNode.textContent = translations[lang].contactText1;
      } else {
        console.warn('Không tìm thấy text node cho contactText1, tạo mới');
        elements.contactText1.insertBefore(document.createTextNode(translations[lang].contactText1), elements.contactText1.firstChild);
      }
    }
    if (elements.settingsTab) elements.settingsTab.textContent = translations[lang].settingsTab;
    if (elements.replaceTab) elements.replaceTab.textContent = translations[lang].replaceTab;
    if (elements.splitTab) elements.splitTab.textContent = translations[lang].splitTab;
    if (elements.settingsTitle) elements.settingsTitle.textContent = translations[lang].settingsTitle;
    if (elements.modeLabel) elements.modeLabel.textContent = translations[lang].modeLabel;
    if (elements.addMode) elements.addMode.textContent = translations[lang].addMode;
    if (elements.copyMode) elements.copyMode.textContent = translations[lang].copyMode;
    if (elements.matchCase) elements.matchCase.textContent = matchCaseEnabled ? translations[lang].matchCaseOn : translations[lang].matchCaseOff;
    if (elements.findPlaceholder) elements.findPlaceholder.placeholder = translations[lang].findPlaceholder;
    if (elements.replacePlaceholder) elements.replacePlaceholder.placeholder = translations[lang].replacePlaceholder;
    if (elements.removeButton) elements.removeButton.textContent = translations[lang].removeButton;
    if (elements.addPair) elements.addPair.textContent = translations[lang].addPair;
    if (elements.saveSettings) elements.saveSettings.textContent = translations[lang].saveSettings;
    if (elements.replaceTitle) elements.replaceTitle.textContent = translations[lang].replaceTitle;
    if (elements.inputText) elements.inputText.placeholder = translations[lang].inputText;
    if (elements.replaceButton) elements.replaceButton.textContent = translations[lang].replaceButton;
    if (elements.outputText) elements.outputText.placeholder = translations[lang].outputText;
    if (elements.copyButton) elements.copyButton.textContent = translations[lang].copyButton;
    if (elements.splitTitle) elements.splitTitle.textContent = translations[lang].splitTitle;
    if (elements.splitInputText) elements.splitInputText.placeholder = translations[lang].splitInputText;
    if (elements.splitButton) elements.splitButton.textContent = translations[lang].splitButton;
    if (elements.output1Text) elements.output1Text.placeholder = translations[lang].output1Text;
    if (elements.output2Text) elements.output2Text.placeholder = translations[lang].output2Text;
    if (elements.output3Text) elements.output3Text.placeholder = translations[lang].output3Text;
    if (elements.output4Text) elements.output4Text.placeholder = translations[lang].output4Text;
    if (elements.output5Text) elements.output5Text.placeholder = translations[lang].output5Text;
    if (elements.output6Text) elements.output6Text.placeholder = translations[lang].output6Text;
    if (elements.output7Text) elements.output7Text.placeholder = translations[lang].output7Text;
    if (elements.output8Text) elements.output8Text.placeholder = translations[lang].output8Text;
    if (elements.output9Text) elements.output9Text.placeholder = translations[lang].output9Text;
    if (elements.output10Text) elements.output10Text.placeholder = translations[lang].output10Text;
    if (elements.copyButton1) elements.copyButton1.textContent = translations[lang].copyButton + ' 1';
    if (elements.copyButton2) elements.copyButton2.textContent = translations[lang].copyButton + ' 2';
    if (elements.copyButton3) elements.copyButton3.textContent = translations[lang].copyButton + ' 3';
    if (elements.copyButton4) elements.copyButton4.textContent = translations[lang].copyButton + ' 4';
    if (elements.copyButton5) elements.copyButton5.textContent = translations[lang].copyButton + ' 5';
    if (elements.copyButton6) elements.copyButton6.textContent = translations[lang].copyButton + ' 6';
    if (elements.copyButton7) elements.copyButton7.textContent = translations[lang].copyButton + ' 7';
    if (elements.copyButton8) elements.copyButton8.textContent = translations[lang].copyButton + ' 8';
    if (elements.copyButton9) elements.copyButton9.textContent = translations[lang].copyButton + ' 9';
    if (elements.copyButton10) elements.copyButton10.textContent = translations[lang].copyButton + ' 10';
    if (elements.exportSettings) elements.exportSettings.textContent = translations[lang].exportSettings;
    if (elements.importSettings) elements.importSettings.textContent = translations[lang].importSettings;

    const punctuationItems = document.querySelectorAll('.punctuation-item');
    punctuationItems.forEach(item => {
      const findInput = item.querySelector('.find');
      const replaceInput = item.querySelector('.replace');
      const removeBtn = item.querySelector('.remove');
      if (findInput) findInput.placeholder = translations[lang].findPlaceholder;
      if (replaceInput) replaceInput.placeholder = translations[lang].replacePlaceholder;
      if (removeBtn) removeBtn.textContent = translations[lang].removeButton;
    });

    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
      loadModes();
    } else {
      console.error('Không tìm thấy phần tử mode select');
    }
  }

  function updateModeButtons() {
    const renameMode = document.getElementById('rename-mode');
    const deleteMode = document.getElementById('delete-mode');
    if (currentMode !== 'default' && renameMode && deleteMode) {
      renameMode.style.display = 'inline-block';
      deleteMode.style.display = 'inline-block';
    } else if (renameMode && deleteMode) {
      renameMode.style.display = 'none';
      deleteMode.style.display = 'none';
    }
  }

  function updateButtonStates() {
    const matchCaseButton = document.getElementById('match-case');
    if (matchCaseButton) {
      matchCaseButton.textContent = matchCaseEnabled ? translations[currentLang].matchCaseOn : translations[currentLang].matchCaseOff;
      matchCaseButton.style.background = matchCaseEnabled ? '#28a745' : '#6c757d';
    } else {
      console.error('Không tìm thấy nút Match Case');
    }
  }

  function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container');
    if (!container) {
      console.error('Không tìm thấy container thông báo');
      return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  function countWords(text) {
    return text.trim() ? text.split(/\s+/).filter(word => word.length > 0).length : 0;
  }

  function updateWordCount(textareaId, counterId) {
    const element = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (element && counter) {
      const wordCount = countWords(element.value || element.textContent);
      counter.textContent = translations[currentLang].wordCount.replace('{count}', wordCount);
    }
  }

  function loadModes() {
    const modeSelect = document.getElementById('mode-select');
    if (!modeSelect) {
      console.error('Không tìm thấy phần tử mode select');
      return;
    }
    let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
    const modes = Object.keys(settings.modes || { default: {} });

    modeSelect.innerHTML = '';
    modes.forEach(mode => {
      const option = document.createElement('option');
      option.value = mode;
      option.textContent = mode;
      modeSelect.appendChild(option);
    });
    modeSelect.value = currentMode;
    loadSettings();
    updateModeButtons();
  }

  function loadSettings() {
    console.log('Đang tải cài đặt cho chế độ:', currentMode);
    let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
    const modeSettings = settings.modes?.[currentMode] || { pairs: [], matchCase: false };
    const list = document.getElementById('punctuation-list');
    if (list) {
      list.innerHTML = '';
      if (!modeSettings.pairs || modeSettings.pairs.length === 0) {
        addPair('', '');
      } else {
        modeSettings.pairs.slice().reverse().forEach(pair => {
          console.log('Đang tải cặp:', pair);
          addPair(pair.find || '', pair.replace || '');
        });
      }
    } else {
      console.error('Không tìm thấy phần tử punctuation-list');
    }
    matchCaseEnabled = modeSettings.matchCase || false;
    updateButtonStates();
    console.log('Đã cập nhật trạng thái:', { matchCaseEnabled });
  }

  function saveSettings() {
    const pairs = Array.from(document.querySelectorAll('.punctuation-item')).map(item => ({
      find: item.querySelector('.find')?.value || '',
      replace: item.querySelector('.replace')?.value || ''
    }));

    if (pairs.every(pair => !pair.find && !pair.replace)) {
      showNotification(translations[currentLang].noPairsToSave, 'error');
      return;
    }

    let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
    settings.modes[currentMode] = {
      pairs: pairs.filter(pair => pair.find || pair.replace),
      matchCase: matchCaseEnabled
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    showNotification(translations[currentLang].settingsSaved.replace('{mode}', currentMode), 'success');
  }

  function addPair(find = '', replace = '') {
    const list = document.getElementById('punctuation-list');
    if (!list) {
      console.error('Không tìm thấy phần tử punctuation-list');
      return;
    }

    const item = document.createElement('div');
    item.className = 'punctuation-item';

    const findInput = document.createElement('input');
    findInput.type = 'text';
    findInput.className = 'find';
    findInput.placeholder = translations[currentLang].findPlaceholder;
    findInput.value = find;

    const replaceInput = document.createElement('input');
    replaceInput.type = 'text';
    replaceInput.className = 'replace';
    replaceInput.placeholder = translations[currentLang].replacePlaceholder;
    replaceInput.value = replace;

    const removeButton = document.createElement('button');
    removeButton.className = 'remove';
    removeButton.textContent = translations[currentLang].removeButton;

    item.appendChild(findInput);
    item.appendChild(replaceInput);
    item.appendChild(removeButton);

    if (list.firstChild) {
      list.insertBefore(item, list.firstChild);
    } else {
      list.appendChild(item);
    }

    removeButton.addEventListener('click', () => {
      item.remove();
      console.log('Đã xóa cặp');
      saveInputState();
    });

    findInput.addEventListener('input', saveInputState);
    replaceInput.addEventListener('input', saveInputState);

    console.log('Đã thêm cặp vào DOM:', { find: findInput.value, replace: replaceInput.value });
  }

  function updateSplitModeUI(mode) {
    currentSplitMode = mode;
    const splitContainer = document.querySelector('.split-container');
    const outputSections = [
      document.getElementById('output3-section'),
      document.getElementById('output4-section'),
      document.getElementById('output5-section'),
      document.getElementById('output6-section'),
      document.getElementById('output7-section'),
      document.getElementById('output8-section'),
      document.getElementById('output9-section'),
      document.getElementById('output10-section')
    ];
    const splitModeButtons = document.querySelectorAll('.split-mode-button');

    splitContainer.classList.remove('split-2', 'split-3', 'split-4', 'split-5', 'split-6', 'split-7', 'split-8', 'split-9', 'split-10');
    splitContainer.classList.add(`split-${mode}`);

    splitModeButtons.forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-split-mode')) === mode);
    });

    outputSections.forEach((section, index) => {
      if (section) {
        section.style.display = mode > index + 2 ? 'block' : 'none';
      }
    });

    ['split-input-text', 'output1-text', 'output2-text', 'output3-text', 'output4-text',
     'output5-text', 'output6-text', 'output7-text', 'output8-text', 'output9-text', 'output10-text'].forEach(id => {
      const textarea = document.getElementById(id);
      if (textarea) {
        textarea.value = '';
        const counterId = id === 'split-input-text' ? 'split-input-word-count' : `${id}-word-count`;
        updateWordCount(id, counterId);
      }
    });
    console.log(`Đã reset bộ đếm từ về "Words: 0" cho tất cả các ô khi chuyển sang chế độ Chia ${mode}`);
    saveInputState();
  }

  function attachButtonEvents() {
    const buttons = {
      facebookLink: document.getElementById('facebook-link'),
      matchCaseButton: document.getElementById('match-case'),
      deleteModeButton: document.getElementById('delete-mode'),
      renameModeButton: document.getElementById('rename-mode'),
      addModeButton: document.getElementById('add-mode'),
      copyModeButton: document.getElementById('copy-mode'),
      modeSelect: document.getElementById('mode-select'),
      addPairButton: document.getElementById('add-pair'),
      saveSettingsButton: document.getElementById('save-settings'),
      replaceButton: document.getElementById('replace-button'),
      copyButton: document.getElementById('copy-button'),
      splitButton: document.getElementById('split-button'),
      copyButton1: document.getElementById('copy-button1'),
      copyButton2: document.getElementById('copy-button2'),
      copyButton3: document.getElementById('copy-button3'),
      copyButton4: document.getElementById('copy-button4'),
      copyButton5: document.getElementById('copy-button5'),
      copyButton6: document.getElementById('copy-button6'),
      copyButton7: document.getElementById('copy-button7'),
      copyButton8: document.getElementById('copy-button8'),
      copyButton9: document.getElementById('copy-button9'),
      copyButton10: document.getElementById('copy-button10'),
      inputText: document.getElementById('input-text'),
      outputText: document.getElementById('output-text'),
      splitInputText: document.getElementById('split-input-text'),
      output1Text: document.getElementById('output1-text'),
      output2Text: document.getElementById('output2-text'),
      output3Text: document.getElementById('output3-text'),
      output4Text: document.getElementById('output4-text'),
      output5Text: document.getElementById('output5-text'),
      output6Text: document.getElementById('output6-text'),
      output7Text: document.getElementById('output7-text'),
      output8Text: document.getElementById('output8-text'),
      output9Text: document.getElementById('output9-text'),
      output10Text: document.getElementById('output10-text'),
      exportSettings: document.getElementById('export-settings'),
      importSettings: document.getElementById('import-settings')
    };

    if (buttons.facebookLink) {
      buttons.facebookLink.addEventListener('click', () => {
        console.log('Đã nhấp vào liên kết Gia hạn tài khoản');
      });
    } else {
      console.error('Không tìm thấy liên kết Gia hạn tài khoản');
    }

    if (buttons.matchCaseButton) {
      buttons.matchCaseButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Match Case');
        matchCaseEnabled = !matchCaseEnabled;
        updateButtonStates();
        saveSettings();
      });
    } else {
      console.error('Không tìm thấy nút Match Case');
    }

    if (buttons.deleteModeButton) {
      buttons.deleteModeButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Xóa Chế Độ');
        if (currentMode !== 'default') {
          if (confirm(`Bạn có chắc chắn muốn xóa chế độ "${currentMode}"?`)) {
            let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
            if (settings.modes[currentMode]) {
              delete settings.modes[currentMode];
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
              currentMode = 'default';
              loadModes();
              showNotification(translations[currentLang].modeDeleted.replace('{mode}', currentMode), 'success');
            }
          }
        }
      });
    } else {
      console.error('Không tìm thấy nút Xóa Chế Độ');
    }

    if (buttons.renameModeButton) {
      buttons.renameModeButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Đổi Tên Chế Độ');
        const newName = prompt(translations[currentLang].renamePrompt);
        if (newName && !newName.includes('mode_') && newName.trim() !== '' && newName !== currentMode) {
          let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
          if (settings.modes[currentMode]) {
            settings.modes[newName] = settings.modes[currentMode];
            delete settings.modes[currentMode];
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
            currentMode = newName;
            loadModes();
            showNotification(translations[currentLang].renameSuccess.replace('{mode}', newName), 'success');
          } else {
            showNotification(translations[currentLang].renameError, 'error');
          }
        }
      });
    } else {
      console.error('Không tìm thấy nút Đổi Tên Chế Độ');
    }

    if (buttons.addModeButton) {
      buttons.addModeButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Thêm Chế Độ');
        const newMode = prompt(translations[currentLang].newModePrompt);
        if (newMode && !newMode.includes('mode_') && newMode.trim() !== '' && newMode !== 'default') {
          let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
          if (settings.modes[newMode]) {
            showNotification(translations[currentLang].invalidModeName, 'error');
            return;
          }
          settings.modes[newMode] = { pairs: [], matchCase: false };
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
          currentMode = newMode;
          loadModes();
          showNotification(translations[currentLang].modeCreated.replace('{mode}', newMode), 'success');
        } else {
          showNotification(translations[currentLang].invalidModeName, 'error');
        }
      });
    } else {
      console.error('Không tìm thấy nút Thêm Chế Độ');
    }

    if (buttons.copyModeButton) {
      buttons.copyModeButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Sao Chép Chế Độ');
        const newMode = prompt(translations[currentLang].newModePrompt);
        if (newMode && !newMode.includes('mode_') && newMode.trim() !== '' && newMode !== 'default') {
          let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
          if (settings.modes[newMode]) {
            showNotification(translations[currentLang].invalidModeName, 'error');
            return;
          }
          settings.modes[newMode] = JSON.parse(JSON.stringify(settings.modes[currentMode] || { pairs: [], matchCase: false }));
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
          currentMode = newMode;
          loadModes();
          showNotification(translations[currentLang].modeCreated.replace('{mode}', newMode), 'success');
        } else {
          showNotification(translations[currentLang].invalidModeName, 'error');
        }
      });
    } else {
      console.error('Không tìm thấy nút Sao Chép Chế Độ');
    }

    if (buttons.modeSelect) {
      buttons.modeSelect.addEventListener('change', (e) => {
        console.log('Chế độ đã thay đổi thành:', e.target.value);
        currentMode = e.target.value;
        loadSettings();
        showNotification(translations[currentLang].switchedMode.replace('{mode}', currentMode), 'success');
        updateModeButtons();
      });
    } else {
      console.error('Không tìm thấy phần tử chọn chế độ');
    }

    if (buttons.addPairButton) {
      buttons.addPairButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Thêm Cặp');
        addPair();
      });
    } else {
      console.error('Không tìm thấy nút Thêm Cặp');
    }

    if (buttons.saveSettingsButton) {
      buttons.saveSettingsButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Lưu Cài Đặt');
        saveSettings();
      });
    } else {
      console.error('Không tìm thấy nút Lưu Cài Đặt');
    }

    if (buttons.inputText) {
      buttons.inputText.addEventListener('input', () => {
        updateWordCount('input-text', 'input-word-count');
        saveInputState();
      });
    }

    if (buttons.outputText) {
      buttons.outputText.addEventListener('input', () => {
        updateWordCount('output-text', 'output-word-count');
        saveInputState();
      });
    }

    ['split-input-text', 'output1-text', 'output2-text', 'output3-text', 'output4-text',
     'output5-text', 'output6-text', 'output7-text', 'output8-text', 'output9-text', 'output10-text'].forEach(id => {
      const textarea = document.getElementById(id);
      if (textarea) {
        textarea.addEventListener('input', () => {
          const counterId = id === 'split-input-text' ? 'split-input-word-count' : `${id}-word-count`;
          updateWordCount(id, counterId);
          saveInputState();
        });
      }
    });

    if (buttons.replaceButton) {
      buttons.replaceButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Thay thế');
        const inputTextArea = document.getElementById('input-text');
        if (!inputTextArea || !inputTextArea.value) {
          showNotification(translations[currentLang].noTextToReplace, 'error');
          return;
        }

        let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
        const modeSettings = settings.modes[currentMode] || { pairs: [], matchCase: false };
        const pairs = modeSettings.pairs || [];
        if (pairs.length === 0) {
          showNotification(translations[currentLang].noPairsConfigured, 'error');
          return;
        }

        const outputText = replaceText(inputTextArea.value, pairs, modeSettings.matchCase);

        const outputTextArea = document.getElementById('output-text');
        if (outputTextArea) {
          outputTextArea.value = outputText;
          inputTextArea.value = '';
          updateWordCount('input-text', 'input-word-count');
          updateWordCount('output-text', 'output-word-count');
          showNotification(translations[currentLang].textReplaced, 'success');
          saveInputState();
        } else {
          console.error('Không tìm thấy khu vực văn bản đầu ra');
        }
      });
    } else {
      console.error('Không tìm thấy nút Thay thế');
    }

    if (buttons.copyButton) {
      buttons.copyButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Sao chép');
        const outputTextArea = document.getElementById('output-text');
        if (outputTextArea && outputTextArea.value) {
          navigator.clipboard.writeText(outputTextArea.value).then(() => {
            console.log('Đã sao chép văn bản vào clipboard');
            showNotification(translations[currentLang].textCopied, 'success');
          }).catch(err => {
            console.error('Không thể sao chép văn bản: ', err);
            showNotification(translations[currentLang].failedToCopy, 'error');
          });
        } else {
          showNotification(translations[currentLang].noTextToCopy, 'error');
        }
      });
    } else {
      console.error('Không tìm thấy nút Sao chép');
    }

    if (buttons.splitButton) {
      buttons.splitButton.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Chia Chương');
        const inputTextArea = document.getElementById('split-input-text');
        const outputTextAreas = [
          document.getElementById('output1-text'),
          document.getElementById('output2-text'),
          document.getElementById('output3-text'),
          document.getElementById('output4-text'),
          document.getElementById('output5-text'),
          document.getElementById('output6-text'),
          document.getElementById('output7-text'),
          document.getElementById('output8-text'),
          document.getElementById('output9-text'),
          document.getElementById('output10-text')
        ].slice(0, currentSplitMode);

        if (!inputTextArea || !inputTextArea.value) {
          showNotification(translations[currentLang].noTextToSplit, 'error');
          return;
        }

        let text = inputTextArea.value;
        let chapterNum = 1;
        let chapterTitle = '';

        const chapterRegex = /^[Cc]hương\s+(\d+)(?::\s*(.*))?$/m;
        const lines = text.split('\n');
        let contentStartIndex = 0;

        const firstLine = lines[0].trim();
        const match = firstLine.match(chapterRegex);
        if (match) {
          chapterNum = parseInt(match[1]);
          chapterTitle = match[2] ? `: ${match[2]}` : '';
          contentStartIndex = 1;
        }

        const content = lines.slice(contentStartIndex).join('\n');
        const paragraphs = content.split('\n').filter(p => p.trim());
        const totalWords = countWords(content);
        const wordsPerPart = Math.floor(totalWords / currentSplitMode);

        let parts = [];
        let wordCount = 0;
        let startIndex = 0;

        for (let i = 0; i < paragraphs.length; i++) {
          const wordsInParagraph = countWords(paragraphs[i]);
          wordCount += wordsInParagraph;
          if (parts.length < currentSplitMode - 1 && wordCount >= wordsPerPart * (parts.length + 1)) {
            parts.push(paragraphs.slice(startIndex, i + 1).join('\n\n'));
            startIndex = i + 1;
          }
        }
        parts.push(paragraphs.slice(startIndex).join('\n\n'));

        outputTextAreas.forEach((textarea, index) => {
          if (textarea) {
            const newChapterTitle = `Chương ${chapterNum}.${index + 1}${chapterTitle}`;
            textarea.value = `${newChapterTitle}\n\n${parts[index] || ''}`;
            updateWordCount(`output${index + 1}-text`, `output${index + 1}-word-count`);
          }
        });

        inputTextArea.value = '';
        updateWordCount('split-input-text', 'split-input-word-count');
        showNotification(translations[currentLang].splitSuccess, 'success');
        saveInputState();
      });
    } else {
      console.error('Không tìm thấy nút Chia Chương');
    }

    for (let i = 1; i <= 10; i++) {
      const copyButton = buttons[`copyButton${i}`];
      if (copyButton) {
        copyButton.addEventListener('click', () => {
          console.log(`Đã nhấp vào nút Sao chép ${i}`);
          const outputTextArea = document.getElementById(`output${i}-text`);
          if (outputTextArea && outputTextArea.value) {
            navigator.clipboard.writeText(outputTextArea.value).then(() => {
              console.log(`Đã sao chép văn bản từ output${i}`);
              showNotification(translations[currentLang].textCopied, 'success');
            }).catch(err => {
              console.error(`Không thể sao chép văn bản từ output${i}: `, err);
              showNotification(translations[currentLang].failedToCopy, 'error');
            });
          } else {
            showNotification(translations[currentLang].noTextToCopy, 'error');
          }
        });
      } else {
        console.error(`Không tìm thấy nút Sao chép ${i}`);
      }
    }

    if (buttons.exportSettings) {
      buttons.exportSettings.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Xuất Cài Đặt');
        try {
          let settings = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)) || { modes: { default: { pairs: [], matchCase: false } } };
          const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'extension_settings.json';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showNotification(translations[currentLang].settingsExported, 'success');
        } catch (err) {
          console.error('Lỗi khi xuất cài đặt:', err);
          showNotification(translations[currentLang].importError, 'error');
        }
      });
    } else {
      console.error('Không tìm thấy nút Xuất Cài Đặt (ID: export-settings)');
    }

    // ==================== IMPORT SETTINGS (ĐÃ SỬA) ====================
    if (buttons.importSettings) {
      buttons.importSettings.addEventListener('click', () => {
        console.log('Đã nhấp vào nút Nhập Cài Đặt');
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (event) => {
          const file = event.target.files[0];
          if (!file) {
            showNotification(translations[currentLang].importError, 'error');
            return;
          }

          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              // Loại bỏ BOM nếu có
              let text = e.target.result;
              if (text.charCodeAt(0) === 0xFEFF) {
                text = text.slice(1);
              }

              const settings = JSON.parse(text);

              // Kiểm tra cấu trúc an toàn
              if (!settings || typeof settings !== 'object' || !settings.modes || typeof settings.modes !== 'object') {
                throw new Error('File JSON không hợp lệ hoặc không chứa cài đặt');
              }

              // Đảm bảo mỗi mode có cấu trúc đúng
              Object.keys(settings.modes).forEach(modeName => {
                if (!settings.modes[modeName].pairs) {
                  settings.modes[modeName].pairs = [];
                }
                if (typeof settings.modes[modeName].matchCase !== 'boolean') {
                  settings.modes[modeName].matchCase = false;
                }
              });

              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
              loadModes();
              showNotification(translations[currentLang].settingsImported, 'success');
            } catch (err) {
              console.error('Lỗi khi nhập cài đặt:', err);
              showNotification(translations[currentLang].importError, 'error');
            }
          };

          reader.onerror = () => {
            console.error('Lỗi khi đọc file');
            showNotification(translations[currentLang].importError, 'error');
          };

          reader.readAsText(file, 'UTF-8');
        };

        input.click();
      });
    } else {
      console.error('Không tìm thấy nút Nhập Cài Đặt (ID: import-settings)');
    }
    // =================================================================

    // Gắn sự kiện cho các nút tab
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log(`Đã nhấp vào tab: ${button.getAttribute('data-tab')}`);
        const tabName = button.getAttribute('data-tab');
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
          content.classList.toggle('active', content.id === tabName);
        });
        tabButtons.forEach(btn => {
          btn.classList.toggle('active', btn === button);
        });
      });
    });

    // Gắn sự kiện cho các nút split mode
    const splitModeButtons = document.querySelectorAll('.split-mode-button');
    splitModeButtons.forEach(button => {
      button.addEventListener('click', () => {
        console.log(`Đã chọn chế độ chia: ${button.getAttribute('data-split-mode')}`);
        const mode = parseInt(button.getAttribute('data-split-mode'));
        updateSplitModeUI(mode);
      });
    });
  }

  // Khởi tạo ứng dụng
  function init() {
    console.log('Khởi tạo ứng dụng');
    updateLanguage('vn');
    loadModes();
    updateSplitModeUI(currentSplitMode);
    attachButtonEvents();
    restoreInputState();
  }

  init();
});
