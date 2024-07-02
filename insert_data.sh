#!/bin/bash

if [[ $1 == "test" ]]
then
  PSQL="psql --username=postgres --dbname=worldcuptest -t --no-align -c"
else
  PSQL="psql --no-align -c" #psql --username=freecodecamp --dbname=worldcup -t --no-align -c"
fi

# Do not change code above this line. Use the PSQL variable above to query your database.

CREATE_DATABASE=$($PSQL "CREATE DATABASE teste4;" 2>&1)

if [[ $CREATE_DATABASE == 'CREATE DATABASE' ]]
then
  echo "DB creado"
elif [[ $CREATE_DATABASE = *"teste4"* ]]
then
  echo "base de dados já existe"
else
  echo "else"
  echo $CREATE_DATABASE
fi