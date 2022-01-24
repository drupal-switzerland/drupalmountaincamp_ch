ARG CLI_IMAGE
FROM ${CLI_IMAGE} as builder

FROM uselagoon/nginx-drupal
RUN echo "~^www.drupalmountaincamp.ch   https://drupalmountaincamp.ch\$request_uri;" >> /etc/nginx/redirects-map.conf

COPY --from=builder /app /app

# Define where the Drupal Root is located
ENV WEBROOT=web
ENV SB_ENVIRONMENT=amazeeio
