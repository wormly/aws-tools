#!/bin/bash

export AWS_REGION=eu-west-1

node delete-snapshots.js --regexp "Integration snapshot"