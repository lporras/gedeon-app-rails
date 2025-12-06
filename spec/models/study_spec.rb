# == Schema Information
#
# Table name: studies
#
#  id          :bigint           not null, primary key
#  content     :text
#  raw_content :text
#  title       :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  account_id  :bigint
#
# Indexes
#
#  index_studies_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require 'rails_helper'

RSpec.describe Study, type: :model do
  it_behaves_like "acts_as_tenant model"
end
