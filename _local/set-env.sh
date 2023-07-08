#!/bin/bash

########
# source ./set-env.sh
########

# Specify the path to your file
file_path="local.env"

# Read each line of the file
while IFS='=' read -r key value; do
    # Set the environment variable
    export "$key"="$value"

    # Optionally, you can print the variables
    echo "Set $key=$value"
done < "$file_path"
