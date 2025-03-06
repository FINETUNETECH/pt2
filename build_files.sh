#!/bin/bash

# Install python and pip if they don't exist
if ! command -v python3 &> /dev/null; then
    apt-get update && apt-get install -y python3
fi
if ! command -v pip3 &> /dev/null; then
    apt-get update && apt-get install -y python3-pip
fi

# Use python3 and pip3 explicitly
python3 -m pip install -r requirements.txt
python3 manage.py collectstatic --noinput
python3 manage.py migrate
