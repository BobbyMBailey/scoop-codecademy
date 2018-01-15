module.exports = function (item, username) {
  if (item.upvotedBy.includes(username)) {
    item.upvotedBy.splice(item.upvotedBy.indexOf(username), 1)
  }
  if (!item.downvotedBy.includes(username)) {
    item.downvotedBy.push(username)
  }
  return item
}
