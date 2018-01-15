module.exports = function (item, username) {
  if (item.downvotedBy.includes(username)) {
    item.downvotedBy.splice(item.downvotedBy.indexOf(username), 1)
  }
  if (!item.upvotedBy.includes(username)) {
    item.upvotedBy.push(username)
  }
  return item
}
