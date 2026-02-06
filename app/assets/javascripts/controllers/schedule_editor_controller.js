class ScheduleEditorController extends Stimulus.Controller {
  static targets = [
    'songSearch',
    'songList',
    'scriptureSearch',
    'scriptureList',
    'scheduleList',
    'dropPlaceholder',
    'preview'
  ]

  static values = {
    scheduleId: Number,
    searchSongsUrl: String,
    searchScripturesUrl: String,
    addItemUrl: String,
    removeItemUrl: String,
    reorderItemsUrl: String,
    presentItemUrl: String,
    navigateToUrl: String,
    blackScreenUrl: String
  }

  connect() {
    console.log("ScheduleEditor connected");
    this.currentVerseIndex = 0;
    this.currentVerses = [];
    this.searchSongs();
    this.searchScriptures();
    this.updateDropPlaceholder();
  }

  // --- Song Search ---
  searchSongs() {
    var query = this.songSearchTarget.value || '';
    var url = this.searchSongsUrlValue + '?q=' + encodeURIComponent(query);
    var self = this;

    fetch(url, {
      headers: { 'Accept': 'application/json', 'X-CSRF-Token': this.csrfToken() }
    })
    .then(function(r) { return r.json(); })
    .then(function(songs) {
      self.renderSongList(songs);
    });
  }

  renderSongList(songs) {
    var html = '';
    songs.forEach(function(song) {
      html += '<div class="schedule-editor__draggable" draggable="true" ' +
              'data-item-type="Song" data-item-id="' + song.id + '" ' +
              'data-action="dragstart->schedule-editor#dragStartNew dblclick->schedule-editor#addFromList">' +
              '<span class="schedule-editor__draggable-icon">♪</span> ' +
              '<span class="schedule-editor__draggable-title">' + escapeHtml(song.title) + '</span>' +
              '<button type="button" class="schedule-editor__btn schedule-editor__btn--add" ' +
              'data-action="click->schedule-editor#addFromList" ' +
              'data-item-type="Song" data-item-id="' + song.id + '">+ Add</button>' +
              '</div>';
    });
    if (songs.length === 0) {
      html = '<p class="schedule-editor__empty">No songs found</p>';
    }
    this.songListTarget.innerHTML = html;
  }

  // --- Scripture Search ---
  searchScriptures() {
    var query = this.scriptureSearchTarget.value || '';
    var url = this.searchScripturesUrlValue + '?q=' + encodeURIComponent(query);
    var self = this;

    fetch(url, {
      headers: { 'Accept': 'application/json', 'X-CSRF-Token': this.csrfToken() }
    })
    .then(function(r) { return r.json(); })
    .then(function(scriptures) {
      self.renderScriptureList(scriptures);
    });
  }

  renderScriptureList(scriptures) {
    var html = '';
    scriptures.forEach(function(scripture) {
      html += '<div class="schedule-editor__draggable" draggable="true" ' +
              'data-item-type="Scripture" data-item-id="' + scripture.id + '" ' +
              'data-action="dragstart->schedule-editor#dragStartNew dblclick->schedule-editor#addFromList">' +
              '<span class="schedule-editor__draggable-icon">📖</span> ' +
              '<span class="schedule-editor__draggable-title">' + escapeHtml(scripture.bible_reference) + '</span>' +
              '<button type="button" class="schedule-editor__btn schedule-editor__btn--add" ' +
              'data-action="click->schedule-editor#addFromList" ' +
              'data-item-type="Scripture" data-item-id="' + scripture.id + '">+ Add</button>' +
              '</div>';
    });
    if (scriptures.length === 0) {
      html = '<p class="schedule-editor__empty">No scriptures found</p>';
    }
    this.scriptureListTarget.innerHTML = html;
  }

  // --- Add from list (button click or double-click) ---
  addFromList(event) {
    event.preventDefault();
    var el = event.currentTarget;
    var itemType = el.dataset.itemType || el.closest('.schedule-editor__draggable').dataset.itemType;
    var itemId = el.dataset.itemId || el.closest('.schedule-editor__draggable').dataset.itemId;
    this.addItem(itemType, itemId);
  }

  // --- Drag & Drop ---
  dragStartNew(event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      action: 'add',
      itemType: event.currentTarget.dataset.itemType,
      itemId: event.currentTarget.dataset.itemId
    }));
    event.dataTransfer.effectAllowed = 'copy';
  }

  dragStartItem(event) {
    event.dataTransfer.setData('text/plain', JSON.stringify({
      action: 'reorder',
      scheduleItemId: event.currentTarget.dataset.scheduleItemId
    }));
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('schedule-editor__item--dragging');
  }

  dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }

  drop(event) {
    event.preventDefault();
    var raw = event.dataTransfer.getData('text/plain');
    if (!raw) return;

    var data;
    try { data = JSON.parse(raw); } catch(e) { return; }

    if (data.action === 'add') {
      this.addItem(data.itemType, data.itemId);
    }
  }

  // --- Schedule CRUD ---
  addItem(itemType, itemId) {
    var self = this;
    var formData = new FormData();
    formData.append('item_type', itemType);
    formData.append('item_id', itemId);

    fetch(this.addItemUrlValue, {
      method: 'POST',
      headers: { 'X-CSRF-Token': this.csrfToken() },
      body: formData
    })
    .then(function(r) { return r.json(); })
    .then(function(item) {
      self.appendScheduleItem(item);
      self.updateDropPlaceholder();
    });
  }

  appendScheduleItem(item) {
    var icon = item.item_type === 'Song' ? '♪' : '📖';
    var div = document.createElement('div');
    div.className = 'schedule-editor__item';
    div.setAttribute('draggable', 'true');
    div.dataset.scheduleItemId = item.id;
    div.dataset.itemType = item.item_type;
    div.dataset.itemId = item.item_id;
    div.dataset.action = 'dragstart->schedule-editor#dragStartItem';
    div.innerHTML =
      '<span class="schedule-editor__item-icon">' + icon + '</span>' +
      '<span class="schedule-editor__item-title">' + escapeHtml(item.title) + '</span>' +
      '<div class="schedule-editor__item-actions">' +
        '<button type="button" class="schedule-editor__btn schedule-editor__btn--present" ' +
          'data-action="click->schedule-editor#presentItem" ' +
          'data-schedule-item-id="' + item.id + '">Present Now</button>' +
        '<button type="button" class="schedule-editor__btn schedule-editor__btn--remove" ' +
          'data-action="click->schedule-editor#removeItem" ' +
          'data-schedule-item-id="' + item.id + '">&times;</button>' +
      '</div>';

    this.scheduleListTarget.insertBefore(div, this.dropPlaceholderTarget);
  }

  removeItem(event) {
    var scheduleItemId = event.currentTarget.dataset.scheduleItemId;
    var self = this;

    fetch(this.removeItemUrlValue + '?schedule_item_id=' + scheduleItemId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': this.csrfToken(), 'Accept': 'application/json' }
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      var el = self.scheduleListTarget.querySelector('[data-schedule-item-id="' + scheduleItemId + '"]');
      if (el) el.remove();
      self.updateDropPlaceholder();
    });
  }

  updateDropPlaceholder() {
    var items = this.scheduleListTarget.querySelectorAll('.schedule-editor__item');
    if (items.length > 0) {
      this.dropPlaceholderTarget.style.display = 'none';
    } else {
      this.dropPlaceholderTarget.style.display = 'block';
    }
  }

  // --- Present ---
  presentItem(event) {
    var scheduleItemId = event.currentTarget.dataset.scheduleItemId;
    var self = this;
    var formData = new FormData();
    formData.append('schedule_item_id', scheduleItemId);

    fetch(this.presentItemUrlValue, {
      method: 'POST',
      headers: { 'X-CSRF-Token': this.csrfToken() },
      body: formData
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      self.currentVerses = data.verses || [];
      self.currentVerseIndex = 0;
      self.renderPreview(data);
      self.highlightActiveItem(scheduleItemId);
    });
  }

  renderPreview(data) {
    var self = this;
    var maxLines = 4;
    var html = '<div class="schedule-editor__preview-title">' +
               '<strong>' + escapeHtml(data.title) + '</strong>' +
               ' <span class="schedule-editor__preview-type">(' + data.type + ')</span>' +
               '</div>';
    html += '<div class="schedule-editor__preview-verses">';

    // Build chunks matching the presenter's splitting logic
    this.previewChunks = [];
    var slideIndex = 0;
    data.verses.forEach(function(verse) {
      var lines = verse.split(/\n/);
      for (var i = 0; i < lines.length; i += maxLines) {
        var chunk = lines.slice(i, i + maxLines).join('\n');
        self.previewChunks.push(chunk);
        var activeClass = slideIndex === self.currentVerseIndex ? ' schedule-editor__preview-verse--active' : '';
        html += '<div class="schedule-editor__preview-verse' + activeClass + '" ' +
                'data-action="click->schedule-editor#clickVerse" ' +
                'data-verse-index="' + slideIndex + '">' +
                escapeHtml(chunk).replace(/\n/g, '<br>') +
                '</div>';
        slideIndex++;
      }
    });

    this.currentVerses = this.previewChunks;
    html += '</div>';
    this.previewTarget.innerHTML = html;
    this.previewTarget.focus();
  }

  clickVerse(event) {
    var index = parseInt(event.currentTarget.dataset.verseIndex);
    this.navigateToVerse(index);
  }

  handlePreviewKeydown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      if (this.currentVerseIndex < this.currentVerses.length - 1) {
        this.navigateToVerse(this.currentVerseIndex + 1);
      }
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (this.currentVerseIndex > 0) {
        this.navigateToVerse(this.currentVerseIndex - 1);
      }
    }
  }

  navigateToVerse(index) {
    this.currentVerseIndex = index;
    var self = this;

    // Update preview highlighting
    var verses = this.previewTarget.querySelectorAll('.schedule-editor__preview-verse');
    verses.forEach(function(el, i) {
      if (i === index) {
        el.classList.add('schedule-editor__preview-verse--active');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        el.classList.remove('schedule-editor__preview-verse--active');
      }
    });

    // Send navigate_to to server
    var formData = new FormData();
    // verse_index: 0 = title sub-slide in Reveal, so actual verse index is +1
    formData.append('verse_index', index + 1);

    fetch(this.navigateToUrlValue, {
      method: 'POST',
      headers: { 'X-CSRF-Token': this.csrfToken() },
      body: formData
    });
  }

  highlightActiveItem(scheduleItemId) {
    var items = this.scheduleListTarget.querySelectorAll('.schedule-editor__item');
    items.forEach(function(el) {
      if (el.dataset.scheduleItemId === scheduleItemId) {
        el.classList.add('schedule-editor__item--active');
      } else {
        el.classList.remove('schedule-editor__item--active');
      }
    });
  }

  // --- Black Screen ---
  blackScreen() {
    fetch(this.blackScreenUrlValue, {
      method: 'POST',
      headers: { 'X-CSRF-Token': this.csrfToken() }
    });
  }

  // --- Helpers ---
  csrfToken() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
  }
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(text || ''));
  return div.innerHTML;
}
