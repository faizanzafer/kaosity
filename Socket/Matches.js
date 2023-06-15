const jwt = require("jsonwebtoken");
const { getEnv } = require("../config");
const { getUserfromId } = require("../database/Auth");
const { MatchStatuses } = require("./Constants");

const Matches = [];

const addUserToMatch = (status, user_id) => {
  const activeMatch = getUserActiveMatch(user_id);
  if (activeMatch) {
    return { error: "you are already playing." };
  }

  const match = { user_id, status };
  Matches.push(match);
  return { match };
};

const _addUserToMatch = (status, user_id, friend_user_id) => {
  if (!friend_user_id) {
    const activeMatch = getUserActiveMatch(user_id);
    if (activeMatch) {
      return { error: "you are already playing match." };
    }
    const matches = getUserAllMatches(user_id);
    matches.forEach((_match) => {
      if (_match.status == MatchStatuses.PENDING) removeMatch(_match);
    });
    const match = { user_id, friend_user_id: user_id, status };
    Matches.push(match);
    return { match };
  } else {
    if (user_id == friend_user_id)
      return { error: "friend_user_id should not be your id" };

    const userActiveMatch = getUserActiveMatch(user_id);
    if (userActiveMatch) {
      return { error: "you are already playing match." };
    }
    const friendActiveMatch = getUserActiveMatch(friend_user_id);
    if (friendActiveMatch) {
      return { error: "your friend is already playing match." };
    }
    const matches = getUserAllMatches(user_id);
    matches.forEach((_match) => {
      if (_match.status == MatchStatuses.PENDING) {
        if (
          !(
            _match.user_id == user_id && _match.friend_user_id == friend_user_id
          ) &&
          !(
            _match.friend_user_id == user_id && _match.user_id == friend_user_id
          )
        ) {
          removeMatch(_match);
        }
      }
    });

    const matchRequest = Matches.find(
      (__match) =>
        (__match.user_id == user_id &&
          __match.friend_user_id == friend_user_id) ||
        (__match.friend_user_id == user_id && __match.user_id == friend_user_id)
    );

    if (!matchRequest) {
      const match = { user_id, friend_user_id, status };
      Matches.push(match);
      return { match };
    }

    if (matchRequest.friend_user_id == user_id) {
      const matchRequestIndex = Matches.findIndex(
        (_match) => _match == matchRequest
      );
      if (matchRequestIndex >= 0) {
        Matches[matchRequestIndex].status = MatchStatuses.ACTIVE;
        const match = Matches[matchRequestIndex];
        return { match };
      }
      return { error: "Invalid request" };
    }

    return { error: "Request already sent" };
  }
};

const getUserActiveMatch = (user_id) =>
  Matches.find(
    (match) => match.user_id == user_id && match.status == MatchStatuses.ACTIVE
  );

const getUserAllMatches = (user_id) => {
  return Matches.filter((match) => match.user_id == user_id);
};

const getUserAndFriendUserMatch = (user_id, friend_user_id) => {
  return Matches.find(
    (match) =>
      match.user_id == friend_user_id && match.friend_user_id == user_id
  );
};

const removeMatch = (match) => {
  const index = Matches.findIndex((_match) => _match.user_id == match.user_id);

  if (index >= 0) return Matches.splice(index, 1)[0];
  return null;
};

module.exports = {
  getUserActiveMatch,
  addUserToMatch,
  getUserAllMatches,
  removeMatch,
  getUserAndFriendUserMatch,
};
