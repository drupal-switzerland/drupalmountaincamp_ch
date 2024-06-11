FROM uselagoon/node-20-builder as nodebuilder
COPY package.json /app/
COPY gulpfile.js /app/
COPY web/themes/beaker /app/web/themes/beaker
RUN yarn install --pure-lockfile
RUN yarn run build

FROM uselagoon/php-8.1-cli-drupal as builder
COPY composer.json composer.lock /app/
COPY scripts /app/scripts
RUN composer install --prefer-dist --no-dev --no-suggest --optimize-autoloader --apcu-autoloader
COPY . /app

FROM uselagoon/php-8.1-cli-drupal
COPY --from=nodebuilder /app/ /app/
COPY --from=builder /app /app

# Define where the Drupal Root is located
ENV WEBROOT=web
ENV SB_ENVIRONMENT=amazeeio
