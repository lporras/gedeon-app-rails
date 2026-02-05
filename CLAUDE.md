# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gedeon (HolyMusic) is a Rails 7.0.5 worship/song management app. It handles songs with ChordPro notation, playlists with sections, Bible scriptures, and video links. It uses subdomain-based multi-tenancy via `acts_as_tenant` and provides an ActiveAdmin panel, a public-facing Hotwire frontend, and a versioned REST API.

## Common Commands

### Development Setup
```bash
docker compose up                          # Start PostgreSQL 17
bundle exec rails db:prepare               # Create/migrate database
foreman start -f Procfile.dev              # Start Rails + Tailwind + esbuild watchers
```

### Testing
```bash
bundle exec rspec                          # Run full test suite
bundle exec rspec spec/models/             # Run model specs only
bundle exec rspec spec/requests/           # Run request specs only
bundle exec rspec spec/models/song_spec.rb # Run a single spec file
bundle exec rspec spec/models/song_spec.rb:15  # Run a specific test by line
```

RSpec is configured with documentation format and SimpleCov coverage output to `coverage/`.

### Asset Building
```bash
yarn build              # Bundle JS with esbuild
yarn build:css          # Compile Tailwind CSS
yarn build:css:watch    # Tailwind watch mode
yarn watch              # esbuild watch mode
```

### Database
```bash
bundle exec rails db:create db:migrate db:seed
```
Seed tasks include `songs:import` and `songs:sort_by_title`.

## Architecture

### Multi-Tenancy
- `acts_as_tenant` scopes data by `Account`, resolved from subdomains in `ApplicationController`
- API defaults to tenant "ici-santiago" in `Api::V1::ApiBaseController`
- Capybara tests use `lvh.me` for subdomain testing

### Key Models & Relationships
- **Account** → top-level tenant
- **Playlist** → has many **PlaylistSections** → has many **PlaylistItems** → belongs to **Song**
- **Song** → has many **VideoLinks** (through join table)
- **Scripture** → belongs to **PlaylistSection** (bible verses with book/chapter/version metadata)
- **Study** → standalone HTML content
- **AdminUser** → Devise-authenticated admin accounts

### Controllers & Routing
- `HomeController` — root page, main `/app` view, playlist display
- `SongsController` — song modals (chords, videos)
- `Api::V1::SongsController` / `Api::V1::PlaylistsController` — REST API at `/api/v1/`
- `ManifestsController` — per-subdomain PWA manifest
- Admin panel at `/admin` (ActiveAdmin + Devise)
- API docs at `/api-docs` (Rswag/Swagger)

### Frontend Stack
- **Tailwind CSS** + **DaisyUI** for styling
- **Stimulus** controllers in `app/javascript/controllers/` for interactivity (audio player, theme toggle, tabs, modals)
- **Turbo** (Hotwire) for page updates
- **esbuild** for JS bundling

### API Serialization
`ActiveModelSerializers` in `app/serializers/` — `SongSerializer`, `PlaylistSerializer`, `PlaylistSectionSerializer`, `PlaylistItemSerializer`, `VideoLinkSerializer`.

### File Uploads
CarrierWave with AWS S3 in production, local storage in dev/test. Uploaders in `app/uploaders/`.

### PDF & Presentations
WickedPDF (wkhtmltopdf) for PDF generation. Reveal.js integration for slide presentations from playlists.

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Ruby | 3.4.5 |
| Rails | 7.0.5 |
| Database | PostgreSQL 17 (Docker) |
| Server | Puma |
| Auth | Devise |
| Admin | ActiveAdmin |
| CSS | Tailwind + DaisyUI |
| JS | esbuild + Stimulus + Turbo |
| Testing | RSpec + FactoryBot + Shoulda Matchers + Capybara |
| Monitoring | NewRelic + Rollbar |
| Deployment | Heroku (CI via GitHub Actions) |

## CI/CD

GitHub Actions (`.github/workflows/ruby.yml`) runs on push to master/development and PRs to master. It sets up PostgreSQL 17, Ruby 3.4.5, Node (from .nvmrc), installs system deps (wkhtmltopdf), runs `db:prepare`, builds assets, executes RSpec, and uploads coverage to Codecov.

## Environment Variables

Key env vars (see `.env.sample`): `DATABASE_URL`, `DB_USERNAME`, `DB_PASS`, `HOME_REDIRECT_TO`, `S3_BUCKET_NAME`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`.
