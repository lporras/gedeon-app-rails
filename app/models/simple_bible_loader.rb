require 'nokogiri'

class SimpleBibleLoader
  class Book
    attr_reader :title

    def initialize(title)
      @title = title
    end

    def chapters
      @chapters ||= []
    end
  end

  class Chapter
    attr_reader :num, :book_title

    def initialize(num, book_title)
      @num = num
      @book_title = book_title
    end

    def verses
      @verses ||= []
    end
  end

  class Verse
    attr_reader :num, :text, :book_id, :book_title, :chapter_num

    def initialize(num, text, book_id, book_title, chapter_num)
      @num = num
      @text = text
      @book_id = book_id
      @book_title = book_title
      @chapter_num = chapter_num
    end
  end

  class SimpleBible
    def books
      @books ||= []
    end
  end

  def self.load_bible(version)
    bible_path = Scripture.open_bible_file_path(version)
    content = File.read(bible_path)

    bible = SimpleBible.new
    doc = Nokogiri::XML(content)

    # Parse the Zefania XML format
    doc.xpath('//BIBLEBOOK').each do |book_node|
      book_title = book_node['bname']
      book = Book.new(book_title)

      book_node.xpath('./CHAPTER').each do |chapter_node|
        chapter_num = chapter_node['cnumber'].to_i
        chapter = Chapter.new(chapter_num, book_title)

        chapter_node.xpath('./VERS').each do |verse_node|
          verse_num = verse_node['vnumber'].to_i
          verse_text = verse_node.text.strip
          verse = Verse.new(verse_num, verse_text, book_title, book_title, chapter_num)
          chapter.verses << verse
        end

        book.chapters << chapter
      end

      bible.books << book
    end

    bible
  end
end
