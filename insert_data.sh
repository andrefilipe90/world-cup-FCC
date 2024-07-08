#!/bin/bash

if [[ $1 == "test" ]]
then
  PSQL="psql --username=postgres --dbname=worldcuptest -t --no-align -c"
else
  PSQL="psql --username=andrefilipe90 --dbname=worldcup --no-align -t -c" #psql --username=freecodecamp --dbname=worldcup -t --no-align -c"
fi

# Do not change code above this line. Use the PSQL variable above to query your database.
WIPE_OUT=$($PSQL "TRUNCATE TABLE games, teams")
#echo $WIPE_OUT

cat games.csv | while IFS="," read YEAR ROUND WINNER OPPONENT WINNER_GOALS OPPONENT_GOALS
do
  if [[ $YEAR != 'year' ]]
  then

# verify for winner existance with select for team_id
    WINNER_ID=$($PSQL "SELECT team_id FROM teams WHERE name='$WINNER';")
    # echo -e '\n select '$WINNER' from teams_id says: '$WINNER_ID' \n'

# if not find, insert into teams winner name
    if [[ -z $WINNER_ID ]]
    then
      INSERT_WINNER=$($PSQL "INSERT INTO teams(name) values('$WINNER');")
      # echo -e '\n insert into says: '$INSERT_WINNER' \n'

# select winner team_id
      WINNER_ID=$($PSQL "SELECT team_id FROM teams WHERE name='$WINNER';")
      # echo -e '\n '$WINNER' ID is '$WINNER_ID'\n'
    fi

# verify for opponent existance with select for team_id
    OPPONENT_ID=$($PSQL "SELECT team_id FROM teams WHERE name='$OPPONENT';")
    # echo -e '\n'$OPPONENT' id is '$OPPONENT_ID'\n'

# if not find, inset into teams opponent name
    if [[ -z $OPPONENT_ID ]]; then
      INSERT_OPPONENT=$($PSQL "INSERT INTO teams(name) VALUES('$OPPONENT');")

# select opponent team_id
      OPPONENT_ID=$($PSQL "SELECT team_id FROM teams WHERE name='$OPPONENT';")
      # echo -e '\n'$OPPONENT' id is '$OPPONENT_ID'\n'
    fi

# insert into games the match is respective teams ID's
    INSERT_MATCH=$($PSQL "INSERT INTO games(year, round, winner_id, opponent_id, winner_goals, opponent_goals) VALUES($YEAR, '$ROUND', $WINNER_ID, $OPPONENT_ID, $WINNER_GOALS, $OPPONENT_GOALS);")
    # echo $INSERT_MATCH
  fi
done