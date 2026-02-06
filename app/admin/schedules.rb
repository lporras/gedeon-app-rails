ActiveAdmin.register Schedule do
  menu priority: 6

  permit_params :name

  filter :name
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :name
    column :created_at
    column :updated_at
    actions
  end

  form do |f|
    f.inputs do
      f.input :name
    end
    f.actions
  end

  controller do
    def show
      @schedule = resource
      render 'admin/schedules/show', layout: 'active_admin'
    end
  end

  action_item :presenter, only: :show do
    link_to 'Open Presenter', presenter_admin_schedule_path(resource), target: "_blank"
  end

  # Presenter page - renders in reveal_js layout
  member_action :presenter, method: :get do
    @schedule = resource
    render layout: "reveal_js_presenter"
  end

  # Search songs
  collection_action :search_songs, method: :get do
    songs = Song.where("title ILIKE ?", "%#{params[:q]}%").limit(20)
    render json: songs.map { |s| { id: s.id, title: s.title, content: s.content } }
  end

  # Search scriptures
  collection_action :search_scriptures, method: :get do
    scriptures = Scripture.all.limit(20)
    if params[:q].present?
      scriptures = scriptures.where("book_id ILIKE :q OR content ILIKE :q", q: "%#{params[:q]}%")
    end
    render json: scriptures.map { |s|
      { id: s.id, bible_reference: s.bible_reference, content: s.content }
    }
  end

  # Add item to schedule
  member_action :add_item, method: :post do
    schedule = resource
    item_type = params[:item_type]
    item_id = params[:item_id]
    position = schedule.schedule_items.count
    schedule_item = schedule.schedule_items.create!(
      item_type: item_type,
      item_id: item_id,
      position: position
    )
    render json: {
      id: schedule_item.id,
      item_type: item_type,
      item_id: item_id,
      position: position,
      title: schedule_item.item.respond_to?(:title) ? schedule_item.item.title : schedule_item.item.bible_reference,
      content: schedule_item.item.content
    }
  end

  # Remove item from schedule
  member_action :remove_item, method: :delete do
    schedule = resource
    schedule_item = schedule.schedule_items.find(params[:schedule_item_id])
    schedule_item.destroy!
    render json: { success: true }
  end

  # Reorder items
  member_action :reorder_items, method: :patch do
    schedule = resource
    params[:order].each_with_index do |item_id, index|
      schedule.schedule_items.find(item_id).update!(position: index)
    end
    render json: { success: true }
  end

  # Present an item - broadcasts to the channel
  member_action :present_item, method: :post do
    schedule = resource
    schedule_item = schedule.schedule_items.find(params[:schedule_item_id])
    item = schedule_item.item

    if item.is_a?(Song)
      verses = item.content.split(/\n\s*\n/).map(&:strip).reject(&:blank?)
      payload = {
        action: "present",
        type: "song",
        title: item.title,
        verses: verses
      }
    else
      scripture_verses = item.content.split(/\n/).map(&:strip).reject(&:blank?)
      payload = {
        action: "present",
        type: "scripture",
        title: item.bible_reference,
        verses: scripture_verses
      }
    end

    ActionCable.server.broadcast("schedule_presenter_#{schedule.id}", payload)
    render json: payload
  end

  # Navigate to a specific verse
  member_action :navigate_to, method: :post do
    schedule = resource
    payload = {
      action: "navigate_to",
      verse_index: params[:verse_index].to_i
    }
    ActionCable.server.broadcast("schedule_presenter_#{schedule.id}", payload)
    render json: { success: true }
  end

  # Black screen
  member_action :black_screen, method: :post do
    schedule = resource
    payload = { action: "black" }
    ActionCable.server.broadcast("schedule_presenter_#{schedule.id}", payload)
    render json: { success: true }
  end

  # Bible lookup: books
  collection_action :bible_books, method: :get do
    bible = SimpleBibleLoader.load_bible(params[:bible_version] || "NVI")
    books = bible.books.map { |b| { book_title: b.title } }
    render json: books
  end

  # Bible lookup: chapters
  collection_action :bible_chapters, method: :get do
    bible = SimpleBibleLoader.load_bible(params[:bible_version] || "NVI")
    book = bible.books.find { |b| b.title == params[:book_id] } || bible.books.first
    chapters = book.chapters.map { |c| { chapter_num: c.num, book_title: c.book_title } }
    render json: chapters
  end

  # Bible lookup: verses
  collection_action :bible_verses, method: :get do
    bible = SimpleBibleLoader.load_bible(params[:bible_version] || "NVI")
    book = bible.books.find { |b| b.title == params[:book_id] } || bible.books.first
    chapter = book.chapters.find { |c| c.num == params[:chapter_num].to_i } || book.chapters.first
    verses = chapter.verses.map { |v| { num: v.num, text: v.text, book_id: v.book_id, chapter_num: v.chapter_num } }
    render json: verses
  end

  # Create scripture from bible lookup and add to schedule
  member_action :create_and_add_scripture, method: :post do
    schedule = resource
    verse_nums = params[:verse_nums].map(&:to_i).sort
    from_num = verse_nums.first
    to_num = verse_nums.last

    bible = SimpleBibleLoader.load_bible(params[:bible_version] || "NVI")
    book = bible.books.find { |b| b.title == params[:book_id] }
    chapter = book.chapters.find { |c| c.num == params[:chapter_num].to_i }
    selected_verses = chapter.verses.select { |v| verse_nums.include?(v.num) }
    content = selected_verses.map { |v| "#{v.num}. #{v.text}" }.join("\n")

    scripture = Scripture.create!(
      book_id: params[:book_id],
      chapter_num: params[:chapter_num],
      from: from_num,
      to: to_num == from_num ? nil : to_num,
      bible_version: params[:bible_version],
      content: content
    )

    position = schedule.schedule_items.count
    schedule_item = schedule.schedule_items.create!(
      item_type: "Scripture",
      item_id: scripture.id,
      position: position
    )

    render json: {
      id: schedule_item.id,
      item_type: "Scripture",
      item_id: scripture.id,
      position: position,
      title: scripture.bible_reference,
      content: scripture.content
    }
  end
end
