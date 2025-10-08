RSpec.shared_examples "acts_as_tenant model" do
  describe "acts_as_tenant behavior" do
    let(:account1) { FactoryBot.create(:account) }
    let(:account2) { FactoryBot.create(:account) }

    it "belongs to account" do
      expect(described_class.reflect_on_association(:account).macro).to eq(:belongs_to)
    end

    it "scopes records to the current tenant" do
      record1 = nil
      record2 = nil

      ActsAsTenant.with_tenant(account1) do
        record1 = FactoryBot.create(described_class.name.underscore.to_sym)
      end

      ActsAsTenant.with_tenant(account2) do
        record2 = FactoryBot.create(described_class.name.underscore.to_sym)
      end

      ActsAsTenant.with_tenant(account1) do
        expect(described_class.all).to include(record1)
        expect(described_class.all).not_to include(record2)
      end

      ActsAsTenant.with_tenant(account2) do
        expect(described_class.all).to include(record2)
        expect(described_class.all).not_to include(record1)
      end
    end

    it "automatically sets account_id on create" do
      record = nil

      ActsAsTenant.with_tenant(account1) do
        record = FactoryBot.create(described_class.name.underscore.to_sym)
      end

      expect(record.account_id).to eq(account1.id)
    end

    it "prevents accessing records from different tenant" do
      record = nil

      ActsAsTenant.with_tenant(account1) do
        record = FactoryBot.create(described_class.name.underscore.to_sym)
      end

      ActsAsTenant.with_tenant(account2) do
        expect { described_class.find(record.id) }.to raise_error(ActiveRecord::RecordNotFound)
      end
    end
  end
end
