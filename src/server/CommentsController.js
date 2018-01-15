const BaseController = require('./BaseController')

let Controller = function (database) {
  this.database = database
}

Controller.prototype.getComments = function (url, request) {
  return BaseController.getCollectionByKey('comments', url, request, this.database)
}

Controller.prototype.createComment = function (url, request) {
  if (!BaseController.isUserAuthenticated(request, this.database.users)) {
    return {
      body: {'errorMessage': 'User is Not Authenticated / Logged In'},
      status: 401
    }
  }

  if (!BaseController.hasValidEntity(request.body, ['comment']) &&
    !BaseController.hasValidEntity(request.body.comment, {'body': /\S+/i})) {
    return {
      body: {'errorMessage': 'One of the expected keys does not exist on the request body'},
      status: 400
    }
  }

  // Creating the comment object with the required keys
  const comment = {
    id: this.database.nextCommentId++,
    body: request.body.comment.body,
    username: request.body.username,
    articleId: request.body.comment.articleId,
    upvotedBy: [],
    downvotedBy: []
  }
  // Saving the Entity
  this.database.comments[comment.id] = comment
  this.database.users[comment.username].commentIds.push(comment.id)
  this.database.articles[comment.articleId].commentIds.push(comment.id)
  return {
    body: {comment: comment},
    status: 201
  }
}

Controller.prototype.getComment = function (url, request) {
  const id = Number(url.split('/').filter(segment => segment)[1])
  const entity = this.database.comment[id]
  const response = {}

  if (entity) {
    response.body = {comment: entity}
    response.status = 200
  } else if (id) {
    response.status = 404
  } else {
    response.status = 400
  }

  return response
}

Controller.prototype.updateComments = function (url, request) {
  return {status: 500, body: 'Not implemented'}
}

Controller.prototype.deleteComments = function (url, request) {
  return {status: 500, body: 'Not implemented'}
}

Controller.prototype.upvoteComment = function (url, request) {
  return {status: 500, body: 'Not implemented'}
}

Controller.prototype.downvoteComment = function (url, request) {
  return {status: 500, body: 'Not implemented'}
}

module.exports = Controller
