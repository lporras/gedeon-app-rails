class ScheduleEditorController extends Stimulus.Controller {
  static targets = [
    'songSearch',
    'songList',
    'scriptureSearch',
    'scriptureList',
    'scheduleList',
    'dropPlaceholder',
    'preview',
    'bibleTabs',
    'bookList',
    'bookFilter',
    'chapterList',
    'verseList',
    'verseFilter',
    'addScriptureBtn',
    'imageUpload',
    'imageName',
    'imageList'
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
    blackScreenUrl: String,
    bibleBooksUrl: String,
    bibleChaptersUrl: String,
    bibleVersesUrl: String,
    createAndAddScriptureUrl: String,
    bibleVersions: Array,
    listImagesUrl: String,
    uploadImageUrl: String,
    deleteImageUrl: String
  }

  connect() {
    console.log("ScheduleEditor connected");
    this.currentVerseIndex = 0;
    this.currentVerses = [];
    this.searchSongs();
    this.searchScriptures();
    this.updateDropPlaceholder();

    // Bible lookup state
    this.currentBibleVersion = (this.bibleVersionsValue && this.bibleVersionsValue[0]) || 'NVI';
    this.selectedBookId = null;
    this.selectedChapterNum = null;
    this.selectedVerseNums = [];
    this.allBooks = [];
    this.allVerses = [];
    this.loadBooks();
    this.loadImages();
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
    var icon;
    if (item.item_type === 'ScheduleImage' && item.thumb_url) {
      icon = '<img src="' + item.thumb_url + '" class="schedule-editor__item-thumb" />';
    } else {
      icon = item.item_type === 'Song' ? '♪' : '📖';
    }
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
      if (data.action === 'present_image') {
        self.renderImagePreview(data.image_url);
      } else {
        self.currentVerses = data.verses || [];
        self.currentVerseIndex = 0;
        self.renderPreview(data);
      }
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

  // --- Bible Lookup ---
  switchBibleTab(event) {
    var version = event.currentTarget.dataset.bibleVersion;
    this.currentBibleVersion = version;

    var tabs = this.bibleTabsTarget.querySelectorAll('.schedule-editor__bible-tab');
    tabs.forEach(function(tab) {
      if (tab.dataset.bibleVersion === version) {
        tab.classList.add('schedule-editor__bible-tab--active');
      } else {
        tab.classList.remove('schedule-editor__bible-tab--active');
      }
    });

    this.selectedBookId = null;
    this.selectedChapterNum = null;
    this.selectedVerseNums = [];
    this.chapterListTarget.innerHTML = '';
    this.verseListTarget.innerHTML = '';
    this.bookFilterTarget.value = '';
    this.verseFilterTarget.value = '';
    this.updateAddScriptureBtn();
    this.loadBooks();
  }

  loadBooks() {
    var self = this;
    var url = this.bibleBooksUrlValue + '?bible_version=' + encodeURIComponent(this.currentBibleVersion);

    fetch(url, {
      headers: { 'Accept': 'application/json', 'X-CSRF-Token': this.csrfToken() }
    })
    .then(function(r) { return r.json(); })
    .then(function(books) {
      self.allBooks = books;
      self.renderBookList(books);
    });
  }

  renderBookList(books) {
    var self = this;
    var html = '';
    books.forEach(function(book) {
      var activeClass = self.selectedBookId === book.book_title ? ' schedule-editor__bible-item--active' : '';
      html += '<div class="schedule-editor__bible-item' + activeClass + '" ' +
              'data-action="click->schedule-editor#selectBook" ' +
              'data-book-id="' + escapeHtml(book.book_title) + '">' +
              escapeHtml(book.book_title) +
              '</div>';
    });
    if (books.length === 0) {
      html = '<p class="schedule-editor__empty">No books found</p>';
    }
    this.bookListTarget.innerHTML = html;
  }

  filterBooks() {
    var query = this.bookFilterTarget.value.toLowerCase();
    var filtered = this.allBooks.filter(function(book) {
      return book.book_title.toLowerCase().indexOf(query) !== -1;
    });
    this.renderBookList(filtered);
  }

  selectBook(event) {
    var bookId = event.currentTarget.dataset.bookId;
    this.selectedBookId = bookId;
    this.selectedChapterNum = null;
    this.selectedVerseNums = [];
    this.verseListTarget.innerHTML = '';
    this.verseFilterTarget.value = '';
    this.updateAddScriptureBtn();

    var items = this.bookListTarget.querySelectorAll('.schedule-editor__bible-item');
    items.forEach(function(el) {
      if (el.dataset.bookId === bookId) {
        el.classList.add('schedule-editor__bible-item--active');
      } else {
        el.classList.remove('schedule-editor__bible-item--active');
      }
    });

    this.loadChapters();
  }

  loadChapters() {
    var self = this;
    var url = this.bibleChaptersUrlValue +
              '?bible_version=' + encodeURIComponent(this.currentBibleVersion) +
              '&book_id=' + encodeURIComponent(this.selectedBookId);

    fetch(url, {
      headers: { 'Accept': 'application/json', 'X-CSRF-Token': this.csrfToken() }
    })
    .then(function(r) { return r.json(); })
    .then(function(chapters) {
      self.renderChapterList(chapters);
    });
  }

  renderChapterList(chapters) {
    var self = this;
    var html = '';
    chapters.forEach(function(chapter) {
      var activeClass = self.selectedChapterNum === chapter.chapter_num ? ' schedule-editor__bible-item--active' : '';
      html += '<div class="schedule-editor__bible-item' + activeClass + '" ' +
              'data-action="click->schedule-editor#selectChapter" ' +
              'data-chapter-num="' + chapter.chapter_num + '">' +
              'Chapter ' + chapter.chapter_num +
              '</div>';
    });
    if (chapters.length === 0) {
      html = '<p class="schedule-editor__empty">Select a book</p>';
    }
    this.chapterListTarget.innerHTML = html;
  }

  selectChapter(event) {
    var chapterNum = parseInt(event.currentTarget.dataset.chapterNum);
    this.selectedChapterNum = chapterNum;
    this.selectedVerseNums = [];
    this.verseFilterTarget.value = '';
    this.updateAddScriptureBtn();

    var items = this.chapterListTarget.querySelectorAll('.schedule-editor__bible-item');
    items.forEach(function(el) {
      if (parseInt(el.dataset.chapterNum) === chapterNum) {
        el.classList.add('schedule-editor__bible-item--active');
      } else {
        el.classList.remove('schedule-editor__bible-item--active');
      }
    });

    this.loadVerses();
  }

  loadVerses() {
    var self = this;
    var url = this.bibleVersesUrlValue +
              '?bible_version=' + encodeURIComponent(this.currentBibleVersion) +
              '&book_id=' + encodeURIComponent(this.selectedBookId) +
              '&chapter_num=' + encodeURIComponent(this.selectedChapterNum);

    fetch(url, {
      headers: { 'Accept': 'application/json', 'X-CSRF-Token': this.csrfToken() }
    })
    .then(function(r) { return r.json(); })
    .then(function(verses) {
      self.allVerses = verses;
      self.renderVerseList(verses);
    });
  }

  renderVerseList(verses) {
    var self = this;
    var html = '';
    verses.forEach(function(verse) {
      var checkedAttr = self.selectedVerseNums.indexOf(verse.num) !== -1 ? ' checked' : '';
      var selectedClass = self.selectedVerseNums.indexOf(verse.num) !== -1 ? ' schedule-editor__bible-verse--selected' : '';
      html += '<label class="schedule-editor__bible-verse' + selectedClass + '" ' +
              'data-verse-num="' + verse.num + '">' +
              '<input type="checkbox" value="' + verse.num + '"' + checkedAttr +
              ' data-action="change->schedule-editor#toggleVerse" />' +
              '<span class="schedule-editor__bible-verse-num">' + verse.num + '.</span> ' +
              '<span class="schedule-editor__bible-verse-text">' + escapeHtml(verse.text) + '</span>' +
              '</label>';
    });
    if (verses.length === 0) {
      html = '<p class="schedule-editor__empty">Select a chapter</p>';
    }
    this.verseListTarget.innerHTML = html;
  }

  filterVerses() {
    var query = this.verseFilterTarget.value.trim();
    var self = this;

    // Check for range pattern like "18-20"
    var rangeMatch = query.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      var from = parseInt(rangeMatch[1]);
      var to = parseInt(rangeMatch[2]);
      if (from > to) { var tmp = from; from = to; to = tmp; }

      // Auto-select all verses in the range
      this.allVerses.forEach(function(verse) {
        if (verse.num >= from && verse.num <= to) {
          if (self.selectedVerseNums.indexOf(verse.num) === -1) {
            self.selectedVerseNums.push(verse.num);
          }
        }
      });
      this.updateAddScriptureBtn();

      // Filter to show only the range
      var filtered = this.allVerses.filter(function(verse) {
        return verse.num >= from && verse.num <= to;
      });
      this.renderVerseList(filtered);
      return;
    }

    var lowerQuery = query.toLowerCase();
    var filtered = this.allVerses.filter(function(verse) {
      return verse.num.toString().indexOf(lowerQuery) !== -1 ||
             verse.text.toLowerCase().indexOf(lowerQuery) !== -1;
    });
    this.renderVerseList(filtered);
  }

  toggleVerse(event) {
    var num = parseInt(event.currentTarget.value);
    var idx = this.selectedVerseNums.indexOf(num);
    if (idx !== -1) {
      this.selectedVerseNums.splice(idx, 1);
    } else {
      this.selectedVerseNums.push(num);
    }

    // Update visual selection
    var label = event.currentTarget.closest('.schedule-editor__bible-verse');
    if (event.currentTarget.checked) {
      label.classList.add('schedule-editor__bible-verse--selected');
    } else {
      label.classList.remove('schedule-editor__bible-verse--selected');
    }

    this.updateAddScriptureBtn();
  }

  updateAddScriptureBtn() {
    if (this.hasAddScriptureBtnTarget) {
      var enabled = this.selectedVerseNums.length > 0 &&
                    this.selectedBookId &&
                    this.selectedChapterNum;
      this.addScriptureBtnTarget.disabled = !enabled;
    }
  }

  addScriptureToSchedule() {
    if (this.selectedVerseNums.length === 0) return;

    var self = this;
    var formData = new FormData();
    formData.append('bible_version', this.currentBibleVersion);
    formData.append('book_id', this.selectedBookId);
    formData.append('chapter_num', this.selectedChapterNum);
    this.selectedVerseNums.sort(function(a, b) { return a - b; });
    this.selectedVerseNums.forEach(function(num) {
      formData.append('verse_nums[]', num);
    });

    fetch(this.createAndAddScriptureUrlValue, {
      method: 'POST',
      headers: { 'X-CSRF-Token': this.csrfToken() },
      body: formData
    })
    .then(function(r) { return r.json(); })
    .then(function(item) {
      self.appendScheduleItem(item);
      self.updateDropPlaceholder();
      self.searchScriptures();

      // Reset verse selection
      self.selectedVerseNums = [];
      self.updateAddScriptureBtn();
      self.renderVerseList(self.allVerses);
    });
  }

  // --- Images ---
  loadImages() {
    var self = this;
    fetch(this.listImagesUrlValue, {
      headers: { 'Accept': 'application/json', 'X-CSRF-Token': this.csrfToken() }
    })
    .then(function(r) { return r.json(); })
    .then(function(images) {
      self.renderImageList(images);
    });
  }

  renderImageList(images) {
    var html = '';
    images.forEach(function(img) {
      html += '<div class="schedule-editor__image-card" data-image-id="' + img.id + '">' +
              '<img src="' + img.thumb_url + '" alt="" class="schedule-editor__image-thumb" />' +
              '<div class="schedule-editor__image-actions">' +
              '<span class="schedule-editor__image-name">' + escapeHtml(img.name) + '</span>' +
              '<button type="button" class="schedule-editor__btn schedule-editor__btn--add" ' +
              'data-action="click->schedule-editor#addImageToSchedule" ' +
              'data-image-id="' + img.id + '">+ Add</button>' +
              '<button type="button" class="schedule-editor__btn schedule-editor__btn--remove" ' +
              'data-action="click->schedule-editor#deleteImage" ' +
              'data-image-id="' + img.id + '">&times;</button>' +
              '</div>' +
              '</div>';
    });
    if (images.length === 0) {
      html = '<p class="schedule-editor__empty">No images uploaded</p>';
    }
    this.imageListTarget.innerHTML = html;
  }

  uploadImage() {
    var self = this;
    var file = this.imageUploadTarget.files[0];
    if (!file) return;

    var name = this.imageNameTarget.value || '';
    var formData = new FormData();
    formData.append('image', file);
    formData.append('name', name);

    fetch(this.uploadImageUrlValue, {
      method: 'POST',
      headers: { 'X-CSRF-Token': this.csrfToken() },
      body: formData
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      self.imageUploadTarget.value = '';
      self.imageNameTarget.value = '';
      self.loadImages();
    });
  }

  deleteImage(event) {
    var imageId = event.currentTarget.dataset.imageId;
    var self = this;

    fetch(this.deleteImageUrlValue + '?image_id=' + imageId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': this.csrfToken(), 'Accept': 'application/json' }
    })
    .then(function(r) { return r.json(); })
    .then(function() {
      self.loadImages();
    });
  }

  renderImagePreview(imageUrl) {
    var html = '<div class="schedule-editor__preview-title">' +
               '<strong>Image</strong>' +
               '</div>' +
               '<div class="schedule-editor__preview-image">' +
               '<img src="' + imageUrl + '" alt="" style="max-width:100%;max-height:300px;" />' +
               '</div>';
    this.previewTarget.innerHTML = html;
  }

  addImageToSchedule(event) {
    var imageId = event.currentTarget.dataset.imageId;
    this.addItem('ScheduleImage', imageId);
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
