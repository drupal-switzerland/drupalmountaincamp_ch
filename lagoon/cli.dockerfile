FROM amazeeio/node:8-builder as nodebuilder

COPY yarn.lock gulpfile.js package.json /app/
RUN yarn install --pure-lockfile
COPY web/themes/beaker /app/web/themes/beaker
RUN yarn run gulp compile --env=prod

FROM amazeeio/php:7.2-cli-drupal

COPY composer.json composer.lock load.environment.php /app/
COPY scripts /app/scripts

COPY --from=nodebuilder /app/ /app/
COPY . /app
RUN composer install --prefer-dist --no-dev --no-suggest --optimize-autoloader --apcu-autoloader

# Define where the Drupal Root is located
ENV WEBROOT=web
ENV SB_ENVIRONMENT=amazeeio
