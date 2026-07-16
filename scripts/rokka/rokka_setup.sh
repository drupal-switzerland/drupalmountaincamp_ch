#!/bin/bash

UPLOAD_IMAGES=$1

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "-----------------------------------------------------------"
echo "Switch directory to app folder"
cd $DIR/../../
pwd

# Define the path to the .env file
ENV_FILE=drupal/.env

# Check if the .env file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env file not found in the drupal directory."
  exit 1
fi

# Read the ROKKA_API_KEY and ROKKA_ORG from the .env file
ROKKA_API_KEY=$(grep -E '^ROKKA_API_KEY=' "$ENV_FILE" | cut -d '=' -f2)
ROKKA_ORGANIZATION_NAME=$(grep -E '^ROKKA_ORGANIZATION_NAME=' "$ENV_FILE" | cut -d '=' -f2)

# Check if the ROKKA_API_KEY is set
if [ -z "$ROKKA_API_KEY" ]; then
  echo "Error: ROKKA_API_KEY is missing in the .env file."
  exit 1
fi

# Check if the ROKKA_ORG is set
if [ -z "$ROKKA_ORGANIZATION_NAME" ]; then
  echo "Error: ROKKA_ORGANIZATION_NAME is missing in the .env file."
  exit 1
fi

# Define the path to the rokka.yml file
ROKKA_YML_FILE="drupal/rokka.yml"

# Write the rokka.yml file
cat <<EOL > "$ROKKA_YML_FILE"
rokka_cli:
  api_key: $ROKKA_API_KEY
  organization: $ROKKA_ORGANIZATION_NAME
EOL

echo "rokka.yml file created successfully at $ROKKA_YML_FILE"

echo 'Upload the frontend image stack to rokka'
# Download rokka stack and install it.
# shellcheck disable=SC2164
cd "scripts/rokka"
curl -s -o "fe_nuxt_crop.json" "https://raw.githubusercontent.com/rokka-io/nuxt-module/main/stacks/fe_nuxt_crop.json"
curl -s -o "fe_nuxt_no_crop.json" "https://raw.githubusercontent.com/rokka-io/nuxt-module/main/stacks/fe_nuxt_no_crop.json"

for file in fe_nuxt*.json; do
  STACK_NAME=$(basename "$file" .json)
  echo "Uploading stack $STACK_NAME"
  JSON_CONTENT=$(cat "$file")

  curl -s -H 'Content-Type: application/json' \
      -H "Api-Key: ${ROKKA_API_KEY}" \
      -X PUT "https://api.rokka.io/stacks/${ROKKA_ORGANIZATION_NAME}/${STACK_NAME}" \
      -d "$JSON_CONTENT" > /dev/null 2>&1 || true

  rm $file
done

if [ "$UPLOAD_IMAGES" == "upload_images" ]; then
echo 'Upload demo images to rokka'
# shellcheck disable=SC2164
cd "$DIR/../../drupal/dump/images"

for file in *; do
  echo "Uploading stack $file"
  curl -s -H "Api-Key: ${ROKKA_API_KEY}" \
      -X POST -F filedata=@$file "https://api.rokka.io/sourceimages/${ROKKA_ORGANIZATION_NAME}" \
      > /dev/null 2>&1 || true
done
fi

cd $DIR/../../



