# Usa una imagen de Ruby 3.2.9 y establece el directorio de trabajo
FROM --platform=linux/amd64 ruby:3.4.5-bullseye
RUN mkdir /holymusic-app-rails
WORKDIR /holymusic-app-rails

# Instala las dependencias necesarias
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
  nodejs \
  postgresql-client \
  libpq-dev \
  build-essential \
  libxrender1 \
  libxext6 \
  libfontconfig1 \
  libfreetype6 \
  libjpeg62-turbo \
  libssl1.1 \
  wkhtmltopdf \
  xfonts-base \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

## System wkhtmltopdf binary will be used, no libjpeg symlink hacks needed

## OpenSSL 1.1 is available natively on bullseye via libssl1.1

# Copia los archivos necesarios al contenedor
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

# Establece las variables de entorno necesarias para ejecutar la aplicación
ENV RAILS_ENV=development \
    WKHTMLTOPDF_PATH=/usr/bin/wkhtmltopdf

# Expone el puerto en el que se ejecutará la aplicación
EXPOSE 3000

# Inicia la aplicación
CMD ["rails", "server", "-b", "0.0.0.0"]
