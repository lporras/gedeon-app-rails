RSpec.shared_context "authenticated admin with subdomain" do
  let(:account) { create(:account) }
  let(:admin) { create(:admin_user, account: account) }

  before do
    ActsAsTenant.current_tenant = account
    Capybara.app_host = "http://#{account.subdomain}.lvh.me:3000"
    login_as(admin, scope: :admin_user)
  end

  after do
    Capybara.app_host = 'http://lvh.me:3000'
  end
end
