(function () {
  let editMode = false;
  let selected = null;
  let dragging = false;
  let resizing = false;
  let dragOffset = { x: 0, y: 0 };
  let resizeStart = { w: 0, h: 0, x: 0, y: 0 };

  const toggleBtn = document.getElementById('edit-toggle');
  const panel = document.getElementById('editor-panel');
  const siteContent = document.getElementById('site-content');
  const mediaSection = document.querySelector('.media-section');
  const heroH1 = document.querySelector('.hero h1');

  const inputTitle = document.getElementById('ed-title');
  const inputFilename = document.getElementById('ed-filename');
  const inputWidth = document.getElementById('ed-width');
  const inputHeight = document.getElementById('ed-height');
  const inputFont = document.getElementById('ed-font');
  const inputFontSize = document.getElementById('ed-fontsize');
  const inputHeroText = document.getElementById('ed-hero');
  const btnAddItem = document.getElementById('ed-add');
  const btnAddText = document.getElementById('ed-add-text');
  const btnDeleteItem = document.getElementById('ed-delete');
  const btnReset = document.getElementById('ed-reset');
  const heroAlignGroup = document.getElementById('ed-hero-align');
  const mediaControls = document.getElementById('ed-media-controls');
  const textControls = document.getElementById('ed-text-controls');
  const inputTextContent = document.getElementById('ed-text-content');
  const inputTextFont = document.getElementById('ed-text-font');
  const inputTextSize = document.getElementById('ed-text-size');
  const inputTextColor = document.getElementById('ed-text-color');
  const textAlignGroup = document.getElementById('ed-text-align');
  const inputDescription = document.getElementById('ed-description');
  const lightbox = document.getElementById('lightbox');
  const lightboxMedia = document.getElementById('lightbox-media');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxFilename = document.getElementById('lightbox-filename');
  const lightboxClose = document.getElementById('lightbox-close');

  function getScale() { return 1; }

  // --- Layout switch (ПК / Телефон) ---
  var btnLayoutPC = document.getElementById('ed-layout-pc');
  var btnLayoutPhone = document.getElementById('ed-layout-phone');
  var currentLayout = 'pc';

  // Сохранить текущие позиции/размеры DOM-элементов в data-атрибуты текущего layout
  function storePositionsToData(layout) {
    var p = layout; // 'pc' or 'phone'
    mediaSection.querySelectorAll('.media-wrapper').forEach(function (w) {
      var item = w.querySelector('.media-item');
      w.dataset[p + 'Position'] = w.style.position || '';
      w.dataset[p + 'Left'] = w.style.left || '';
      w.dataset[p + 'Top'] = w.style.top || '';
      w.dataset[p + 'Width'] = w.style.width || '';
      w.dataset[p + 'Transform'] = w.style.transform || '';
      w.dataset[p + 'ItemWidth'] = item ? (item.style.width || '') : '';
      w.dataset[p + 'ItemHeight'] = item ? (item.style.height || '') : '';
      w.dataset[p + 'ItemMinHeight'] = item ? (item.style.minHeight || '') : '';
    });
    mediaSection.querySelectorAll('.text-block').forEach(function (b) {
      b.dataset[p + 'Left'] = b.style.left || '';
      b.dataset[p + 'Top'] = b.style.top || '';
      b.dataset[p + 'Width'] = b.style.width || '';
      b.dataset[p + 'Height'] = b.style.height || '';
    });
  }

  // Загрузить позиции/размеры из data-атрибутов layout в DOM стили
  function loadPositionsFromData(layout) {
    var p = layout;
    mediaSection.querySelectorAll('.media-wrapper').forEach(function (w) {
      var item = w.querySelector('.media-item');
      w.style.position = w.dataset[p + 'Position'] || '';
      w.style.left = w.dataset[p + 'Left'] || '';
      w.style.top = w.dataset[p + 'Top'] || '';
      w.style.width = w.dataset[p + 'Width'] || '';
      w.style.transform = w.dataset[p + 'Transform'] || '';
      if (item) {
        item.style.width = w.dataset[p + 'ItemWidth'] || '';
        item.style.height = w.dataset[p + 'ItemHeight'] || '';
        item.style.minHeight = w.dataset[p + 'ItemMinHeight'] || '';
      }
    });
    mediaSection.querySelectorAll('.text-block').forEach(function (b) {
      b.style.left = b.dataset[p + 'Left'] || '';
      b.style.top = b.dataset[p + 'Top'] || '';
      b.style.width = b.dataset[p + 'Width'] || '';
      b.style.height = b.dataset[p + 'Height'] || '';
    });
  }

  function setLayout(layout, skipStore) {
    if (!skipStore) {
      storePositionsToData(currentLayout);
    }
    currentLayout = layout;
    if (layout === 'phone') {
      mediaSection.classList.add('phone-layout');
      btnLayoutPC.classList.remove('active');
      btnLayoutPhone.classList.add('active');
    } else {
      mediaSection.classList.remove('phone-layout');
      btnLayoutPC.classList.add('active');
      btnLayoutPhone.classList.remove('active');
    }
    loadPositionsFromData(layout);
  }

  btnLayoutPC.addEventListener('click', function () {
    if (currentLayout === 'pc') return;
    deselect();
    setLayout('pc');
    saveState();
  });

  btnLayoutPhone.addEventListener('click', function () {
    if (currentLayout === 'phone') return;
    deselect();
    setLayout('phone');
    saveState();
  });

  // --- Пароль ---
  var EDITOR_HASH = '2e0239faa7f60000af9320e200006f7a';
  var authenticated = false;

  function hashPassword(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      var ch = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + ch;
      hash |= 0;
    }
    var hex = (hash >>> 0).toString(16);
    while (hex.length < 8) hex = '0' + hex;
    // Дополнительный хеш для надёжности
    var hash2 = 1;
    for (var j = 0; j < str.length; j++) {
      hash2 = Math.imul(hash2 * 31, str.charCodeAt(j)) | 0;
    }
    var hex2 = (hash2 >>> 0).toString(16);
    while (hex2.length < 8) hex2 = '0' + hex2;
    return hex + hex2 + hex.split('').reverse().join('') + hex2.split('').reverse().join('');
  }

  // --- Password modal ---
  var passwordModal = document.getElementById('password-modal');
  var passwordInput = document.getElementById('password-input');
  var githubTokenInput = document.getElementById('github-token-input');
  var passwordError = document.getElementById('password-error');
  var passwordSubmit = document.getElementById('password-submit');
  var passwordCancel = document.getElementById('password-cancel');
  var githubToken = localStorage.getItem('gh-token') || '';
  var yosAccessKeyInput = document.getElementById('yos-access-key');
  var yosSecretKeyInput = document.getElementById('yos-secret-key');
  var yosAccessKey = localStorage.getItem('yos-access-key') || '';
  var yosSecretKey = localStorage.getItem('yos-secret-key') || '';

  function showPasswordModal() {
    passwordInput.value = '';
    githubTokenInput.value = githubToken;
    yosAccessKeyInput.value = yosAccessKey;
    yosSecretKeyInput.value = yosSecretKey;
    passwordError.textContent = '';
    passwordModal.style.display = 'flex';
    setTimeout(function () { passwordInput.focus(); }, 50);
  }

  function hidePasswordModal() {
    passwordModal.style.display = 'none';
  }

  function tryPassword() {
    var pwd = passwordInput.value;
    if (!pwd) return;
    if (hashPassword(pwd) !== EDITOR_HASH) {
      passwordError.textContent = 'Неверный пароль';
      passwordInput.classList.add('shake');
      setTimeout(function () { passwordInput.classList.remove('shake'); }, 400);
      passwordInput.select();
      return;
    }
    authenticated = true;
    // Сохранить GitHub токен
    var token = githubTokenInput.value.trim();
    if (token) {
      githubToken = token;
      localStorage.setItem('gh-token', token);
    }
    // Сохранить YOS ключи
    var ak = yosAccessKeyInput.value.trim();
    var sk = yosSecretKeyInput.value.trim();
    if (ak) { yosAccessKey = ak; localStorage.setItem('yos-access-key', ak); }
    if (sk) { yosSecretKey = sk; localStorage.setItem('yos-secret-key', sk); }
    hidePasswordModal();
    enterEditMode();
  }

  passwordSubmit.addEventListener('click', tryPassword);
  passwordInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryPassword();
    if (e.key === 'Escape') hidePasswordModal();
  });
  githubTokenInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryPassword();
  });
  yosAccessKeyInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryPassword();
  });
  yosSecretKeyInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') tryPassword();
  });
  passwordCancel.addEventListener('click', hidePasswordModal);
  passwordModal.addEventListener('click', function (e) {
    if (e.target === passwordModal) hidePasswordModal();
  });

  function enterEditMode() {
    editMode = true;
    document.body.classList.add('edit-mode');
    toggleBtn.textContent = 'Выйти из редактора';
    panel.style.display = 'flex';
  }

  // --- Toggle ---
  toggleBtn.addEventListener('click', function () {
    if (!editMode && !authenticated) {
      showPasswordModal();
      return;
    }
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    toggleBtn.textContent = editMode ? 'Выйти из редактора' : 'Редактировать';
    panel.style.display = editMode ? 'flex' : 'none';
    if (!editMode) {
      deselect();
      // При выходе из редактора — показать layout для текущего устройства
      storePositionsToData(currentLayout);
      var deviceLayout = window.innerWidth <= 768 ? 'phone' : 'pc';
      loadPositionsFromData(deviceLayout);
      if (deviceLayout === 'phone') {
        mediaSection.classList.add('phone-layout');
      } else {
        mediaSection.classList.remove('phone-layout');
      }
      saveState();
    }
  });

  // --- Helpers ---
  function isTextBlock(el) {
    return el && el.classList.contains('text-block');
  }

  function isMediaWrapper(el) {
    return el && el.classList.contains('media-wrapper');
  }

  // --- Select ---
  function selectItem(el) {
    deselect();
    selected = el;
    selected.classList.add('selected');
    updatePanel();
  }

  function deselect() {
    if (selected) selected.classList.remove('selected');
    selected = null;
    updatePanel();
  }

  function updatePanel() {
    mediaControls.style.display = 'none';
    textControls.style.display = 'none';
    btnDeleteItem.disabled = true;
    inputWidth.value = '';
    inputHeight.value = '';

    if (!selected) return;
    btnDeleteItem.disabled = false;

    if (isTextBlock(selected)) {
      textControls.style.display = 'block';
      inputTextContent.value = selected.textContent;
      inputTextFont.value = selected.style.fontFamily ? selected.style.fontFamily.split(',')[0].replace(/['"]/g, '').trim() : 'Arial';
      inputTextSize.value = parseInt(selected.style.fontSize) || 16;
      inputTextColor.value = rgbToHex(selected.style.color || '#ffffff');
      setAlignActive(textAlignGroup, selected.style.textAlign || 'left');
      inputWidth.value = selected.offsetWidth;
      inputHeight.value = selected.offsetHeight;
    } else if (isMediaWrapper(selected)) {
      mediaControls.style.display = 'block';
      var label = selected.querySelector('.label');
      var filename = selected.querySelector('.filename');
      var item = selected.querySelector('.media-item');
      inputTitle.value = label ? label.textContent : '';
      inputFilename.value = filename ? filename.textContent : '';
      inputDescription.value = selected.dataset.description || '';
      inputWidth.value = item ? item.offsetWidth : '';
      inputHeight.value = item ? item.offsetHeight : '';
    }
  }

  // --- Hero alignment ---
  heroAlignGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-align]');
    if (!btn) return;
    setAlignActive(heroAlignGroup, btn.dataset.align);
    heroH1.style.textAlign = btn.dataset.align;
    saveState();
  });

  function setAlignActive(group, align) {
    group.querySelectorAll('button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.align === align);
    });
  }

  // --- Mouse events ---
  document.addEventListener('mousedown', function (e) {
    if (!editMode) return;
    if (e.target.closest('.upload-btn') || e.target.classList.contains('cell-file-input')) return;

    var wrapper = e.target.closest('.media-wrapper');
    var textBlock = e.target.closest('.text-block');
    var target = textBlock || wrapper;

    if (target) {
      e.preventDefault();
      selectItem(target);

      if (e.target.classList.contains('resize-handle')) {
        resizing = true;
        if (isTextBlock(target)) {
          resizeStart = { w: target.offsetWidth, h: target.offsetHeight, x: e.clientX, y: e.clientY };
        } else {
          var item = target.querySelector('.media-item');
          resizeStart = { w: item.offsetWidth, h: item.offsetHeight, x: e.clientX, y: e.clientY };
        }
        return;
      }

      if (isMediaWrapper(target) && target.style.position !== 'absolute') {
        target.style.width = target.offsetWidth + 'px';
      }

      dragging = true;
      var rect = target.getBoundingClientRect();
      var scale = getScale();
      dragOffset.x = (e.clientX - rect.left) / scale;
      dragOffset.y = (e.clientY - rect.top) / scale;
      return;
    }

    if (!e.target.closest('#editor-panel') && !e.target.closest('#edit-toggle')) {
      deselect();
    }
  });

  document.addEventListener('mousemove', function (e) {
    if (!editMode || !selected) return;
    var scale = getScale();

    if (dragging) {
      e.preventDefault();
      var parentRect = mediaSection.getBoundingClientRect();
      var x = (e.clientX - parentRect.left) / scale - dragOffset.x;
      var y = (e.clientY - parentRect.top) / scale - dragOffset.y;
      x = Math.max(0, Math.min(x, mediaSection.offsetWidth - selected.offsetWidth));
      y = Math.max(0, y);
      selected.style.position = 'absolute';
      selected.style.left = x + 'px';
      selected.style.top = y + 'px';
      if (isMediaWrapper(selected)) {
        selected.style.transform = 'none';
      }
    }

    if (resizing) {
      e.preventDefault();
      var dw = (e.clientX - resizeStart.x) / scale;
      var dh = (e.clientY - resizeStart.y) / scale;
      var newW = Math.max(80, resizeStart.w + dw);
      var newH = Math.max(40, resizeStart.h + dh);

      if (isTextBlock(selected)) {
        selected.style.width = newW + 'px';
        selected.style.height = newH + 'px';
      } else {
        var item = selected.querySelector('.media-item');
        item.style.width = newW + 'px';
        item.style.height = newH + 'px';
        item.style.minHeight = newH + 'px';
        selected.style.width = newW + 'px';
      }
      inputWidth.value = Math.round(newW);
      inputHeight.value = Math.round(newH);
    }
  });

  document.addEventListener('mouseup', function () {
    if (dragging || resizing) {
      dragging = false;
      resizing = false;
      updateSectionHeight();
      saveState();
    }
  });

  function updateSectionHeight() {
    var maxBottom = 0;
    mediaSection.querySelectorAll('.media-wrapper, .text-block').forEach(function (el) {
      var bottom = el.offsetTop + el.offsetHeight;
      if (bottom > maxBottom) maxBottom = bottom;
    });
    mediaSection.style.minHeight = (maxBottom + 120) + 'px';
  }

  // --- Panel: media controls ---
  inputTitle.addEventListener('input', function () {
    if (!selected || !isMediaWrapper(selected)) return;
    var label = selected.querySelector('.label');
    if (label) label.textContent = inputTitle.value;
  });

  inputFilename.addEventListener('input', function () {
    if (!selected || !isMediaWrapper(selected)) return;
    var filename = selected.querySelector('.filename');
    if (filename) filename.textContent = inputFilename.value;
  });

  inputDescription.addEventListener('input', function () {
    if (!selected || !isMediaWrapper(selected)) return;
    selected.dataset.description = inputDescription.value;
    saveState();
  });

  // --- Panel: text controls ---
  inputTextContent.addEventListener('input', function () {
    if (!selected || !isTextBlock(selected)) return;
    var handle = selected.querySelector('.resize-handle');
    selected.textContent = inputTextContent.value;
    if (handle) selected.appendChild(handle);
    saveState();
  });

  inputTextFont.addEventListener('change', function () {
    if (!selected || !isTextBlock(selected)) return;
    selected.style.fontFamily = inputTextFont.value + ', sans-serif';
    saveState();
  });

  inputTextSize.addEventListener('change', function () {
    if (!selected || !isTextBlock(selected)) return;
    selected.style.fontSize = inputTextSize.value + 'px';
    saveState();
  });

  inputTextColor.addEventListener('input', function () {
    if (!selected || !isTextBlock(selected)) return;
    selected.style.color = inputTextColor.value;
    saveState();
  });

  textAlignGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-align]');
    if (!btn || !selected || !isTextBlock(selected)) return;
    setAlignActive(textAlignGroup, btn.dataset.align);
    selected.style.textAlign = btn.dataset.align;
    saveState();
  });

  // --- Panel: shared size controls ---
  inputWidth.addEventListener('change', function () {
    if (!selected) return;
    if (isTextBlock(selected)) {
      selected.style.width = inputWidth.value + 'px';
    } else {
      var item = selected.querySelector('.media-item');
      item.style.width = inputWidth.value + 'px';
      selected.style.width = inputWidth.value + 'px';
    }
    saveState();
  });

  inputHeight.addEventListener('change', function () {
    if (!selected) return;
    if (isTextBlock(selected)) {
      selected.style.height = inputHeight.value + 'px';
    } else {
      var item = selected.querySelector('.media-item');
      item.style.height = inputHeight.value + 'px';
      item.style.minHeight = inputHeight.value + 'px';
    }
    saveState();
  });

  // --- Panel: global ---
  inputFont.addEventListener('change', function () {
    document.body.style.fontFamily = inputFont.value + ', sans-serif';
    saveState();
  });

  inputFontSize.addEventListener('change', function () {
    heroH1.style.fontSize = inputFontSize.value + 'px';
    saveState();
  });

  inputHeroText.addEventListener('input', function () {
    heroH1.innerHTML = inputHeroText.value.replace(/\n/g, '<br>');
    saveState();
  });

  // --- Add media ---
  btnAddItem.addEventListener('click', function () {
    var wrapper = document.createElement('div');
    wrapper.className = 'media-wrapper';
    wrapper.innerHTML =
      '<div class="media-item">' +
        '<span class="icon">&#128247;</span>' +
        '<span class="label">фото</span>' +
      '</div>' +
      '<span class="filename">новое_фото.png</span>';
    addResizeHandle(wrapper);
    addUploadButton(wrapper);
    mediaSection.appendChild(wrapper);
    selectItem(wrapper);
    saveState();
  });

  // --- Add text block ---
  btnAddText.addEventListener('click', function () {
    var block = document.createElement('div');
    block.className = 'text-block';
    block.textContent = 'Текст';
    block.style.position = 'absolute';
    block.style.left = '40px';
    block.style.top = '40px';
    block.style.width = '200px';
    block.style.fontSize = '16px';
    block.style.color = '#ffffff';
    block.style.fontFamily = 'Arial, sans-serif';
    block.style.textAlign = 'left';
    var handle = document.createElement('div');
    handle.className = 'resize-handle';
    block.appendChild(handle);
    mediaSection.appendChild(block);
    selectItem(block);
    saveState();
  });

  // --- Delete ---
  btnDeleteItem.addEventListener('click', function () {
    if (!selected) return;
    selected.remove();
    selected = null;
    updatePanel();
    saveState();
  });

  // --- Reset ---
  btnReset.addEventListener('click', function () {
    if (confirm('Сбросить все изменения? Вернуть сайт к исходному виду?')) {
      localStorage.removeItem('portfolio-state');
      if (githubToken) {
        // Удаляем state.json из репо
        fetch(ghApiUrl('data/state.json'), { headers: ghHeaders() })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (f) {
            if (f && f.sha) {
              return fetch(ghApiUrl('data/state.json'), {
                method: 'DELETE',
                headers: ghHeaders(),
                body: JSON.stringify({ message: 'Reset state', sha: f.sha, branch: GITHUB_BRANCH })
              });
            }
          }).catch(function () {});
      }
      location.reload();
    }
  });

  // --- GitHub API helpers ---
  function ghApiUrl(path) {
    return 'https://api.github.com/repos/' + GITHUB_REPO + '/contents/' + path;
  }

  function ghHeaders() {
    return {
      'Authorization': 'token ' + githubToken,
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.github.v3+json'
    };
  }

  // Загрузить файл в репозиторий через GitHub API
  function ghUploadFile(path, base64Content, message) {
    // Сначала проверяем существует ли файл (для получения sha)
    return fetch(ghApiUrl(path), { headers: ghHeaders() })
      .then(function (res) {
        if (res.ok) return res.json();
        return null;
      })
      .then(function (existing) {
        var body = {
          message: message || 'Upload ' + path,
          content: base64Content,
          branch: GITHUB_BRANCH
        };
        if (existing && existing.sha) {
          body.sha = existing.sha;
        }
        return fetch(ghApiUrl(path), {
          method: 'PUT',
          headers: ghHeaders(),
          body: JSON.stringify(body)
        });
      })
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub upload failed: ' + res.status);
        return res.json();
      });
  }

  // --- Yandex Object Storage (S3) helpers ---
  function yosHmac(key, msg) {
    return crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      .then(function (k) { return crypto.subtle.sign('HMAC', k, msg); });
  }

  function yosSha256(data) {
    return crypto.subtle.digest('SHA-256', data);
  }

  function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function yosUploadFile(fileName, arrayBuffer, contentType) {
    if (!YOS_BUCKET || !yosAccessKey || !yosSecretKey) {
      return Promise.reject(new Error('YOS not configured: bucket=' + YOS_BUCKET + ' ak=' + (yosAccessKey ? 'yes' : 'no') + ' sk=' + (yosSecretKey ? 'yes' : 'no')));
    }

    var region = 'ru-central1';
    var service = 's3';
    var host = YOS_BUCKET + '.storage.yandexcloud.net';
    var path = '/media/' + fileName;
    var method = 'PUT';

    var now = new Date();
    var dateStamp = now.toISOString().replace(/[-:]/g, '').slice(0, 8);
    var amzDate = dateStamp + 'T' + now.toISOString().replace(/[-:]/g, '').slice(9, 15) + 'Z';
    var credentialScope = dateStamp + '/' + region + '/' + service + '/aws4_request';

    var payloadBytes = new Uint8Array(arrayBuffer);

    return yosSha256(payloadBytes).then(function (payloadHash) {
      var payloadHashHex = bufToHex(payloadHash);

      var headers = {
        'content-type': contentType,
        'host': host,
        'x-amz-content-sha256': payloadHashHex,
        'x-amz-date': amzDate
      };

      var signedHeaderKeys = Object.keys(headers).sort();
      var signedHeaders = signedHeaderKeys.join(';');
      var canonicalHeaders = signedHeaderKeys.map(function (k) { return k + ':' + headers[k] + '\n'; }).join('');

      var canonicalRequest = method + '\n' + path + '\n' + '' + '\n' + canonicalHeaders + '\n' + signedHeaders + '\n' + payloadHashHex;

      return yosSha256(new TextEncoder().encode(canonicalRequest)).then(function (crHash) {
        var stringToSign = 'AWS4-HMAC-SHA256\n' + amzDate + '\n' + credentialScope + '\n' + bufToHex(crHash);
        var enc = new TextEncoder();

        return yosHmac(enc.encode('AWS4' + yosSecretKey), enc.encode(dateStamp))
          .then(function (k1) { return yosHmac(k1, enc.encode(region)); })
          .then(function (k2) { return yosHmac(k2, enc.encode(service)); })
          .then(function (k3) { return yosHmac(k3, enc.encode('aws4_request')); })
          .then(function (signingKey) { return yosHmac(signingKey, enc.encode(stringToSign)); })
          .then(function (sig) {
            var signature = bufToHex(sig);
            var auth = 'AWS4-HMAC-SHA256 Credential=' + yosAccessKey + '/' + credentialScope +
                       ', SignedHeaders=' + signedHeaders + ', Signature=' + signature;

            return fetch('https://' + host + path, {
              method: 'PUT',
              headers: {
                'Authorization': auth,
                'Content-Type': contentType,
                'x-amz-content-sha256': payloadHashHex,
                'x-amz-date': amzDate
              },
              body: payloadBytes
            });
          });
      });
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) { throw new Error('YOS upload failed: ' + res.status + ' ' + t); });
      }
      return 'https://' + host + path;
    }).catch(function (e) {
      alert('YOS debug: ' + e.message);
      throw e;
    });
  }

  // --- File upload ---
  function handleFileUpload(inputEl) {
    if (!inputEl.files.length) return;
    var file = inputEl.files[0];
    var ext = file.name.split('.').pop().toLowerCase();
    var isVideo = file.type.startsWith('video/');
    var mediaItem = inputEl.closest('.media-item');
    var wrapper = mediaItem.closest('.media-wrapper');

    var icon = mediaItem.querySelector('.icon');
    var lbl = mediaItem.querySelector('.label');
    if (icon) icon.style.display = 'none';
    if (lbl) lbl.style.display = 'none';

    var oldImg = mediaItem.querySelector('.preview-img');
    var oldVid = mediaItem.querySelector('.preview-video');
    if (oldImg) oldImg.remove();
    if (oldVid) oldVid.remove();

    mediaItem.classList.add('has-preview');

    // Показать превью сразу (blob URL)
    var objectUrl = URL.createObjectURL(file);
    showPreview(mediaItem, wrapper, objectUrl, isVideo);

    var filenameEl = wrapper ? wrapper.querySelector('.filename') : null;
    var baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    if (filenameEl) filenameEl.textContent = baseName + '.' + ext;
    if (lbl) lbl.textContent = isVideo ? 'видео' : 'фото';

    if (selected === wrapper) {
      inputFilename.value = baseName + '.' + ext;
      inputTitle.value = isVideo ? 'видео' : 'фото';
    }

    // Загрузка в Yandex Object Storage
    if (!yosAccessKey || !yosSecretKey || !YOS_BUCKET) {
      // Нет ключей YOS — сохраняем только локально как data URL
      var reader = new FileReader();
      reader.onload = function (ev) {
        wrapper.dataset.previewData = ev.target.result;
        wrapper.dataset.previewType = isVideo ? 'video' : 'image';
        saveState();
      };
      reader.readAsDataURL(file);
      inputEl.value = '';
      return;
    }

    var progressEl = document.createElement('div');
    progressEl.className = 'upload-progress';
    progressEl.textContent = 'Загрузка...';
    mediaItem.appendChild(progressEl);

    var reader = new FileReader();
    reader.onload = function (ev) {
      var arrayBuffer = ev.target.result;
      var uploadName = Date.now() + '_' + file.name;

      yosUploadFile(uploadName, arrayBuffer, file.type)
        .then(function (fileUrl) {
          progressEl.remove();
          wrapper.dataset.previewData = fileUrl;
          wrapper.dataset.previewType = isVideo ? 'video' : 'image';

          var curImg = mediaItem.querySelector('.preview-img');
          var curVid = mediaItem.querySelector('.preview-video');
          if (curImg) curImg.src = fileUrl;
          if (curVid) curVid.src = fileUrl;

          saveState();
        })
        .catch(function (err) {
          console.error('YOS Upload error:', err);
          alert('YOS ошибка: ' + err.message);
          progressEl.textContent = 'YOS ошибка, сохраняю локально...';
          setTimeout(function () { progressEl.remove(); }, 3000);
          // Fallback — сохраняем как data URL
          var fallbackReader = new FileReader();
          fallbackReader.onload = function (e2) {
            wrapper.dataset.previewData = e2.target.result;
            wrapper.dataset.previewType = isVideo ? 'video' : 'image';
            saveState();
            console.log('Fallback: saved as base64, length:', e2.target.result.length);
          };
          fallbackReader.readAsDataURL(file);
        });
    };
    reader.readAsArrayBuffer(file);

    inputEl.value = '';
  }

  function showPreview(mediaItem, wrapper, src, isVideo) {
    if (isVideo) {
      var video = document.createElement('video');
      video.className = 'preview-video';
      video.src = src;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      mediaItem.insertBefore(video, mediaItem.querySelector('.upload-btn'));
      video.addEventListener('loadedmetadata', function () {
        var w = video.videoWidth;
        var h = video.videoHeight;
        var maxW = Math.min(w, 500);
        var newH = Math.round(maxW * h / w);
        mediaItem.style.width = maxW + 'px';
        mediaItem.style.height = newH + 'px';
        mediaItem.style.minHeight = newH + 'px';
        if (wrapper) wrapper.style.width = maxW + 'px';
      });
    } else {
      var img = document.createElement('img');
      img.className = 'preview-img';
      img.src = src;
      mediaItem.insertBefore(img, mediaItem.querySelector('.upload-btn'));
      img.addEventListener('load', function () {
        var w = img.naturalWidth;
        var h = img.naturalHeight;
        var maxW = Math.min(w, 500);
        var newH = Math.round(maxW * h / w);
        mediaItem.style.width = maxW + 'px';
        mediaItem.style.height = newH + 'px';
        mediaItem.style.minHeight = newH + 'px';
        if (wrapper) wrapper.style.width = maxW + 'px';
      });
    }
  }

  document.addEventListener('change', function (e) {
    if (e.target.classList.contains('cell-file-input')) {
      handleFileUpload(e.target);
    }
  });

  // --- Resize handles & upload buttons ---
  function addResizeHandle(wrapper) {
    var item = wrapper.querySelector('.media-item');
    if (!item || item.querySelector('.resize-handle')) return;
    var handle = document.createElement('div');
    handle.className = 'resize-handle';
    item.appendChild(handle);
  }

  function addUploadButton(wrapper) {
    var item = wrapper.querySelector('.media-item');
    if (!item || item.querySelector('.upload-btn')) return;
    var lbl = document.createElement('label');
    lbl.className = 'upload-btn';
    lbl.textContent = 'Добавить файл';
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*,video/*';
    inp.className = 'cell-file-input';
    inp.style.display = 'none';
    lbl.appendChild(inp);
    item.appendChild(lbl);
  }

  function initAllItems() {
    document.querySelectorAll('.media-wrapper').forEach(function (w) {
      addResizeHandle(w);
      addUploadButton(w);
    });
  }

  // --- Save / Load ---
  function saveState() {
    // Сначала сохраняем текущие позиции в data-атрибуты текущего layout
    storePositionsToData(currentLayout);

    var items = [];
    document.querySelectorAll('.media-wrapper').forEach(function (wrapper) {
      var item = wrapper.querySelector('.media-item');
      var previewImg = item ? item.querySelector('.preview-img') : null;
      var previewVid = item ? item.querySelector('.preview-video') : null;
      var icon = item ? item.querySelector('.icon') : null;
      var label = item ? item.querySelector('.label') : null;

      items.push({
        type: 'media',
        label: label ? label.textContent : '',
        labelHidden: label ? label.style.display === 'none' : false,
        filename: wrapper.querySelector('.filename')?.textContent || '',
        description: wrapper.dataset.description || '',
        icon: icon ? icon.innerHTML : '',
        iconHidden: icon ? icon.style.display === 'none' : false,
        previewSrc: wrapper.dataset.previewData || '',
        previewType: wrapper.dataset.previewType || (previewImg ? 'image' : (previewVid ? 'video' : '')),
        // Позиции для ПК
        pc: {
          position: wrapper.dataset.pcPosition || '',
          left: wrapper.dataset.pcLeft || '',
          top: wrapper.dataset.pcTop || '',
          width: wrapper.dataset.pcWidth || '',
          transform: wrapper.dataset.pcTransform || '',
          itemWidth: wrapper.dataset.pcItemWidth || '',
          itemHeight: wrapper.dataset.pcItemHeight || '',
          itemMinHeight: wrapper.dataset.pcItemMinHeight || '',
        },
        // Позиции для Телефона
        phone: {
          position: wrapper.dataset.phonePosition || '',
          left: wrapper.dataset.phoneLeft || '',
          top: wrapper.dataset.phoneTop || '',
          width: wrapper.dataset.phoneWidth || '',
          transform: wrapper.dataset.phoneTransform || '',
          itemWidth: wrapper.dataset.phoneItemWidth || '',
          itemHeight: wrapper.dataset.phoneItemHeight || '',
          itemMinHeight: wrapper.dataset.phoneItemMinHeight || '',
        },
      });
    });

    document.querySelectorAll('.text-block').forEach(function (block) {
      items.push({
        type: 'text',
        text: block.textContent,
        fontSize: block.style.fontSize || '',
        fontFamily: block.style.fontFamily || '',
        color: block.style.color || '',
        textAlign: block.style.textAlign || '',
        pc: {
          left: block.dataset.pcLeft || '',
          top: block.dataset.pcTop || '',
          width: block.dataset.pcWidth || '',
          height: block.dataset.pcHeight || '',
        },
        phone: {
          left: block.dataset.phoneLeft || '',
          top: block.dataset.phoneTop || '',
          width: block.dataset.phoneWidth || '',
          height: block.dataset.phoneHeight || '',
        },
      });
    });

    var state = {
      items: items,
      font: document.body.style.fontFamily || '',
      heroText: heroH1.innerHTML,
      heroFontSize: heroH1.style.fontSize || '',
      heroAlign: heroH1.style.textAlign || 'center',
      sectionMinHeight: mediaSection.style.minHeight || '',
      layout: currentLayout,
    };
    localStorage.setItem('portfolio-state', JSON.stringify(state));

    // Сохраняем в GitHub (доступно всем посетителям)
    if (githubToken && authenticated) {
      var stateStr = JSON.stringify(state);
      var base64State = btoa(unescape(encodeURIComponent(stateStr)));
      ghUploadFile('data/state.json', base64State, 'Update portfolio state').catch(function (err) {
        console.warn('GitHub save error:', err);
      });
    }
  }

  function loadState() {
    applyState(null);
  }

  function applyState(state) {
    if (!state) {
      var raw = localStorage.getItem('portfolio-state');
      if (raw) {
        try { state = JSON.parse(raw); } catch (e) { return; }
      } else {
        return;
      }
    }

    if (state.font) document.body.style.fontFamily = state.font;
    if (state.heroText) heroH1.innerHTML = state.heroText;
    if (state.heroFontSize) heroH1.style.fontSize = state.heroFontSize;
    if (state.heroAlign) {
      heroH1.style.textAlign = state.heroAlign;
      setAlignActive(heroAlignGroup, state.heroAlign);
    }
    if (state.sectionMinHeight) mediaSection.style.minHeight = state.sectionMinHeight;

    if (state.items) {
      mediaSection.querySelectorAll('.media-wrapper, .text-block').forEach(function (el) { el.remove(); });

      state.items.forEach(function (data) {
        if (data.type === 'text') {
          var block = document.createElement('div');
          block.className = 'text-block';
          block.textContent = data.text;
          block.style.position = 'absolute';
          if (data.fontSize) block.style.fontSize = data.fontSize;
          if (data.fontFamily) block.style.fontFamily = data.fontFamily;
          if (data.color) block.style.color = data.color;
          if (data.textAlign) block.style.textAlign = data.textAlign;

          // Сохранить обе раскладки в data-атрибуты
          var pc = data.pc || {};
          var phone = data.phone || {};
          block.dataset.pcLeft = pc.left || data.left || '';
          block.dataset.pcTop = pc.top || data.top || '';
          block.dataset.pcWidth = pc.width || data.width || '';
          block.dataset.pcHeight = pc.height || data.height || '';
          block.dataset.phoneLeft = phone.left || data.left || '';
          block.dataset.phoneTop = phone.top || data.top || '';
          block.dataset.phoneWidth = phone.width || data.width || '';
          block.dataset.phoneHeight = phone.height || data.height || '';

          var handle = document.createElement('div');
          handle.className = 'resize-handle';
          block.appendChild(handle);
          mediaSection.appendChild(block);
        } else {
          var wrapper = document.createElement('div');
          wrapper.className = 'media-wrapper';
          var hasPreview = data.previewSrc && data.previewType;
          var html =
            '<div class="media-item' + (hasPreview ? ' has-preview' : '') + '">' +
              '<span class="icon"' + (data.iconHidden ? ' style="display:none"' : '') + '>' + data.icon + '</span>' +
              '<span class="label"' + (data.labelHidden ? ' style="display:none"' : '') + '>' + escapeHtml(data.label) + '</span>';

          if (hasPreview && data.previewType === 'image') {
            html += '<img class="preview-img" src="' + data.previewSrc + '">';
          } else if (hasPreview && data.previewType === 'video') {
            html += '<video class="preview-video" src="' + data.previewSrc + '" muted loop autoplay playsinline></video>';
          }

          html += '</div>';
          html += '<span class="filename">' + escapeHtml(data.filename) + '</span>';
          wrapper.innerHTML = html;

          if (data.description) wrapper.dataset.description = data.description;
          if (data.previewSrc) wrapper.dataset.previewData = data.previewSrc;
          if (data.previewType) wrapper.dataset.previewType = data.previewType;

          // Сохранить обе раскладки в data-атрибуты
          var pc = data.pc || {};
          var phone = data.phone || {};
          // Обратная совместимость со старым форматом
          wrapper.dataset.pcPosition = pc.position || data.wrapperPosition || '';
          wrapper.dataset.pcLeft = pc.left || data.wrapperLeft || '';
          wrapper.dataset.pcTop = pc.top || data.wrapperTop || '';
          wrapper.dataset.pcWidth = pc.width || data.wrapperWidth || '';
          wrapper.dataset.pcTransform = pc.transform || data.wrapperTransform || '';
          wrapper.dataset.pcItemWidth = pc.itemWidth || data.itemWidth || '';
          wrapper.dataset.pcItemHeight = pc.itemHeight || data.itemHeight || '';
          wrapper.dataset.pcItemMinHeight = pc.itemMinHeight || data.itemMinHeight || '';

          wrapper.dataset.phonePosition = phone.position || '';
          wrapper.dataset.phoneLeft = phone.left || '';
          wrapper.dataset.phoneTop = phone.top || '';
          wrapper.dataset.phoneWidth = phone.width || '';
          wrapper.dataset.phoneTransform = phone.transform || '';
          wrapper.dataset.phoneItemWidth = phone.itemWidth || '';
          wrapper.dataset.phoneItemHeight = phone.itemHeight || '';
          wrapper.dataset.phoneItemMinHeight = phone.itemMinHeight || '';

          addResizeHandle(wrapper);
          addUploadButton(wrapper);
          mediaSection.appendChild(wrapper);
        }
      });
    }

    // Определить layout: в редакторе — сохранённый, в просмотре — по устройству
    var targetLayout;
    if (editMode) {
      targetLayout = state.layout || 'pc';
    } else {
      targetLayout = window.innerWidth <= 768 ? 'phone' : 'pc';
    }
    currentLayout = targetLayout;
    if (targetLayout === 'phone') {
      mediaSection.classList.add('phone-layout');
      btnLayoutPC.classList.remove('active');
      btnLayoutPhone.classList.add('active');
    } else {
      mediaSection.classList.remove('phone-layout');
      btnLayoutPC.classList.add('active');
      btnLayoutPhone.classList.remove('active');
    }
    loadPositionsFromData(targetLayout);

    // Sync panel
    if (state.font) {
      var fontName = state.font.split(',')[0].replace(/['"]/g, '').trim();
      for (var i = 0; i < inputFont.options.length; i++) {
        if (inputFont.options[i].value === fontName) {
          inputFont.selectedIndex = i;
          break;
        }
      }
    }
    if (state.heroText) inputHeroText.value = state.heroText.replace(/<br\s*\/?>/g, '\n');
    if (state.heroFontSize) inputFontSize.value = parseInt(state.heroFontSize);
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function rgbToHex(color) {
    if (!color) return '#ffffff';
    if (color.startsWith('#')) return color;
    var match = color.match(/(\d+)/g);
    if (!match || match.length < 3) return '#ffffff';
    return '#' + match.slice(0, 3).map(function (n) {
      return ('0' + parseInt(n).toString(16)).slice(-2);
    }).join('');
  }

  // --- Лайтбокс ---
  document.addEventListener('click', function (e) {
    if (editMode) return;
    var wrapper = e.target.closest('.media-wrapper');
    if (!wrapper) return;
    var item = wrapper.querySelector('.media-item');
    if (!item || !item.classList.contains('has-preview')) return;

    var img = item.querySelector('.preview-img');
    var vid = item.querySelector('.preview-video');
    var filename = wrapper.querySelector('.filename');
    var desc = wrapper.dataset.description || '';

    lightboxMedia.innerHTML = '';
    if (vid) {
      var v = document.createElement('video');
      v.src = vid.src;
      v.controls = true;
      v.autoplay = true;
      v.playsInline = true;
      lightboxMedia.appendChild(v);
    } else if (img) {
      var i = document.createElement('img');
      i.src = img.src;
      lightboxMedia.appendChild(i);
    }

    lightboxDesc.textContent = desc;
    lightboxFilename.textContent = filename ? filename.textContent : '';
    lightbox.style.display = 'flex';
  });

  lightboxClose.addEventListener('click', function () {
    lightbox.style.display = 'none';
    lightboxMedia.innerHTML = '';
  });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      lightboxMedia.innerHTML = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.style.display === 'flex') {
      lightbox.style.display = 'none';
      lightboxMedia.innerHTML = '';
    }
  });

  // --- Превью телефона ---
  var phonePreview = document.getElementById('phone-preview');
  var phoneIframe = document.getElementById('phone-iframe');
  var phoneCloseBtn = document.getElementById('phone-close');
  var phoneBtn = document.getElementById('ed-preview-phone');

  phoneBtn.addEventListener('click', function () {
    saveState();

    // Временно переключаемся на phone layout для генерации HTML
    storePositionsToData(currentLayout);
    loadPositionsFromData('phone');
    if (currentLayout !== 'phone') mediaSection.classList.add('phone-layout');

    var siteHtml = siteContent.outerHTML;

    // Возвращаем обратно
    if (currentLayout !== 'phone') mediaSection.classList.remove('phone-layout');
    loadPositionsFromData(currentLayout);

    var styleLink = document.querySelector('link[rel="stylesheet"]');
    var stylePath = styleLink ? styleLink.getAttribute('href') : 'style.css';
    var inlineStyles = '';
    if (document.body.style.fontFamily) {
      inlineStyles += 'font-family:' + document.body.style.fontFamily + ';';
    }

    var iframeDoc =
      '<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=375">' +
      '<link rel="stylesheet" href="' + stylePath + '">' +
      '<style>' +
        '#edit-toggle, #editor-panel { display: none !important; }' +
        '.media-section { width: 375px; margin: 0 auto; padding: 40px 16px 120px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }' +
      '</style>' +
      '</head><body style="' + inlineStyles + '">' +
      siteHtml +
      '</body></html>';

    phoneIframe.srcdoc = iframeDoc;
    phonePreview.style.display = 'flex';
  });

  phoneCloseBtn.addEventListener('click', function () {
    phonePreview.style.display = 'none';
    phoneIframe.srcdoc = '';
  });

  phonePreview.addEventListener('click', function (e) {
    if (e.target === phonePreview) {
      phonePreview.style.display = 'none';
      phoneIframe.srcdoc = '';
    }
  });

  // --- Init ---
  // Пробуем загрузить state.json из GitHub Pages, если нет — из localStorage
  var stateUrl = 'https://' + GITHUB_REPO.split('/')[0] + '.github.io/' +
                 GITHUB_REPO.split('/')[1] + '/data/state.json';

  fetch(stateUrl + '?t=' + Date.now())
    .then(function (res) {
      if (!res.ok) throw new Error('No remote state');
      return res.json();
    })
    .then(function (data) {
      if (data && data.items) {
        applyState(data);
      } else {
        loadState();
      }
      initAllItems();
    })
    .catch(function () {
      loadState();
      initAllItems();
    });
})();
