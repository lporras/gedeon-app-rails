require 'bible_parser'

ActiveAdmin.register Scripture do
  menu priority: 5

  permit_params :book_id, :chapter_num, :content, :from, :to, :bible_version, :playlist_section_id

  form partial: 'form'

  filter :bible_version, as: :select, collection: Scripture.bible_versions
  filter :book_id
  filter :chapter_num
  filter :from
  filter :to
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :bible_reference
    column :content do |scripture|
      div scripture.content, style: "max-width: 25rem"
    end
    column :playlist
    column :created_at
    column :updated_at

    actions
  end

  controller do
    before_action :set_bible
    before_action :set_bible_from_scripture, only: [:edit]

    def set_bible
      params[:bible_version] ||= "NVI"
      bible_path = Scripture.open_bible_file_path(params[:bible_version])
      @bible = BibleParser.new(File.open(bible_path))
    end

    def set_bible_from_scripture
      params[:bible_version] = resource.bible_version
      bible_path = Scripture.open_bible_file_path(params[:bible_version])
      @bible = BibleParser.new(File.open(bible_path))
    end

    def scoped_collection
      super.includes(playlist_section: [:playlist])
    end
  end

  collection_action :books, method: :get do
    @books = @bible.books.map do |book|
      {
        book_title: book.title,
      }
    end

    respond_to do |format|
      format.json { render json: @books }
    end
  end

  collection_action :chapters, method: :get do
    @chapters = []

    if params[:book_id]
      book = @bible.books.find{|book| book.title == params[:book_id]}
    end

    book = @bible.books.first if book.nil?

    @chapters = book.chapters.map do |chapter|
      {
        chapter_num: chapter.num,
        book_title: chapter.book_title
      }
    end

    respond_to do |format|
      format.json { render json: @chapters }
    end
  end

  collection_action :verses, method: :get do
    @verses = []

    if params[:book_id]
      book = @bible.books.find{|book| book.title == params[:book_id]}
    end

    if params[:chapter_num]
      chapter = book.chapters.find{|chapter| chapter.num == params[:chapter_num].to_i }
    end

    book = @bible.books.first if book.nil?
    chapter = book.chapters.first if chapter.nil?

    @verses = chapter.verses.map do |verse|
      {
        num: verse.num,
        book_id: verse.book_id,
        book_title: verse.book_title,
        chapter_num: verse.chapter_num,
        text: verse.text
      }
    end

    respond_to do |format|
      format.json { render json: @verses }
    end
  end
end
