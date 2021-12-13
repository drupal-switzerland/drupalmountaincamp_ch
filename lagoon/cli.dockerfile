FROM uselagoon/node-16-builder as nodebuilder

COPY yarn.lock gulpfile.js package.json /app/
RUN yarn install --pure-lockfile
COPY web/themes/beaker /app/web/themes/beaker
RUN yarn run gulp compile --env=prod

FROM uselagoon/php-7.4-cli-drupal

COPY composer.json composer.lock load.environment.php /app/
COPY scripts /app/scripts

COPY --from=nodebuilder /app/ /app/
COPY . /app
RUN composer self-update --1
RUN composer install --prefer-dist --no-dev --no-suggest --optimize-autoloader --apcu-autoloader

# Define where the Drupal Root is located
ENV WEBROOT=web
ENV SB_ENVIRONMENT=amazeeio
