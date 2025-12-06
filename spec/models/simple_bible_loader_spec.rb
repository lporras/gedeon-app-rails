require 'rails_helper'

RSpec.describe SimpleBibleLoader, type: :model do
  let(:bible_version) { "NVI" }
  let(:bible) { SimpleBibleLoader.load_bible(bible_version) }

  describe '.load_bible' do
    it 'returns a SimpleBible instance' do
      expect(bible).to be_a(SimpleBibleLoader::SimpleBible)
    end

    it 'loads books from the bible file' do
      expect(bible.books).not_to be_empty
      expect(bible.books.first).to be_a(SimpleBibleLoader::Book)
    end

    it 'loads the first book as Genesis' do
      first_book = bible.books.first
      expect(first_book.title).to eq("Génesis")
    end

    context 'when examining book structure' do
      let(:genesis) { bible.books.first }

      it 'has chapters' do
        expect(genesis.chapters).not_to be_empty
        expect(genesis.chapters.first).to be_a(SimpleBibleLoader::Chapter)
      end

      it 'has the correct first chapter' do
        first_chapter = genesis.chapters.first
        expect(first_chapter.num).to eq(1)
        expect(first_chapter.book_title).to eq("Génesis")
      end

      context 'when examining chapter structure' do
        let(:first_chapter) { genesis.chapters.first }

        it 'has verses' do
          expect(first_chapter.verses).not_to be_empty
          expect(first_chapter.verses.first).to be_a(SimpleBibleLoader::Verse)
        end

        it 'has the correct first verse' do
          first_verse = first_chapter.verses.first
          expect(first_verse.num).to eq(1)
          expect(first_verse.text).to eq("Dios, en el principio, creó los cielos y la tierra.")
          expect(first_verse.book_title).to eq("Génesis")
          expect(first_verse.chapter_num).to eq(1)
        end

        it 'has multiple verses in the first chapter' do
          expect(first_chapter.verses.length).to be > 20
        end
      end
    end

    context 'when bible file does not exist' do
      it 'raises an error for invalid bible version' do
        expect {
          SimpleBibleLoader.load_bible("INVALID")
        }.to raise_error(Errno::EISDIR)
      end
    end
  end

  describe SimpleBibleLoader::Book do
    let(:book) { SimpleBibleLoader::Book.new("Test Book") }

    it 'initializes with a title' do
      expect(book.title).to eq("Test Book")
    end

    it 'has an empty chapters array by default' do
      expect(book.chapters).to eq([])
    end
  end

  describe SimpleBibleLoader::Chapter do
    let(:chapter) { SimpleBibleLoader::Chapter.new(1, "Genesis") }

    it 'initializes with number and book title' do
      expect(chapter.num).to eq(1)
      expect(chapter.book_title).to eq("Genesis")
    end

    it 'has an empty verses array by default' do
      expect(chapter.verses).to eq([])
    end
  end

  describe SimpleBibleLoader::Verse do
    let(:verse) { SimpleBibleLoader::Verse.new(1, "In the beginning...", "Genesis", "Genesis", 1) }

    it 'initializes with all required attributes' do
      expect(verse.num).to eq(1)
      expect(verse.text).to eq("In the beginning...")
      expect(verse.book_id).to eq("Genesis")
      expect(verse.book_title).to eq("Genesis")
      expect(verse.chapter_num).to eq(1)
    end
  end
end
