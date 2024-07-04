#!/bin/bash

if [[ $1 == "test" ]]
then
  PSQL="psql --username=postgres --dbname=worldcuptest -t --no-align -c"
else
  PSQL="psql --no-align -c" #psql --username=freecodecamp --dbname=worldcup -t --no-align -c"
fi

# Do not change code above this line. Use the PSQL variable above to query your database.

CREATE_DATABASE=$($PSQL "CREATE DATABASE worldcup;" 2>&1)

if [[ $CREATE_DATABASE == 'CREATE DATABASE' ]]
then
  echo "DB creado"
  CREATE_GAMES_TABLE=$($PSQL "CREATE TABLE games(game_id SERIAL PRIMARY KEY NOT NULL, year INT NOT NULL, round VARCHAR(15) NOT NULL, winner_id INT NOT NULL, opponent_id INT NOT NULL, winner_goals INT NOT NULL, opponent_goals INT NOT NULL)")
  echo $CREATE_GAMES_TABLE
elif [[ $CREATE_DATABASE = *"worldcup"* ]]
then
  echo "base de dados já existe"
else
  echo "else"
  echo $CREATE_DATABASE
fi

